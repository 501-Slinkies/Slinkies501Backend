// Minimal entrypoint that re-exports functions from other files
const triggers = require('./triggers');

exports.auditUserChanges = triggers.auditUserChanges;
