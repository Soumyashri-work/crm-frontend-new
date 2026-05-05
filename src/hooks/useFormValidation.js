/**
 * src/hooks/useFormValidation.js
 * 
 * Custom React hook for managing form state and validation errors.
 * Handles both client-side validation and server-side validation errors.
 */

import { useState, useCallback, useMemo } from 'react';
import { 
  isValidationError, 
  parseValidationErrors, 
  validationErrorsToMap,
  logError 
} from '../utils/errorParser';

/**
 * useFormValidation hook
 * 
 * @param {object} initialValues - Initial form values (e.g., { email: '', name: '' })
 * @param {object} options - Configuration options
 *   - validators: { field: validationFn } - Validation functions by field
 *   - onSubmit: async function(values) - Form submit handler
 *   - onSuccess: function(result) - Called on successful submit
 *   - onError: function(error) - Called on submit error
 * 
 * @returns {object} Hook state and handlers
 */
export function useFormValidation(initialValues, options = {}) {
  const { validators = {}, onSubmit, onSuccess, onError } = options;

  // Form state
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Validate a single field
   * Returns validation result and updates field errors
   */
  const validateField = useCallback((fieldName, fieldValue) => {
    const validator = validators[fieldName];
    
    if (!validator) {
      return { valid: true, message: '' };
    }

    const result = validator(fieldValue);
    
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (result.valid) {
        delete updated[fieldName];
      } else {
        updated[fieldName] = result.message;
      }
      return updated;
    });

    return result;
  }, [validators]);

  /**
   * Validate all fields
   * Returns true if all fields pass validation
   */
  const validateAll = useCallback(() => {
    const errors = {};
    let hasErrors = false;

    Object.keys(validators).forEach(fieldName => {
      const result = validators[fieldName](values[fieldName]);
      if (!result.valid) {
        errors[fieldName] = result.message;
        hasErrors = true;
      }
    });

    setFieldErrors(errors);
    return !hasErrors;
  }, [validators, values]);

  /**
   * Handle field change - validates as user types
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Update field value
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // Validate field
    validateField(name, value);
  }, [validateField]);

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();

    setApiError('');

    // Client-side validation
    if (!validateAll()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onSubmit?.(values);
      onSuccess?.(result);
    } catch (error) {
      logError(error, 'Form submission');

      // Handle server validation errors (422)
      if (isValidationError(error)) {
        const errors = parseValidationErrors(error.response);
        const errorMap = validationErrorsToMap(errors);
        setFieldErrors(errorMap);
      } else {
        // Other errors
        setApiError(
          error.response?.data?.detail || 
          error.response?.data?.message ||
          error.message ||
          'An error occurred. Please try again.'
        );
      }

      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, onSuccess, onError, validateAll]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setValues(initialValues);
    setFieldErrors({});
    setApiError('');
  }, [initialValues]);

  /**
   * Set error for a specific field (useful for async validation)
   */
  const setError = useCallback((fieldName, message) => {
    setFieldErrors(prev => {
      const updated = { ...prev };
      if (message) {
        updated[fieldName] = message;
      } else {
        delete updated[fieldName];
      }
      return updated;
    });
  }, []);

  /**
   * Get error message for a field
   */
  const getError = useCallback((fieldName) => {
    return fieldErrors[fieldName] || '';
  }, [fieldErrors]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useMemo(() => {
    return Object.keys(fieldErrors).length > 0 || !!apiError;
  }, [fieldErrors, apiError]);

  /**
   * Check if specific field has error
   */
  const hasError = useCallback((fieldName) => {
    return !!fieldErrors[fieldName];
  }, [fieldErrors]);

  return {
    // State
    values,
    fieldErrors,
    apiError,
    isSubmitting,
    hasErrors,

    // Handlers
    handleChange,
    handleSubmit,
    validateField,
    validateAll,
    reset,
    setError,
    setValues,
    setFieldErrors,
    setApiError,

    // Getters
    getError,
    hasError,
  };
}

export default useFormValidation;
