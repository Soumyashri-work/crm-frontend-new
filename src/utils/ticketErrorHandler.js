/**
 * src/utils/ticketErrorHandler.js
 *
 * Task 8: HTTP error handling
 *
 * Maps HTTP status codes to user-friendly error messages.
 * Handles explicit cases: 400, 403, 404, 422, 500.
 *
 * 422 note:
 *   A 422 can now mean two different things:
 *     a) Invalid status or priority string value
 *     b) Missing pending_until when status is "pending"
 *   For 422 specifically, the server always returns a descriptive `detail`
 *   string (e.g. "pending_until is required when status is 'pending'").
 *   We surface that directly instead of a hardcoded generic message.
 *   For all other status codes we use the hardcoded messages below.
 */

/**
 * Fallback message map for all non-422 error status codes.
 * 422 is intentionally absent — its message comes from the server detail.
 */
const ERROR_MESSAGES = {
  400: 'No changes were made.',
  403: "You don't have permission to do this.",
  404: 'Ticket not found.',
  500: 'Something went wrong on our end — please try again.',
};

/**
 * Extract the server's `detail` string from an error response, if present.
 *
 * Handles two common axios error shapes:
 *   - error.response.data.detail  (FastAPI validation errors)
 *   - error.data.detail           (pre-shaped interceptor errors)
 *
 * Returns null when no detail string can be found.
 *
 * @param {Error} error
 * @returns {string|null}
 */
function extractServerDetail(error) {
  const detail =
    error?.response?.data?.detail ??
    error?.data?.detail ??
    null;

  if (!detail) return null;

  // FastAPI can return detail as an array of validation objects.
  // Flatten them into a readable string.
  if (Array.isArray(detail)) {
    return detail
      .map((d) => d?.msg ?? String(d))
      .join(' · ');
  }

  return typeof detail === 'string' ? detail : null;
}

/**
 * Get a user-friendly error message from an API error.
 *
 * Resolution order:
 *   1. For 422: use server detail string (descriptive, contains the exact issue)
 *   2. For all others: use the hardcoded message map
 *   3. Fallback: error.message, then a generic string
 *
 * @param {Error}   error         - Error thrown by ticketService.update()
 * @param {number}  [defaultStatus=500] - Fallback status if error carries none
 * @returns {string} User-friendly error message ready to display
 *
 * @example
 * try {
 *   await ticketService.update(ticketId, payload)
 * } catch (err) {
 *   const msg = getErrorMessage(err)
 *   setError(msg)
 *   // "pending_until is required when status is 'pending'."
 *   // "You don't have permission to do this."
 * }
 */
export function getErrorMessage(error, defaultStatus = 500) {
  const status = error?.response?.status ?? error?.status ?? defaultStatus;

  // 422: always prefer the server's own detail message — it's precise
  if (status === 422) {
    const detail = extractServerDetail(error);
    if (detail) return detail;
    // Server detail unavailable — generic fallback for 422
    return 'Invalid value — please check your selections and try again.';
  }

  return (
    ERROR_MESSAGES[status] ??
    error?.message ??
    'An unexpected error occurred.'
  );
}

/**
 * Handle a ticket update error and return a structured object for logging.
 *
 * Use this when you need both the display message and metadata (e.g. for
 * console.error or an error monitoring service).
 *
 * @param {Error} error - Error thrown by ticketService.update()
 * @returns {{ status: number, userMessage: string, details: Object, rawMessage: string }}
 *
 * @example
 * try {
 *   await ticketService.update(id, payload)
 * } catch (err) {
 *   const { userMessage, status, details } = handleTicketUpdateError(err)
 *   console.error(`[${status}]`, userMessage, details)
 *   setError(userMessage)
 * }
 */
export function handleTicketUpdateError(error) {
  const status      = error?.response?.status ?? error?.status ?? 500;
  const userMessage = getErrorMessage(error, status);

  return {
    status,
    userMessage,
    details:    error?.response?.data ?? error?.data ?? {},
    rawMessage: error?.message ?? '',
  };
}