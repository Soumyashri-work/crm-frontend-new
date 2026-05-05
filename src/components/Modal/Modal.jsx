/**
 * Modal.jsx — Reusable modal wrapper component
 * 
 * Features:
 * - Standardized styling (overlay, container, header, footer)
 * - Responsive across mobile, tablet, desktop
 * - Fixed header/footer with scrollable body
 * - Accessibility (aria-modal, aria-labelledby, role="dialog")
 * - Escape key + backdrop click handlers built-in
 * - Portal rendering to document.body (optional)
 * - Body scroll prevention
 * - Custom z-index support for stacking
 * 
 * Props:
 *   isOpen {boolean}           - Controls modal visibility
 *   onClose {function}         - Called when user closes modal
 *   children {ReactNode}       - Content (required)
 *   title {string}             - Modal title (optional, if no custom header)
 *   onEscapeKey {function}     - Override default escape behavior (optional)
 *   disableEscapeKey {boolean} - Disable escape key handler (default: false)
 *   disableBackdropClick {boolean} - Disable backdrop click (default: false)
 *   maxWidth {string}          - CSS max-width (default: "520px")
 *   titleId {string}           - For aria-labelledby (default: auto-generated)
 *   portalTarget {HTMLElement} - Portal target (default: document.body)
 *   zIndex {number}            - Z-index for modal overlay (default: 1100)
 * 
 * Slots (via children structure):
 *   Use className="modal-header" for custom header
 *   Use className="modal-body" for content
 *   Use className="modal-footer" for custom footer
 * 
 * Example:
 *   <Modal isOpen={isOpen} onClose={onClose} title="Edit Item" zIndex={1300}>
 *     <div className="modal-body">
 *       <input type="text" />
 *     </div>
 *     <div className="modal-footer">
 *       <button onClick={onClose}>Cancel</button>
 *       <button onClick={handleSave}>Save</button>
 *     </div>
 *   </Modal>
 */

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  children,
  title = null,
  onEscapeKey = null,
  disableEscapeKey = false,
  disableBackdropClick = false,
  maxWidth = '520px',
  titleId = 'modal-title',
  portalTarget = null,
  zIndex = 1100,
}) {
  const modalRef = useRef(null);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || disableEscapeKey) return;

    const handler = (e) => {
      if (e.key === 'Escape') {
        if (onEscapeKey) {
          onEscapeKey();
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, disableEscapeKey, onClose, onEscapeKey]);

  if (!isOpen) return null;

  // Backdrop click handler
  const handleBackdropClick = (e) => {
    if (disableBackdropClick) return;
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Modal content
  const modalContent = (
    <div 
      className="modal-overlay" 
      onClick={handleBackdropClick} 
      role="presentation"
      style={{ zIndex }}
    >
      <div
        className="modal-container"
        style={{ maxWidth }}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Default header (if title provided and no custom header in children) */}
        {title && !hasCustomHeader(children) && (
          <div className="modal-header">
            <h2 id={titleId} className="modal-title">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="modal-close-btn"
              aria-label="Close modal"
              type="button"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Children (can include custom header, body, footer) */}
        {children}
      </div>
    </div>
  );

  // Render as portal to document.body
  const target = portalTarget || document.body;
  return createPortal(modalContent, target);
}

/**
 * Helper: Check if children includes a custom header
 */
function hasCustomHeader(children) {
  if (!children) return false;
  if (Array.isArray(children)) {
    return children.some(
      (child) => child?.props?.className?.includes('modal-header')
    );
  }
  return children.props?.className?.includes('modal-header');
}