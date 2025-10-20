// Encryption utilities for HIPAA compliance
// Provides field-level encryption for sensitive data at rest

const crypto = require('crypto');

// Algorithm for encryption - AES-256-GCM provides authentication
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key === 'your-encryption-key-change-this-in-production') {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    // Development fallback - NOT FOR PRODUCTION
    console.warn('WARNING: Using default encryption key. Set ENCRYPTION_KEY in production!');
    return crypto.scryptSync('default-dev-key-not-secure', 'salt', 32);
  }
  
  // Derive a proper key from the hex string
  const keyBuffer = Buffer.from(key, 'hex');
  if (keyBuffer.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  return keyBuffer;
}

/**
 * Encrypt a string value
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text in base64 format
 */
function encrypt(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  try {
    const key = getEncryptionKey();
    
    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag
    const tag = cipher.getAuthTag();
    
    // Combine salt + iv + tag + encrypted data
    const result = Buffer.concat([
      salt,
      iv,
      tag,
      Buffer.from(encrypted, 'hex')
    ]);
    
    return result.toString('base64');
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt an encrypted string value
 * @param {string} encryptedText - Base64 encrypted text
 * @returns {string} Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText || typeof encryptedText !== 'string') {
    return encryptedText;
  }

  try {
    const key = getEncryptionKey();
    
    // Convert from base64
    const data = Buffer.from(encryptedText, 'base64');
    
    // Extract components
    const salt = data.slice(0, SALT_LENGTH);
    const iv = data.slice(SALT_LENGTH, TAG_POSITION);
    const tag = data.slice(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = data.slice(ENCRYPTED_POSITION);
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    // Decrypt the text
    let decrypted = decipher.update(encrypted.toString('hex'), 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash a password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  const bcrypt = require('bcrypt');
  const saltRounds = 12; // HIPAA recommends strong password hashing
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Verify a password against a hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if password matches
 */
async function verifyPassword(password, hash) {
  const bcrypt = require('bcrypt');
  return await bcrypt.compare(password, hash);
}

/**
 * Validate password strength according to HIPAA requirements
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePasswordStrength(password) {
  const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 12;
  const requireUppercase = process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false';
  const requireLowercase = process.env.PASSWORD_REQUIRE_LOWERCASE !== 'false';
  const requireNumbers = process.env.PASSWORD_REQUIRE_NUMBERS !== 'false';
  const requireSpecial = process.env.PASSWORD_REQUIRE_SPECIAL !== 'false';

  const errors = [];

  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (requireSpecial && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  // Check for common patterns
  if (/^(.)\1+$/.test(password)) {
    errors.push('Password cannot consist of repeating characters');
  }

  if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def)/i.test(password)) {
    errors.push('Password cannot contain sequential characters');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Encrypt sensitive fields in an object
 * @param {Object} obj - Object with fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
function encryptFields(obj, fields) {
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = encrypt(result[field]);
    }
  });
  return result;
}

/**
 * Decrypt sensitive fields in an object
 * @param {Object} obj - Object with encrypted fields
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
function decryptFields(obj, fields) {
  const result = { ...obj };
  fields.forEach(field => {
    if (result[field]) {
      result[field] = decrypt(result[field]);
    }
  });
  return result;
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  encryptFields,
  decryptFields
};


