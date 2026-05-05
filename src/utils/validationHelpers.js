/**
 * src/utils/validationHelpers.js
 * 
 * Client-side field validation functions
 * These mirror backend validators and provide real-time feedback
 */

/**
 * Validate email format
 * 
 * @param {string} email - Email to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: true, message: '' }; // Empty is allowed
  }

  const trimmed = email.trim();
  
  // RFC 5322 simplified pattern - covers most common cases
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailPattern.test(trimmed)) {
    return {
      valid: false,
      message: 'Please enter a valid email address (example: user@company.com)'
    };
  }

  if (trimmed.length > 254) {
    return {
      valid: false,
      message: 'Email address is too long'
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate name field (1-200 characters)
 * 
 * @param {string} name - Name to validate
 * @param {string} fieldLabel - Label for error message (default: "Name")
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateName(name, fieldLabel = 'Name') {
  if (!name || !name.trim()) {
    return {
      valid: false,
      message: `${fieldLabel} is required`
    };
  }

  const trimmed = name.trim();

  if (trimmed.length < 1) {
    return {
      valid: false,
      message: `${fieldLabel} must have at least 1 character`
    };
  }

  if (trimmed.length > 200) {
    return {
      valid: false,
      message: `${fieldLabel} must be 200 characters or less`
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate phone number (max 20 characters)
 * Accepts common formats: +1-555-123-4567, (555) 123-4567, etc.
 * 
 * @param {string} phone - Phone to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export function validatePhone(phone) {
  if (!phone || !phone.trim()) {
    return { valid: true, message: '' }; // Empty is allowed (optional field)
  }

  const trimmed = phone.trim();

  if (trimmed.length > 20) {
    return {
      valid: false,
      message: 'Phone number must be 20 characters or less'
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate URL format
 * 
 * @param {string} url - URL to validate
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateURL(url) {
  if (!url || !url.trim()) {
    return { valid: true, message: '' }; // Empty is allowed
  }

  try {
    new URL(url.trim());
    return { valid: true, message: '' };
  } catch {
    return {
      valid: false,
      message: 'Please enter a valid URL'
    };
  }
}

/**
 * Validate role is one of allowed values
 * 
 * @param {string} role - Role to validate
 * @param {array} allowedRoles - List of allowed role values (default: ['admin', 'agent', 'superadmin'])
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateRole(role, allowedRoles = ['admin', 'agent', 'superadmin']) {
  if (!role) {
    return {
      valid: false,
      message: 'Role is required'
    };
  }

  if (!allowedRoles.includes(role)) {
    return {
      valid: false,
      message: `Role must be one of: ${allowedRoles.join(', ')}`
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate string length
 * 
 * @param {string} value - Value to validate
 * @param {number} minLength - Minimum length (0 = no minimum)
 * @param {number} maxLength - Maximum length (0 = no maximum)
 * @param {string} fieldName - Field name for error message
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateLength(value, minLength = 0, maxLength = 0, fieldName = 'Field') {
  if (!value && minLength > 0) {
    return {
      valid: false,
      message: `${fieldName} is required`
    };
  }

  const length = String(value || '').length;

  if (minLength > 0 && length < minLength) {
    return {
      valid: false,
      message: `${fieldName} must be at least ${minLength} characters`
    };
  }

  if (maxLength > 0 && length > maxLength) {
    return {
      valid: false,
      message: `${fieldName} must be ${maxLength} characters or less`
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate required field
 * 
 * @param {any} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateRequired(value, fieldName = 'Field') {
  const valid = value !== null && value !== undefined && String(value).trim() !== '';
  
  return {
    valid,
    message: valid ? '' : `${fieldName} is required`
  };
}

/**
 * Validate file size (in bytes)
 * 
 * @param {number} fileSize - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes (default: 5MB)
 * @returns {object} - { valid: boolean, message: string }
 */
export function validateFileSize(fileSize, maxSize = 5 * 1024 * 1024) {
  if (fileSize > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      message: `File size must be ${maxSizeMB} MB or less`
    };
  }

  return { valid: true, message: '' };
}

/**
 * Format file size for display
 * 
 * @param {number} bytes - File size in bytes
 * @returns {string} - Formatted file size (e.g., "2.5 MB")
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
}

/**
 * Combine multiple validation results
 * Returns first error found, or { valid: true } if all pass
 * 
 * @param {array} validations - Array of validation result objects
 * @returns {object} - First error or { valid: true, message: '' }
 */
export function combineValidations(validations) {
  for (const validation of validations) {
    if (!validation.valid) {
      return validation;
    }
  }
  return { valid: true, message: '' };
}
