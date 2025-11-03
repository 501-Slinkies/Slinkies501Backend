const crypto = require('crypto');


/**
 * Hash a password by prepending ENCRYPTION_KEY as salt and hashing with sha256
 * @param {string} password - Plain text password
 * @returns {string} sha256 hash of salted password (hex)
 */
function hashPassword(password) {
  const salt = process.env.ENCRYPTION_KEY;
  if (!salt) {
    throw new Error('ENCRYPTION_KEY must be set in environment');
  }
  const salted = salt + password;
  return crypto.createHash('sha256').update(salted).digest('hex');
}

module.exports = {
  hashPassword,
};
