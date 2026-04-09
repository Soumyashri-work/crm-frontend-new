/**
 * src/auth/keycloak.js
 *
 * Resolves which Keycloak realm to connect to, then returns a singleton instance.
 *
 * NOW (single realm):  always returns unified-crm realm
 * FUTURE (multi-realm): subdomain acme.dashboard.com → asks backend → acme-corp realm
 *                       That future switch is already built in — just insert a row
 *                       in tenant_realms and it works with zero code change here.
 */
import Keycloak from 'keycloak-js';

const SYSTEM_SUBDOMAINS = new Set(['app', 'www', 'localhost', 'admin', '127']);

async function resolveRealm() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  const subdomain = parts.length >= 3 ? parts[0] : null;

  // If we're on a real subdomain (not a system one), ask the backend which realm to use
  if (subdomain && !SYSTEM_SUBDOMAINS.has(subdomain)) {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/auth/realm-config?subdomain=${subdomain}`
      );
      if (res.ok) {
        const data = await res.json();
        return { realm: data.realm_name, clientId: data.client_id };
      }
    } catch {
      // Network error or backend down — fall through to default
    }
  }

  // Default — shared unified-crm realm
  return {
    realm: import.meta.env.VITE_KEYCLOAK_REALM || 'unified-crm',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT || 'crm-frontend',
  };
}

// Single instance for the entire app — never instantiate Keycloak twice
let _keycloak = null;

export async function getKeycloak() {
  if (_keycloak) return _keycloak;

  const { realm, clientId } = await resolveRealm();
  _keycloak = new Keycloak({
    url: import.meta.env.VITE_KEYCLOAK_URL,
    realm,
    clientId,
  });

  return _keycloak;
}

export default getKeycloak;