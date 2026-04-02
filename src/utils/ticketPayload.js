/**
 * Ticket update payload builder — handles diff logic
 * Only includes fields that have actually changed + role
 * 
 * 🚀 KEYCLOAK MIGRATION (Task 10):
 * When Keycloak auth is integrated (future sprint):
 * - CHANGE: const payload = { role }  →  const payload = {}
 * - Role will be embedded in the JWT token automatically
 * - Everything else stays the same: dropdowns, diff logic, field visibility,
 *   error handling, success flow — all unchanged
 */

/**
 * Build update payload by comparing form values against original ticket
 * 
 * Rules:
 * - Includes `role` (required by backend until Keycloak integration)
 * - Status field: compared for all roles
 * - Priority & agent_id: compared only for admin role
 * - Only includes fields that differ from original values
 * 
 * @param {Object} ticket - Original ticket object (from API)
 * @param {Object} formValues - Current form state { status, priority, agent_id }
 * @param {string} role - User role ("admin" | "agent")
 * @returns {Object} Payload with role + only changed fields (role removed after Keycloak)
 * 
 * @example
 * // Before Keycloak:
 * const payload = buildTicketUpdatePayload(ticket, formValues, 'admin')
 * // { role: 'admin', status: 'closed' }
 * 
 * // After Keycloak migration (only need to remove role from payload):
 * // { status: 'closed' }  ← role will be in JWT token instead
 */
export function buildTicketUpdatePayload(ticket, formValues, role) {
  // 🔑 KEYCLOAK MIGRATION: Change { role } to {} when Keycloak is integrated
  const payload = { role };

  // ---- Status (visible & editable to all roles)
  if (formValues.status !== ticket.status) {
    payload.status = formValues.status;
  }

  // ---- Admin-only fields
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
 * Check if a payload has any actual changes (beyond just role)
 * 
 * 🚀 KEYCLOAK MIGRATION (Task 10):
 * After removing role from payload, update this function:
 * FROM:  Object.keys(payload).length > 1  (more than just role)
 * TO:    Object.keys(payload).length > 0  (more than empty object)
 * 
 * @param {Object} payload - Payload from buildTicketUpdatePayload
 * @returns {boolean} true if payload has changed fields, false if only role (or empty after Keycloak)
 */
export function hasChanges(payload) {
  // 🔑 KEYCLOAK MIGRATION: Change > 1 to > 0 when role is removed from payload
  return Object.keys(payload).length > 1;
}
