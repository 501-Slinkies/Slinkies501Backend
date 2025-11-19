const { admin, db } = require('./firebase');
const applicationLayer = require('./ApplicationLayer');
const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const AuditLogger = require('./AuditLogger');
const { getClientIp, getUserAgent } = require('./middleware/securityMiddleware');
const DAL = require('./DataAccessLayer');

// Validate GCS bucket env early
const GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'your-project-id.appspot.com';
const bucket = admin.storage().bucket(GCS_BUCKET_NAME);

// Middleware to verify JWT using ApplicationLayer
async function verifyExportToken(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				error: 'Authorization token required'
			});
		}

		const token = authHeader.substring(7);
		const verification = await applicationLayer.verifyToken(token);

		if (!verification || !verification.success) {
			return res.status(401).json({
				success: false,
				error: 'Invalid or expired token'
			});
		}

		const user = verification.user || {};

		// Normalize organization field
		const effectiveOrg = user.org || user.org_id || user.organization || user.organization_id;

		if (!effectiveOrg) {
			return res.status(403).json({
				success: false,
				error: 'Organization information not found in token'
			});
		}

		// Attach user info to request
		req.user = {
			...user,
			org: effectiveOrg,
			userId: user.userId || user.uid || user.id || 'unknown'
		};

		next();
	} catch (error) {
		console.error('Token verification error:', error);
		return res.status(500).json({
			success: false,
			error: 'Token verification failed'
		});
	}
}

// Data fetching logic
async function fetchDataFromFirestore(collection, effectiveOrg) {
	const collRef = db.collection(collection);
	let snapshot = await collRef.where('organization', '==', effectiveOrg).get();

	if (snapshot.empty) {
		snapshot = await collRef.where('organization_id', '==', effectiveOrg).get();
	}
	if (snapshot.empty) {
		snapshot = await collRef.where('organizationId', '==', effectiveOrg).get();
	}
	if (snapshot.empty && collection === 'organizations') {
		snapshot = await collRef.where('org_id', '==', effectiveOrg).get();
		if (snapshot.empty) {
			const doc = await collRef.doc(effectiveOrg).get();
			if (doc.exists) {
				return [{ id: doc.id, ...doc.data() }];
			}
		}
	}

	if (snapshot.empty) return [];

	return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Field filtering logic
function filterDataByFields(data, fields) {
	if (!fields) return data;
	const fieldList = fields.split(',').map(f => f.trim());
	return data.map(item => {
		const filtered = {};
		fieldList.forEach(field => {
			if (Object.prototype.hasOwnProperty.call(item, field)) filtered[field] = item[field];
		});
		return filtered;
	});
}

// PDF generation logic (returns buffer)
function generatePdfBuffer(data, collection) {
	return new Promise((resolve, reject) => {
		try {
			const doc = new PDFDocument({ margin: 50 });
			const buffers = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => resolve(Buffer.concat(buffers)));
			doc.on('error', reject);

			doc.fontSize(20).text(`${collection.charAt(0).toUpperCase() + collection.slice(1)} Export`, { align: 'center' });
			doc.moveDown();
			doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
			doc.text(`Total Records: ${data.length}`, { align: 'center' });
			doc.moveDown(2);

			const allKeys = new Set();
			data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
			const keys = Array.from(allKeys);

			doc.fontSize(8);
			data.forEach((item, index) => {
				if (doc.y > 700) doc.addPage();

				doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, { underline: true });
				doc.fontSize(8).font('Helvetica');
				doc.moveDown(0.3);

				keys.forEach(key => {
					const value = item[key];
					if (value !== undefined && value !== null) {
						let displayValue = value;
						if (typeof value === 'object') displayValue = JSON.stringify(value);
						else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';

						if (String(displayValue).length > 80) displayValue = String(displayValue).substring(0, 77) + '...';
						doc.text(`${key}: ${displayValue}`);
					}
				});
				doc.moveDown(1);
			});

			doc.end();
		} catch (err) {
			reject(err);
		}
	});
}

// POST /prepare handler
async function prepareExport(req, res) {
	try {
		const { user } = req;
		const effectiveOrg = user.org;
		const { collection, format = 'csv', fields } = req.body;

		const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
		if (!allowedCollections.includes(collection)) {
			return res.status(400).json({ success: false, error: `Invalid collection. Allowed collections: ${allowedCollections.join(', ')}` });
		}

		let data = await fetchDataFromFirestore(collection, effectiveOrg);
		if (data.length === 0) return res.status(404).json({ success: false, error: 'No documents found in collection' });

		data = filterDataByFields(data, fields);

		let fileBuffer;
		let contentType;
		let fileExtension;

		if (format === 'csv') {
			const parser = new Parser();
			const csv = parser.parse(data);
			// Prepend BOM for Excel compatibility
			const bom = '\uFEFF';
			fileBuffer = Buffer.from(bom + csv, 'utf8');
			contentType = 'text/csv; charset=utf-8';
			fileExtension = 'csv';
		} else if (format === 'pdf') {
			fileBuffer = await generatePdfBuffer(data, collection);
			contentType = 'application/pdf';
			fileExtension = 'pdf';
		} else {
			return res.status(400).json({ success: false, error: 'Invalid format. Supported formats are csv and pdf.' });
		}

		const uniqueFilename = `exports/${user.userId || 'unknown'}/${collection}-${Date.now()}.${fileExtension}`;
		const file = bucket.file(uniqueFilename);

		await file.save(fileBuffer, { metadata: { contentType } });

		const [signedUrl] = await file.getSignedUrl({ action: 'read', expires: new Date(Date.now() + 5 * 60 * 1000) });

		// Audit log
		try {
			await AuditLogger.logAccess({
				userId: req.user.userId,
				userEmail: req.user.email_address || 'unknown',
				userRole: req.user.role || 'unknown',
				organizationId: effectiveOrg,
				action: 'EXPORT',
				resourceType: collection,
				resourceId: uniqueFilename,
				ipAddress: getClientIp ? getClientIp(req) : req.ip,
				userAgent: getUserAgent ? getUserAgent(req) : req.get('user-agent'),
				success: true
			});
		} catch (e) {
			console.warn('Failed to write audit log for export:', e && e.message);
		}

		res.status(200).json({ success: true, downloadUrl: signedUrl });
	} catch (error) {
		console.error('Export error:', error);
		// audit failure
		try {
			await AuditLogger.logAccess({
				userId: req.user?.userId || 'unknown',
				userEmail: req.user?.email_address || 'unknown',
				userRole: req.user?.role || 'unknown',
				organizationId: req.user?.org || 'N/A',
				action: 'EXPORT',
				resourceType: req.body?.collection || 'unknown',
				resourceId: 'N/A',
				ipAddress: getClientIp ? getClientIp(req) : req.ip,
				userAgent: getUserAgent ? getUserAgent(req) : req.get('user-agent'),
				success: false,
				failureReason: error.message
			});
		} catch (e) {
			/* swallow */
		}

		res.status(500).json({ success: false, error: error.message });
	}
}

// GET /:collection handler
async function getExport(req, res) {
	try {
		const { collection } = req.params;
		const { format = 'csv', fields } = req.query;
		const effectiveOrg = req.user.org;

		const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
		if (!allowedCollections.includes(collection)) return res.status(400).json({ success: false, error: `Invalid collection. Allowed collections: ${allowedCollections.join(', ')}` });

		let data = await fetchDataFromFirestore(collection, effectiveOrg);
		if (data.length === 0) return res.status(404).json({ success: false, error: 'No documents found in collection' });

		data = filterDataByFields(data, fields);

		if (format === 'csv') {
			const parser = new Parser();
			const csv = parser.parse(data);
			const bom = '\uFEFF';
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.csv"`);
			// Audit
			try { await AuditLogger.logAccess({ userId: req.user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){/*noop*/}
			return res.send(bom + csv);
		} else if (format === 'pdf') {
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.pdf"`);
			const doc = new PDFDocument({ margin: 50 });
			// Audit
			try { await AuditLogger.logAccess({ userId: req.user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){/*noop*/}

			doc.pipe(res);
			doc.fontSize(20).text(`${collection.charAt(0).toUpperCase() + collection.slice(1)} Export`, { align: 'center' });
			doc.moveDown();
			doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
			doc.text(`Total Records: ${data.length}`, { align: 'center' });
			doc.moveDown(2);

			const allKeys = new Set();
			data.forEach(item => Object.keys(item).forEach(key => allKeys.add(key)));
			const keys = Array.from(allKeys);

			doc.fontSize(8);
			data.forEach((item, index) => {
				if (doc.y > 700) doc.addPage();

				doc.fontSize(10).font('Helvetica-Bold').text(`Record ${index + 1}:`, { underline: true });
				doc.fontSize(8).font('Helvetica');
				doc.moveDown(0.3);

				keys.forEach(key => {
					const value = item[key];
					if (value !== undefined && value !== null) {
						let displayValue = value;
						if (typeof value === 'object') displayValue = JSON.stringify(value);
						else if (typeof value === 'boolean') displayValue = value ? 'Yes' : 'No';

						if (String(displayValue).length > 80) displayValue = String(displayValue).substring(0, 77) + '...';
						doc.text(`${key}: ${displayValue}`);
					}
				});
				doc.moveDown(1);
			});

			doc.end();
		} else {
			return res.status(400).json({ success: false, error: 'Invalid format. Supported formats are csv and pdf.' });
		}
	} catch (error) {
		console.error('Export error:', error);
		try { await AuditLogger.logAccess({ userId: req.user?.userId || 'unknown', organizationId: req.user?.org || 'N/A', action: 'EXPORT', resourceType: req.params?.collection || 'unknown', success: false, failureReason: error.message }); } catch(e){/*noop*/}
		res.status(500).json({ success: false, error: error.message });
	}
}

module.exports = {
	// Middleware: ensure the requesting user is an admin (volunteer.role contains 'role_1:{default_admin}')
	ensureAdmin: async function ensureAdmin(req, res, next) {
		try {
			const userId = req.user && (req.user.userId || req.user.uid || req.user.id || req.user.user_ID);
			if (!userId) return res.status(403).json({ success: false, error: 'Admin check failed: user id not found in token' });

			// Try authoritative lookup by document id first
			let volResult = null;
			try {
				volResult = await DAL.getVolunteerById(String(userId));
			} catch (e) {
				// continue to fallbacks
			}

			// Fallbacks: try getUserByUserID or getUserById if available
			if (!volResult || !volResult.success) {
				try {
					volResult = await DAL.getUserByUserID(userId);
				} catch (e) { /* ignore */ }
			}
			if (!volResult || !volResult.success) {
				try {
					volResult = await DAL.getUserById(String(userId));
				} catch (e) { /* ignore */ }
			}

			if (!volResult || !volResult.success) {
				return res.status(403).json({ success: false, error: 'Admin check failed: volunteer record not found' });
			}

			// normalize returned object (DAL uses different keys for different helpers)
			const volunteer = volResult.volunteer || volResult.user || volResult.user || volResult;

			// Verify organization matches token org (defense-in-depth)
			const tokenOrg = req.user && req.user.org;
			const volunteerOrg = volunteer.organization || volunteer.org || volunteer.organization_id || volunteer.org_id;
			if (tokenOrg && volunteerOrg && String(tokenOrg) !== String(volunteerOrg)) {
				return res.status(403).json({ success: false, error: 'Forbidden: organization mismatch' });
			}

			const roles = volunteer && volunteer.role;
			const isAdmin = (Array.isArray(roles) && roles.includes('role_1:{default_admin}')) || (typeof roles === 'string' && roles.indexOf('role_1:{default_admin}') !== -1);

			if (!isAdmin) return res.status(403).json({ success: false, error: 'Forbidden: admin role required' });

			req.user.isAdmin = true;
			next();
		} catch (err) {
			console.error('Admin check error:', err);
			return res.status(500).json({ success: false, error: 'Admin check failed' });
		}
	},
	verifyExportToken,
	fetchDataFromFirestore,
	filterDataByFields,
	generatePdfBuffer,
	prepareExport,
	getExport
};

