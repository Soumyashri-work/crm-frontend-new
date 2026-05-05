/**
 * src/utils/errorParser.js
 * 
 * Centralized error parsing and normalization for backend validation
 * and HTTP errors. Converts backend response formats to standardized
 * error objects that frontend components can easily consume.
 */

/**
 * Parse validation error response (422 status)
 * 
 * Backend sends: { detail: "field_name → error message", error_type: "validation_error" }
 * We parse this into: { field: "field_name", message: "error message", type: "validation_error" }
 * 
 * @param {object} response - axios error response object
 * @returns {object} - { field, message, type } or null if not a validation error
 */
export function parseValidationError(response) {
  if (!response?.data?.detail) return null;

  const detail = String(response.data.detail);
  
  // Format: "field_name → error message"
  const match = detail.match(/^([\w.]+)\s*→\s*(.+)$/);
  if (match) {
    return {
      field: match[1],
      message: match[2],
      type: response.data.error_type || 'validation_error'
    };
  }

  // Fallback: treat entire detail as message for generic field
  return {
    field: 'general',
    message: detail,
    type: response.data.error_type || 'validation_error'
  };
}

/**
 * Parse all validation errors from response (422 status)
 * Returns array to handle multiple field errors if backend provides them
 * 
 * @param {object} response - axios error response object
 * @returns {array} - Array of { field, message, type } objects
 */
export function parseValidationErrors(response) {
  // Try to parse as array of errors (if backend returns multiple)
  if (Array.isArray(response?.data?.detail)) {
    return response.data.detail.map(err => ({
      field: err.field || 'general',
      message: err.message || String(err),
      type: 'validation_error'
    }));
  }

  // Single error
  const error = parseValidationError(response);
  return error ? [error] : [];
}

/**
 * Convert validation errors array to field-keyed object for forms
 * 
 * Input:  [{ field: 'email', message: '...' }]
 * Output: { email: '...' }
 * 
 * @param {array} errors - Array of error objects from parseValidationErrors
 * @returns {object} - Field name → error message map
 */
export function validationErrorsToMap(errors) {
  const map = {};
  if (!Array.isArray(errors)) return map;

  errors.forEach(err => {
    map[err.field] = err.message;
  });

  return map;
}

/**
 * Get HTTP status code from error response
 * 
 * @param {Error} error - axios error object
 * @returns {number} - HTTP status code or 0 if unknown
 */
export function getErrorStatus(error) {
  return error?.response?.status || 0;
}

/**
 * Get error detail message from response
 * 
 * @param {Error} error - axios error object
 * @returns {string} - Detail message or empty string
 */
export function getErrorDetail(error) {
  return error?.response?.data?.detail || '';
}

/**
 * Get HTTP error message for status code
 * 
 * Maps HTTP status codes to user-friendly error messages.
 * Use this for non-validation errors.
 * 
 * @param {number} status - HTTP status code
 * @param {string} detail - Optional detail message from server
 * @returns {string} - User-friendly error message
 */
export function getHTTPErrorMessage(status, detail = '') {
  const statusMessages = {
    400: 'Invalid request. Please check your input.',
    401: 'Your session has expired. Please log in again.',
    403: "You don't have permission to perform this action.",
    404: 'Resource not found.',
    409: 'A conflict occurred. Please refresh and try again.',
    413: 'Request too large (max 5 MB). Please try with less data.',
    422: 'Validation failed. Please check your input.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong. Please try again later.',
    502: 'CRM service is unreachable. Please check your credentials.',
    503: 'Service temporarily unavailable. Please try again later.',
  };

  // Use detail if provided, otherwise use status code message
  if (detail) return detail;
  return statusMessages[status] || 'An error occurred. Please try again.';
}

/**
 * Check if error is a validation error (422)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isValidationError(error) {
  return getErrorStatus(error) === 422;
}

/**
 * Check if error is an auth error (401)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isAuthError(error) {
  return getErrorStatus(error) === 401;
}

/**
 * Check if error is a permission error (403)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isPermissionError(error) {
  return getErrorStatus(error) === 403;
}

/**
 * Check if error is a payload size error (413)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isPayloadTooLargeError(error) {
  return getErrorStatus(error) === 413;
}

/**
 * Check if error is a rate limit error (429)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isRateLimitError(error) {
  return getErrorStatus(error) === 429;
}

/**
 * Check if error is CRM unreachable (502)
 * 
 * @param {Error} error - axios error object
 * @returns {boolean}
 */
export function isCRMUnreachableError(error) {
  return getErrorStatus(error) === 502;
}

/**
 * Extract field-specific error message
 * Useful for forms that need to display errors per field
 * 
 * @param {object} fieldErrors - Object from validationErrorsToMap
 * @param {string} field - Field name to get error for
 * @returns {string} - Error message or empty string
 */
export function getFieldError(fieldErrors, field) {
  return fieldErrors?.[field] || '';
}

/**
 * Log error for debugging (only in development)
 * 
 * @param {Error} error - Error object to log
 * @param {string} context - Context where error occurred
 */
export function logError(error, context = '') {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[${context}]`, {
      status: getErrorStatus(error),
      detail: getErrorDetail(error),
      message: error.message,
      data: error.response?.data
    });
  }
}
