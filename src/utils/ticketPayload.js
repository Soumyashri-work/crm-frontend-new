/**
 * src/utils/ticketPayload.js
 *
 * Ticket update payload builder — handles diff logic.
 * Only includes fields that have actually changed + role.
 *
 * 🚀 KEYCLOAK MIGRATION (Task 10):
 * When Keycloak auth is integrated (future sprint):
 * - CHANGE: const payload = { role }  →  const payload = {}
 * - Role will be embedded in the JWT token automatically
 * - Everything else stays the same: dropdowns, diff logic, field visibility,
 *   error handling, success flow — all unchanged
 */

/**
 * Convert a datetime-local string (e.g. "2026-04-15T10:30") to a full
 * ISO 8601 string the backend expects (e.g. "2026-04-15T10:30:00.000Z").
 *
 * datetime-local inputs return local time with no timezone info.
 * `new Date()` parses them as local time and `.toISOString()` converts
 * to UTC — which is what the backend stores.
 *
 * Returns null if the input is falsy.
 *
 * @param {string|null} datetimeLocalValue
 * @returns {string|null}
 */
function toISOString(datetimeLocalValue) {
  if (!datetimeLocalValue) return null;
  return new Date(datetimeLocalValue).toISOString();
}

/**
 * Build update payload by comparing form values against original ticket.
 *
 * Rules:
 * - Includes `role` (required by backend until Keycloak integration)
 * - Status field: compared for all roles
 * - Priority & agent_id: compared only for admin role
 * - pending_until: included whenever status === "pending"; explicitly
 *   omitted (not sent as null) when status is not "pending" because the
 *   backend clears it automatically on status transitions
 * - Only includes fields that differ from original values
 *
 * @param {Object}      ticket      - Original ticket object (from API)
 * @param {Object}      formValues  - Current form state
 *                                    { status, priority, agent_id, pending_until }
 * @param {string}      role        - User role ("admin" | "agent")
 * @returns {Object} Payload with role + only changed fields
 *
 * @example
 * // Pending update (admin):
 * buildTicketUpdatePayload(ticket, { status: 'pending', pending_until: '2026-05-01T09:00', ... }, 'admin')
 * // → { role: 'admin', status: 'pending', pending_until: '2026-05-01T09:00:00.000Z' }
 *
 * // Status change away from pending — pending_until not sent; backend clears it:
 * buildTicketUpdatePayload(ticket, { status: 'open', pending_until: null, ... }, 'admin')
 * // → { role: 'admin', status: 'open' }
 */
export function buildTicketUpdatePayload(ticket, formValues, role) {
  // 🔑 KEYCLOAK MIGRATION: Change { role } to {} when Keycloak is integrated
  const payload = { role };

  // ---- Status (visible & editable to all roles) ----------------------
  if (formValues.status !== ticket.status) {
    payload.status = formValues.status;
  }

  // ---- pending_until — required by backend when status is "pending" --
  // Only include when the resolved status (changed or unchanged) is "pending".
  // We check the payload status first (if changed), then fall back to the
  // current ticket status so we catch the case where the user already has
  // a pending ticket and only edits priority or agent.
  const resolvedStatus = payload.status ?? ticket.status;

  if (resolvedStatus === 'pending') {
    payload.pending_until = toISOString(formValues.pending_until);
  }
  // When leaving pending, backend clears pending_until automatically —
  // no need to send it as null here.

  // ---- Admin-only fields ---------------------------------------------
  if (role === 'admin') {
    // Priority: compare, handle null gracefully
    const originalPriority = ticket.priority ?? '';
    if (formValues.priority !== originalPriority) {
      payload.priority = formValues.priority || null;
    }

    // Agent ID: extract from nested ticket.agent object
    const originalAgentId = ticket.agent?.id ?? null;
    if (formValues.agent_id !== originalAgentId) {
      payload.agent_id = formValues.agent_id;
    }
  }

  return payload;
}

/**
 * Check if a payload has any actual changes (beyond just role).
 *
 * 🚀 KEYCLOAK MIGRATION (Task 10):
 * After removing role from payload, update this function:
 * FROM:  Object.keys(payload).length > 1  (more than just role)
 * TO:    Object.keys(payload).length > 0  (more than empty object)
 *
 * @param {Object} payload - Payload from buildTicketUpdatePayload
 * @returns {boolean} true if payload has changed fields beyond role
 */
export function hasChanges(payload) {
  // 🔑 KEYCLOAK MIGRATION: Change > 1 to > 0 when role is removed from payload
  return Object.keys(payload).length > 1;
}