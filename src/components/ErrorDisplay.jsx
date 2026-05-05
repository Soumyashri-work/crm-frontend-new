/**
 * src/components/ErrorDisplay.jsx
 * 
 * Reusable error display components for showing validation and API errors
 */

import { AlertCircle, XCircle, CheckCircle, Info } from 'lucide-react';
import '../styles/ErrorDisplay.css';

/**
 * Generic error box component
 * Used for any error that needs to be displayed to the user
 */
export function ErrorBox({ 
  type = 'error', 
  title, 
  message, 
  details, 
  onDismiss,
  children 
}) {
  const icons = {
    error: <XCircle size={20} />,
    warning: <AlertCircle size={20} />,
    info: <Info size={20} />,
    success: <CheckCircle size={20} />
  };

  return (
    <div className={`error-box error-box-${type}`}>
      <div className="error-box-header">
        <span className="error-box-icon">
          {icons[type]}
        </span>
        {title && <h4 className="error-box-title">{title}</h4>}
        {onDismiss && (
          <button 
            className="error-box-close" 
            onClick={onDismiss}
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
      
      {message && <p className="error-box-message">{message}</p>}
      
      {details && (
        <ul className="error-box-details">
          {Array.isArray(details) ? (
            details.map((detail, i) => <li key={i}>{detail}</li>)
          ) : (
            <li>{details}</li>
          )}
        </ul>
      )}

      {children}
    </div>
  );
}

/**
 * Validation error display component
 * Shows field-level validation errors
 */
export function ValidationErrorAlert({ 
  errors, 
  title = 'Please check your input',
  onDismiss 
}) {
  if (!errors || Object.keys(errors).length === 0) {
    return null;
  }

  const errorList = Object.entries(errors).map(([field, message]) => (
    `${field}: ${message}`
  ));

  return (
    <ErrorBox
      type="error"
      title={`⚠️ ${title}`}
      details={errorList}
      onDismiss={onDismiss}
    />
  );
}

/**
 * API error display component
 * Shows HTTP status-specific error messages
 */
export function APIErrorAlert({ 
  status, 
  detail, 
  onDismiss,
  onRetry 
}) {
  if (!status) return null;

  const errorConfigs = {
    400: {
      title: '❌ Invalid Request',
      message: detail || 'Invalid request. Please check your input.',
      type: 'error'
    },
    401: {
      title: '🔐 Session Expired',
      message: 'Your session has expired. Please log in again.',
      type: 'error'
    },
    403: {
      title: '🔒 Permission Denied',
      message: detail || "You don't have permission to perform this action.",
      type: 'error'
    },
    404: {
      title: '🔍 Not Found',
      message: detail || 'Resource not found.',
      type: 'error'
    },
    409: {
      title: '⚠️ Conflict',
      message: 'A conflict occurred. Please refresh and try again.',
      type: 'warning'
    },
    413: {
      title: '📦 Payload Too Large',
      message: detail || 'Request exceeds 5 MB limit. Please try with less data.',
      type: 'error'
    },
    429: {
      title: '⏱️ Rate Limited',
      message: 'Too many requests. Please wait a moment and try again.',
      type: 'warning'
    },
    500: {
      title: '💥 Server Error',
      message: detail || 'Something went wrong. Please try again later.',
      type: 'error'
    },
    502: {
      title: '🔌 CRM Unreachable',
      message: detail || 'The CRM service is unreachable. Please check your credentials.',
      type: 'error'
    },
    503: {
      title: '🔧 Service Unavailable',
      message: 'Service temporarily unavailable. Please try again later.',
      type: 'warning'
    }
  };

  const config = errorConfigs[status] || {
    title: '❌ Error',
    message: detail || 'An error occurred. Please try again.',
    type: 'error'
  };

  return (
    <ErrorBox
      type={config.type}
      title={config.title}
      message={config.message}
      onDismiss={onDismiss}
    >
      {onRetry && (
        <button 
          className="error-box-retry-btn"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </ErrorBox>
  );
}

/**
 * Field-level inline error display
 * Shows error for a single form field
 */
export function FieldError({ error, className = '' }) {
  if (!error) return null;

  return (
    <span className={`field-error ${className}`}>
      {error}
    </span>
  );
}

/**
 * Inline validation feedback for a form field
 * Shows both error state and success state
 */
export function FormFieldFeedback({ 
  error, 
  value, 
  maxLength,
  showCharCount = false 
}) {
  return (
    <div className="form-field-feedback">
      {showCharCount && maxLength && (
        <div className={`char-counter ${value?.length > maxLength ? 'error' : ''}`}>
          {value?.length || 0}/{maxLength}
        </div>
      )}
      {error && <FieldError error={error} />}
    </div>
  );
}

/**
 * Loading error state
 * Shows when data failed to load
 */
export function LoadingError({ 
  error, 
  onRetry,
  entityName = 'data'
}) {
  return (
    <ErrorBox
      type="error"
      title="Failed to Load"
      message={`Could not load ${entityName}`}
      onDismiss={onRetry}
    >
      {error && (
        <p className="error-box-detail">
          Error: {error.message || String(error)}
        </p>
      )}
      {onRetry && (
        <button 
          className="error-box-retry-btn"
          onClick={onRetry}
        >
          Retry
        </button>
      )}
    </ErrorBox>
  );
}
