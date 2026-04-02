/**
 * Role-based permissions for ticket updates
 * Determines which fields each role can see and edit
 */

export const FIELD_VISIBILITY = {
  admin: {
    status: true,     // ✅ Can edit
    priority: true,   // ✅ Can edit
    agent_id: true,   // ✅ Can edit
  },
  agent: {
    status: true,     // ✅ Can edit
    priority: false,  // ❌ Cannot see or edit
    agent_id: false,  // ❌ Cannot see or edit
  },
};

/**
 * Get the current user's role from localStorage
 * @returns {string} "admin" | "agent"
 */
export function getUserRole() {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    return user?.role?.toLowerCase() || 'agent';
  } catch {
    return 'agent';
  }
}

/**
 * Check if a field is visible for the given role
 * @param {string} field - field name ("status" | "priority" | "agent_id")
 * @param {string} role - user role ("admin" | "agent")
 * @returns {boolean}
 */
export function isFieldVisible(field, role) {
  const normalized = role?.toLowerCase() || 'agent';
  return FIELD_VISIBILITY[normalized]?.[field] ?? false;
}

/**
 * Get all visible fields for a given role
 * @param {string} role - user role ("admin" | "agent")
 * @returns {string[]} Array of visible field names
 */
export function getVisibleFields(role) {
  const normalized = role?.toLowerCase() || 'agent';
  return Object.entries(FIELD_VISIBILITY[normalized] || {})
    .filter(([, isVisible]) => isVisible)
    .map(([field]) => field);
}
