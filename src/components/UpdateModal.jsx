/**
 * src/components/UpdateModal.jsx
 * 
 * Generic update modal component showing error handling best practices.
 * Copy and adapt this pattern for EditTicketModal, EditAgentModal, etc.
 * 
 * Features:
 * - Centralized error parsing
 * - Field-level error display
 * - Backend validation error handling
 * - Loading states
 */

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { 
  isValidationError, 
  parseValidationErrors, 
  validationErrorsToMap,
  getErrorStatus,
  getErrorDetail 
} from '../utils/errorParser';
import { FieldError, ValidationErrorAlert, APIErrorAlert } from './ErrorDisplay';
import '../styles/UpdateModal.css';

/**
 * Generic Update Modal
 * 
 * Props:
 *   isOpen {boolean}
 *   onClose {function}
 *   title {string}
 *   fieldConfigs {array} - [{ name, label, type, required, validate? }]
 *   initialValues {object}
 *   onSubmit {async function(values)} - Should throw on error
 *   onSuccess {function(result)}
 */
export default function UpdateModal({
  isOpen,
  onClose,
  title,
  fieldConfigs = [],
  initialValues = {},
  onSubmit,
  onSuccess,
}) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setValues(initialValues);
      setErrors({});
      setApiError('');
    }
  }, [isOpen, initialValues]);

  if (!isOpen) return null;

  const handleChange = (fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[fieldName]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[fieldName];
        return updated;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    setIsSubmitting(true);
    try {
      // Call the provided submit handler
      const result = await onSubmit(values);
      
      // Success
      onSuccess?.(result);
    } catch (error) {
      // Handle backend validation errors (422)
      if (isValidationError(error)) {
        const backendErrors = parseValidationErrors(error.response);
        const errorMap = validationErrorsToMap(backendErrors);
        setErrors(errorMap);
      } else {
        // Other HTTP errors
        const status = getErrorStatus(error);
        const detail = getErrorDetail(error);
        
        if (status === 401) {
          // Auth handled by api.js interceptor, shouldn't reach here
          setApiError('Session expired. Please log in again.');
        } else if (status === 403) {
          setApiError("You don't have permission to make this change.");
        } else if (status === 404) {
          setApiError('Resource not found. It may have been deleted.');
        } else if (status === 409) {
          setApiError('A conflict occurred. Please refresh and try again.');
        } else if (status === 429) {
          setApiError('Too many requests. Please wait a moment and try again.');
        } else if (status === 500) {
          setApiError('Server error. Please try again later.');
        } else {
          setApiError(detail || error.message || 'An error occurred.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="500px"
      disableBackdropClick={isSubmitting}
      disableEscapeKey={isSubmitting}
    >
      <form onSubmit={handleSubmit}>
        {/* Validation Errors Alert */}
        {Object.keys(errors).length > 0 && (
          <ValidationErrorAlert 
            errors={errors}
            onDismiss={() => setErrors({})}
          />
        )}

        {/* API Error Alert */}
        {apiError && (
          <div className="modal-error-alert">
            <AlertCircle size={16} />
            <div>
              <strong>Error</strong>
              <p>{apiError}</p>
            </div>
            <button
              type="button"
              className="modal-error-close"
              onClick={() => setApiError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Dynamic Fields */}
        <div className="modal-form-container">
          {fieldConfigs.map(field => (
            <div key={field.name} className="modal-form-group">
              <label className="modal-form-label">
                {field.label}
                {field.required && <span className="required">*</span>}
              </label>

              {field.type === 'select' ? (
                <select
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`modal-form-input ${errors[field.name] ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                >
                  <option value="">Select {field.label.toLowerCase()}...</option>
                  {field.options?.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : field.type === 'textarea' ? (
                <textarea
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`modal-form-input ${errors[field.name] ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                  maxLength={field.maxLength}
                  rows={field.rows || 3}
                />
              ) : (
                <input
                  type={field.type || 'text'}
                  name={field.name}
                  value={values[field.name] || ''}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={`modal-form-input ${errors[field.name] ? 'has-error' : ''}`}
                  disabled={isSubmitting}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                />
              )}

              {/* Field Error */}
              {errors[field.name] && (
                <FieldError error={errors[field.name]} />
              )}

              {/* Field Hint */}
              {field.hint && !errors[field.name] && (
                <small className="modal-form-hint">{field.hint}</small>
              )}

              {/* Character Counter */}
              {field.maxLength && (
                <div className="modal-form-counter">
                  {String(values[field.name] || '').length}/{field.maxLength}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="modal-btn modal-btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="modal-btn modal-btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
