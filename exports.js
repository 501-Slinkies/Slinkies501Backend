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
			return res.status(401).json({ success: false, error: 'Authorization token required' });
		}

		const token = authHeader.substring(7);
		const user = await getUserFromToken(token);
		req.user = user;
		next();
	} catch (err) {
		console.error('Token verification error (wrapper):', err);
		return res.status(err.status || 500).json({ success: false, error: err.message || 'Token verification failed' });
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

// Helper: verify token and return normalized user or throw an error-like object
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

// Helper: assert the given user (from token) is an admin volunteer in the DAL
async function assertAdmin(user) {
	const userId = user && (user.userId || user.uid || user.id || user.user_ID);
	if (!userId) throw { status: 403, message: 'Admin check failed: user id not found in token' };

	let volResult = null;
	try {
		volResult = await DAL.getVolunteerById(String(userId));
	} catch (e) {
		// ignore and try fallbacks
	}

	if (!volResult || !volResult.success) {
		try { volResult = await DAL.getUserByUserID(userId); } catch (e) { /* ignore */ }
	}
	if (!volResult || !volResult.success) {
		try { volResult = await DAL.getUserById(String(userId)); } catch (e) { /* ignore */ }
	}

	if (!volResult || !volResult.success) throw { status: 403, message: 'Admin check failed: volunteer record not found' };

	const volunteer = volResult.volunteer || volResult.user || volResult;
	const tokenOrg = user && user.org;
	const volunteerOrg = volunteer.organization || volunteer.org || volunteer.organization_id || volunteer.org_id;
	if (tokenOrg && volunteerOrg && String(tokenOrg) !== String(volunteerOrg)) {
		throw { status: 403, message: 'Forbidden: organization mismatch' };
	}

	const roles = volunteer && volunteer.role;
	const isAdmin = (Array.isArray(roles) && roles.includes('role_1:{default_admin}')) ||
		(typeof roles === 'string' && roles.indexOf('role_1:{default_admin}') !== -1);

	if (!isAdmin) throw { status: 403, message: 'Forbidden: admin role required' };

	return volunteer;
}

// POST /prepare handler — accepts authToken parameter (server will extract it)
async function prepareExport(req, res, authToken) {
	// Delegate to unified handler with mode = 'url'
	return handleExport(req, res, authToken, 'url');
// Unified handler: mode = 'stream' or 'url'
async function handleExport(req, res, authToken, mode = 'stream') {
	let user;
	try {
		user = await getUserFromToken(authToken);
	} catch (err) {
		return res.status(err.status || 500).json({ success: false, error: err.message || 'Token verification failed' });
	}

	try {
		await assertAdmin(user);
	} catch (err) {
		return res.status(err.status || 403).json({ success: false, error: err.message || 'Admin check failed' });
	}

	try {
		const { collection } = req.params;
		// prefer body for POST; fallback to query (compat)
		const { format = 'csv', fields } = (req.body && Object.keys(req.body).length ? req.body : req.query);
		const effectiveOrg = user.org;

		const allowedCollections = ['clients', 'volunteers', 'rides', 'destination', 'mileage_logs', 'audit_logs'];
		if (!allowedCollections.includes(collection)) return res.status(400).json({ success: false, error: `Invalid collection. Allowed collections: ${allowedCollections.join(', ')}` });

		let data = await fetchDataFromFirestore(collection, effectiveOrg);
		if (data.length === 0) return res.status(404).json({ success: false, error: 'No documents found in collection' });

		data = filterDataByFields(data, fields);

		if (mode === 'url') {
			// build buffer and upload (existing prepare behavior)
			let fileBuffer, contentType, fileExtension;
			if (format === 'csv') {
				const parser = new Parser();
				const csv = parser.parse(data);
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

			// Audit
			try { await AuditLogger.logAccess({ userId: user.userId, userEmail: user.email_address || 'unknown', userRole: user.role || 'unknown', organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, resourceId: uniqueFilename, ipAddress: getClientIp ? getClientIp(req) : req.ip, userAgent: getUserAgent ? getUserAgent(req) : req.get('user-agent'), success: true }); } catch(e){/*noop*/}

			return res.json({ success: true, downloadUrl: signedUrl });
		}

		// stream mode (default)
		if (format === 'csv') {
			const parser = new Parser();
			const csv = parser.parse(data);
			const bom = '\uFEFF';
			res.setHeader('Content-Type', 'text/csv; charset=utf-8');
			res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.csv"`);
			try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){/*noop*/}
			return res.send(bom + csv);
		} else if (format === 'pdf') {
			res.setHeader('Content-Type', 'application/pdf');
			res.setHeader('Content-Disposition', `attachment; filename="${collection}_export.pdf"`);
			const doc = new PDFDocument({ margin: 50 });
			try { await AuditLogger.logAccess({ userId: user.userId, organizationId: effectiveOrg, action: 'EXPORT', resourceType: collection, success: true }); } catch(e){/*noop*/}

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
		try { await AuditLogger.logAccess({ userId: user?.userId || 'unknown', organizationId: user?.org || 'N/A', action: 'EXPORT', resourceType: req.params?.collection || 'unknown', success: false, failureReason: error.message }); } catch(e){/*noop*/}
		res.status(500).json({ success: false, error: error.message });
	}

module.exports = {
	// Middleware: ensure the requesting user is an admin (volunteer.role contains 'role_1:{default_admin}')
	ensureAdmin: async function ensureAdmin(req, res, next) {
		try {
			let user = req.user;
			if (!user) {
				const authHeader = req.headers.authorization;
				let token = null;
				if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.substring(7);
				user = await getUserFromToken(token);
				req.user = user;
			}

			await assertAdmin(user);
			req.user.isAdmin = true;
			next();
		} catch (err) {
			console.error('Admin check error (wrapper):', err);
			return res.status(err.status || 403).json({ success: false, error: err.message || 'Admin check failed' });
		}
	},
	verifyExportToken,
	fetchDataFromFirestore,
	filterDataByFields,
	generatePdfBuffer,
	prepareExport,
	handleExport
    }
}};