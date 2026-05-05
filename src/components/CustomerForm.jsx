/**
 * src/components/CustomerForm.jsx
 * 
 * Example form component demonstrating:
 * - Real-time field validation using validateEmail, validateName, validatePhone
 * - Backend validation error parsing (422 responses)
 * - Character counters for length-limited fields
 * - Inline error display
 * - Form submission with useFormValidation hook
 * 
 * This is a reference implementation. Copy patterns to other forms.
 */

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { customerService } from '../services/customerService';
import { useFormValidation } from '../hooks/useFormValidation';
import { 
  validateEmail, 
  validateName, 
  validatePhone 
} from '../utils/validationHelpers';
import { 
  isValidationError, 
  getErrorStatus,
  getErrorDetail 
} from '../utils/errorParser';
import { 
  ValidationErrorAlert, 
  APIErrorAlert, 
  FieldError, 
  FormFieldFeedback 
} from './ErrorDisplay';
import '../styles/CustomerForm.css';

export default function CustomerForm({ 
  initialData = null, 
  onSuccess, 
  onCancel 
}) {
  const isEditing = !!initialData?.id;

  // Define validators for each field
  const validators = {
    name: (value) => validateName(value, 'Name'),
    email: (value) => validateEmail(value),
    phone: (value) => validatePhone(value),
  };

  const {
    values,
    fieldErrors,
    apiError,
    isSubmitting,
    hasErrors,
    handleChange,
    handleSubmit: handleFormSubmit,
    setError,
    setApiError,
  } = useFormValidation(
    {
      name: initialData?.name || '',
      email: initialData?.email || '',
      phone: initialData?.phone || '',
    },
    {
      validators,
      onSubmit: async (data) => {
        if (isEditing) {
          return await customerService.update(initialData.id, data);
        } else {
          return await customerService.create(data);
        }
      },
      onSuccess: (result) => {
        onSuccess?.(result);
      },
    }
  );

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleFormSubmit(e);
  };

  return (
    <div className="customer-form">
      <form onSubmit={handleSubmit}>
        {/* API Error Alert */}
        {apiError && (
          <div className="form-alert form-alert-error">
            <AlertCircle size={16} />
            <div className="form-alert-content">
              <strong>Error</strong>
              <p>{apiError}</p>
            </div>
            <button 
              type="button" 
              className="form-alert-close"
              onClick={() => setApiError('')}
            >
              ×
            </button>
          </div>
        )}

        {/* Validation Errors Alert */}
        {Object.keys(fieldErrors).length > 0 && (
          <ValidationErrorAlert 
            errors={fieldErrors}
            title="Please check your input"
            onDismiss={() => setApiError('')}
          />
        )}

        {/* Name Field */}
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Customer Name
            <span className="form-required">*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            value={values.name}
            onChange={handleChange}
            maxLength={200}
            className={`form-input ${fieldErrors.name ? 'form-input-error' : ''}`}
            placeholder="e.g. John Smith"
            disabled={isSubmitting}
          />
          <FormFieldFeedback
            error={fieldErrors.name}
            value={values.name}
            maxLength={200}
            showCharCount={true}
          />
        </div>

        {/* Email Field */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={values.email}
            onChange={handleChange}
            className={`form-input ${fieldErrors.email ? 'form-input-error' : ''}`}
            placeholder="user@company.com"
            disabled={isSubmitting}
          />
          <FormFieldFeedback
            error={fieldErrors.email}
            value={values.email}
          />
          {!fieldErrors.email && (
            <small className="form-hint">
              Format: user@company.com
            </small>
          )}
        </div>

        {/* Phone Field */}
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={values.phone}
            onChange={handleChange}
            maxLength={20}
            className={`form-input ${fieldErrors.phone ? 'form-input-error' : ''}`}
            placeholder="+1-555-123-4567"
            disabled={isSubmitting}
          />
          <FormFieldFeedback
            error={fieldErrors.phone}
            value={values.phone}
            maxLength={20}
            showCharCount={false}
          />
          {!fieldErrors.phone && (
            <small className="form-hint">
              Format: +1-555-123-4567 or (555) 123-4567
            </small>
          )}
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="button"
            className="form-btn form-btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="form-btn form-btn-primary"
            disabled={isSubmitting || hasErrors}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Customer' : 'Create Customer'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
