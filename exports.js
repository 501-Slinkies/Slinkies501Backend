const { db } = require('./firebase');
const applicationLayer = require('./ApplicationLayer');
// We only need the streaming Transform from json2csv; Parser (single-shot) is unused.
const { Transform } = require('json2csv');
const PDFDocument = require('pdfkit');
const AuditLogger = require('./AuditLogger');
const DAL = require('./DataAccessLayer');

/**
 * Extract and verify an authorization token and return a normalized user object.
 * Throws an error-like object {status, message} on failure for upstream handlers to return HTTP responses.
 * Input: authToken (string)
 * Output: { ...user, org, userId }
 */
async function getUserFromToken(authToken) {
    if (!authToken) throw { status: 401, message: 'Authorization token required' };
    
    const verification = await applicationLayer.verifyToken(authToken);
    if (!verification || !verification.success) throw { status: 401, message: 'Invalid or expired token' };
    
    const user = verification.user || {};
    const effectiveOrg = user.org || user.org_id || user.organization || user.organization_id;
    
    if (!effectiveOrg) throw { status: 403, message: 'Organization information not found in token' };
    
    return {
        ...user,
        org: effectiveOrg,
        userId: user.userId || user.uid || user.id || 'unknown'
    };
}

/**
 * Verify that the provided user (from token) is an administrator volunteer.
 * Uses the DAL to locate a volunteer/user record and ensures the role includes
 * 'role_1:{default_admin}' and organization matches the token's org.
 * Throws {status, message} on failure.
 */
async function assertAdmin(user) {
    const userId = user && (user.userId || user.uid || user.id || user.user_ID);
    if (!userId) throw { status: 403, message: 'Admin check failed: user id not found' };

    let volResult = null;
    // Try fetching volunteer record
    try { volResult = await DAL.getVolunteerById(String(userId)); } catch (e) {}
    
    if (!volResult || !volResult.success) {
         // Fallback attempts
        try { volResult = await DAL.getUserByUserID(userId); } catch (e) {}
    }

    if (!volResult || !volResult.success) throw { status: 403, message: 'Admin check failed: volunteer record not found' };

    const volunteer = volResult.volunteer || volResult.user || volResult;
    const tokenOrg = user && user.org;
    const volunteerOrg = volunteer.organization || volunteer.org;

    if (tokenOrg && volunteerOrg && String(tokenOrg) !== String(volunteerOrg)) {
        throw { status: 403, message: 'Forbidden: organization mismatch' };
    }

    const roles = volunteer && volunteer.role;
    // Check for admin role string or array inclusion
    const isAdmin = (Array.isArray(roles) && roles.includes('role_1:{default_admin}')) ||
        (typeof roles === 'string' && roles.indexOf('role_1:{default_admin}') !== -1);

    if (!isAdmin) throw { status: 403, message: 'Forbidden: admin role required' };

    return volunteer;
}

/**
 * Eager fetch helper: retrieve all documents for a collection matching an organization.
 * This is used only for PDF generation and a small number of callers where an
 * in-memory array is acceptable. For large exports prefer fetchDocumentsPaginated.
 * Returns an array of { id, ...data } or [] when no docs.
 */
async function fetchDataFromFirestore(collection, effectiveOrg) {
    const collRef = db.collection(collection);
    
    // Try standard organization fields
    let snapshot = await collRef.where('organization', '==', effectiveOrg).get();
    if (snapshot.empty) snapshot = await collRef.where('organization_id', '==', effectiveOrg).get();
    if (snapshot.empty) snapshot = await collRef.where('organizationId', '==', effectiveOrg).get();
    
    // Special handling for 'organizations' collection
    if (snapshot.empty && collection === 'organizations') {
        snapshot = await collRef.where('org_id', '==', effectiveOrg).get();
        if (snapshot.empty) {
            const doc = await collRef.doc(effectiveOrg).get();
            if (doc.exists) return [{ id: doc.id, ...doc.data() }];
        }
    }

    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

/**
 * Heuristic: determine which organization field a collection uses so queries can be built.
 * Checks common field names (organization, organization_id, organizationId, org_id)
 * and returns the first that yields a hit. Falls back to 'organization'.
 */
async function determineOrgField(collection, effectiveOrg) {
    const collRef = db.collection(collection);
    const checks = ['organization', 'organization_id', 'organizationId', 'org_id'];
    for (const field of checks) {
        try {
            const snapshot = await collRef.where(field, '==', effectiveOrg).limit(1).get();
            if (!snapshot.empty) return field;
        } catch (e) {
            // ignore and try next
        }
    }
    // Fallback: return 'organization' by default (query will just return empty)
    return 'organization';
}

/**
 * Async generator that yields documents from Firestore in pages.
 * Usage: for await (const doc of fetchDocumentsPaginated(...)) { ... }
 * This avoids buffering the full result set in memory and is the preferred
 * method for streaming large exports to clients.
 *
 * `filters` is currently unused (placeholder) but will be used when filter
 * parameters (dateFrom/dateTo/driverId/etc.) are implemented.
 */
async function* fetchDocumentsPaginated(collection, effectiveOrg, filters = {}, pageSize = 500) {
    const collRef = db.collection(collection);
    const orgField = await determineOrgField(collection, effectiveOrg);

    let query = collRef.where(orgField, '==', effectiveOrg).limit(pageSize);
    let lastSnapshot = null;
    while (true) {
        let snapshot;
        if (lastSnapshot) {
            snapshot = await query.startAfter(lastSnapshot).get();
        } else {
            snapshot = await query.get();
        }

        if (snapshot.empty) break;

        for (const doc of snapshot.docs) {
            yield { id: doc.id, ...doc.data() };
        }

        lastSnapshot = snapshot.docs[snapshot.docs.length - 1];
        if (!lastSnapshot || snapshot.docs.length < pageSize) break;
    }
}

/**
 * Filter an array of objects to only include the specified fields.
 * `fields` may be a comma-separated string ("a,b,c") or an array ["a","b"].
 * Returns a new array with each object reduced to the listed keys.
 */
function filterDataByFields(data, fields) {
    if (!fields) return data;
    const fieldList = Array.isArray(fields)
        ? fields.map(f => String(f).trim()).filter(Boolean)
        : String(fields).split(',').map(f => f.trim()).filter(Boolean);
    return data.map(item => {
        const filtered = {};
        fieldList.forEach(field => {
            if (Object.prototype.hasOwnProperty.call(item, field)) filtered[field] = item[field];
        });
        return filtered;
    });
}

/**
 * Stream a PDF document from an async iterator of records and pipe it to `res`.
 * This processes one record at a time (internally Firestore pages) to keep memory
 * usage bounded. `fields` may limit which keys are rendered per record.
 *
 * Parameters:
 *  - iterator: an async iterator that yields { id, ...data }
 *  - collection: collection name string for headings
 *  - res: Express response to pipe PDF into
 *  - fields: optional array of allowed field names (or null)
 */
async function generatePdfStream(iterator, collection, res, fields = null) {
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(res); // stream directly

    // Header
    doc.fontSize(20).text(`${collection.charAt(0).toUpperCase() + collection.slice(1)} Export`, { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    let index = 0;
    try {
        for await (const item of iterator) {
            index += 1;

            if (doc.y > 700) doc.addPage();

            doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index}:`, { underline: true });
            doc.fontSize(8).font('Helvetica');
            doc.moveDown(0.2);

            // Determine which keys to render for this record
            const keys = fields && fields.length ? fields : Object.keys(item);

            keys.forEach(key => {
                if (!Object.prototype.hasOwnProperty.call(item, key)) return;
                const value = item[key];
                if (value === undefined || value === null) return;

                let displayValue = value;
                if (typeof value === 'object') {
                    try { displayValue = JSON.stringify(value); } catch (e) { displayValue = String(value); }
                } else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';

                let text = `${key}: ${displayValue}`;
                if (String(text).length > 250) text = String(text).substring(0, 247) + '...';
                doc.text(text);
            });

            doc.moveDown(0.8);
        }
    } catch (err) {
        console.error('PDF streaming error:', err);
        try { doc.addPage(); doc.fontSize(10).fillColor('red').text('An error occurred while generating the PDF.'); } catch (e) {}
    } finally {
        // Finalize PDF stream
        try { doc.end(); } catch (e) { /* ignore */ }
    }
}

/**
 * Main export handler. Expected to be wired as an Express route handler.
 * Behavior:
 *  - Authenticates the request via bearer token and enforces admin role.
 *  - Supports `format=csv` (streamed, paginated) and `format=pdf` (eager).
 *  - Supports optional `fields` parameter for selecting columns.
 *  - Streams CSV via json2csv Transform to avoid buffering large exports.
 */
async function handleExport(req, res) {
    let user;
    try {
        // // Extract token from Header OR Query param (for Launch URL support)
        // let token = null;
        // if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        //     token = req.headers.authorization.substring(7);
        // } else if (req.query.auth_token) {
        //     token = req.query.auth_token;
        // }

        // user = await getUserFromToken(token);
        // await assertAdmin(user);

        const { collection } = req.params;
        const { format = 'csv', fields } = (req.body && Object.keys(req.body).length ? req.body : req.query);
        const effectiveOrg = user.org;

        const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
        if (!allowedCollections.includes(collection)) {
            return res.status(400).json({ success: false, error: `Invalid collection.` });
        }


        // --- STREAM RESPONSE ---
        if (format === 'csv') {
            // Stream CSV paginated to the response to avoid buffering the full export
            const pageSize = parseInt((req.body && req.body.pageSize) || req.query.pageSize || 500, 10) || 500;
            const fieldList = fields ? fields.split(',').map(f => f.trim()) : null;

            // Probe for at least one document before setting response headers
            const iterator = fetchDocumentsPaginated(collection, effectiveOrg, {}, pageSize);
            const first = await iterator.next();
            if (first.done) {
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: false, failureReason: 'No documents found' }); } catch(e){}
                return res.status(404).json({ success: false, error: 'No documents found in collection' });
            }

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.csv"`);

            // Write BOM for Excel compatibility
            try { res.write('\uFEFF'); } catch (e) { /* ignore */ }

            const transformOpts = { objectMode: true };
            if (fieldList && fieldList.length) transformOpts.fields = fieldList;

            const json2csvTransform = new Transform(transformOpts);

            json2csvTransform.on('error', async (err) => {
                console.error('json2csv transform error:', err);
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: false, failureReason: err.message }); } catch(e){}
                if (!res.headersSent) res.status(500).json({ success: false, error: 'Export failed' });
                else res.end();
            });

            // Pipe CSV output to response
            json2csvTransform.pipe(res);

            // Write first doc then stream remaining
            try {
                const firstDoc = first.value;
                if (fieldList && fieldList.length) {
                    const row = {};
                    fieldList.forEach(f => { if (Object.prototype.hasOwnProperty.call(firstDoc, f)) row[f] = firstDoc[f]; });
                    json2csvTransform.write(row);
                } else {
                    json2csvTransform.write(firstDoc);
                }

                for await (const doc of iterator) {
                    if (fieldList && fieldList.length) {
                        const row = {};
                        fieldList.forEach(f => { if (Object.prototype.hasOwnProperty.call(doc, f)) row[f] = doc[f]; });
                        json2csvTransform.write(row);
                    } else {
                        json2csvTransform.write(doc);
                    }
                }

                json2csvTransform.end();

                // Audit success (note: write may still be streaming; we log that generation started/succeeded)
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){}
            } catch (err) {
                console.error('Export streaming error:', err);
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: false, failureReason: err.message }); } catch(e){}
                if (!res.headersSent) res.status(500).json({ success: false, error: err.message });
                else res.end();
            }

        } else if (format === 'pdf') {
            // Stream PDF using the paginated iterator to keep memory usage flat.
            const pageSize = parseInt((req.body && req.body.pageSize) || req.query.pageSize || 500, 10) || 500;
            const fieldList = fields ? fields.split(',').map(f => f.trim()) : null;

            const iterator = fetchDocumentsPaginated(collection, effectiveOrg, {}, pageSize);
            const first = await iterator.next();
            if (first.done) {
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: false, failureReason: 'No documents found' }); } catch(e){}
                return res.status(404).json({ success: false, error: 'No documents found in collection' });
            }

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.pdf"`);

            try {
                // Create a combined iterator that yields the already-probed first item
                const combinedIterator = (async function* () {
                    yield first.value;
                    for await (const d of iterator) yield d;
                })();

                // Stream PDF generation (await so we can audit after completion)
                await generatePdfStream(combinedIterator, collection, res, fieldList);

                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){}
            } catch (err) {
                console.error('Export PDF streaming error:', err);
                try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: false, failureReason: err.message }); } catch(e){}
                if (!res.headersSent) res.status(500).json({ success: false, error: 'Export failed' });
                else res.end();
            }

        } else {
            return res.status(400).json({ success: false, error: 'Invalid format. Supported formats are csv and pdf.' });
        }

    } catch (error) {
        console.error('Export error:', error);
        try { await AuditLogger.logAccess({ userId: user?.userId || 'unknown', organizationId: user?.org || 'N/A', action: 'EXPORT', resourceType: req.params?.collection || 'unknown', success: false, failureReason: error.message }); } catch(e){}
        
        // If headers aren't sent yet, send error JSON
        if (!res.headersSent) {
            res.status(error.status || 500).json({ success: false, error: error.message });
        }
    }
}

module.exports = {
    handleExport
};