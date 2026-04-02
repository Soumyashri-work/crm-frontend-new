/**
 * src/utils/ticketErrorHandler.js
 *
 * Task 8: HTTP error handling
 * 
 * Maps HTTP status codes to user-friendly error messages
 * Handles explicit cases: 400, 403, 404, 422, 500
 */

/**
 * Error message mapping for ticket update API
 * Maps HTTP status codes to human-readable messages
 */
const ERROR_MESSAGES = {
  400: 'No changes were made',
  403: "You don't have permission to do this",
  404: 'Ticket not found',
  422: 'Invalid selection — please use the dropdown',
  500: 'Something went wrong, please try again',
};

/**
 * Get user-friendly error message from API error
 * 
 * Status codes:
 *   400 - Payload had no changed fields
 *   403 - Agent tried to change priority/agent (or role not recognized)
 *   404 - Ticket or agent UUID not found
 *   422 - Invalid status or priority string value
 *   500 - Unexpected server error
 * 
 * @param {Error} error - Error from updateTicket()
 * @param {?number} defaultStatus - Fallback status code (default 500)
 * @returns {string} User-friendly error message
 * 
 * @example
 * try {
 *   await updateTicket(ticketId, payload)
 * } catch (err) {
 *   const userMsg = getErrorMessage(err)
 *   alert(userMsg)  // Shows "You don't have permission to do this"
 * }
 */
export function getErrorMessage(error, defaultStatus = 500) {
  const status = error.status || defaultStatus;
  
  // Return mapped message if status is known, otherwise use error.message or fallback
  return ERROR_MESSAGES[status] || error.message || 'An error occurred';
}

/**
 * Handle ticket update errors with proper fallback chain
 * 
 * Priority:
 *   1. Mapped error message (by HTTP status)
 *   2. Server's detail field
 *   3. Generic error message
 * 
 * @param {Error} error - Error from updateTicket()
 * @returns {Object} Error object with status, userMessage, and details
 * 
 * @example
 * try {
 *   await updateTicket(id, payload)
 * } catch (err) {
 *   const { userMessage, status, details } = handleTicketUpdateError(err)
 *   console.error(`[${status}]`, userMessage, details)
 * }
 */
export function handleTicketUpdateError(error) {
  const status = error.status || 500;
  const userMessage = getErrorMessage(error, status);
  
  return {
    status,
    userMessage,
    details: error.data || {},
    rawMessage: error.message,
  };
}
