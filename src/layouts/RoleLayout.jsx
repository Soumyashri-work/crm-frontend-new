/**
 * src/layouts/RoleLayout.jsx
 *
 * Unified layout component for all three roles (admin, agent, superadmin).
 * Replaces AdminLayout, AgentLayout, and SuperAdminLayout.
 *
 * Props:
 *   role: 'admin' | 'agent' | 'superadmin'  — Required
 *
 * Features:
 *   ✓ Single collapsed sidebar for all roles
 *   ✓ Shared Navbar across all roles WITH mobile hamburger
 *   ✓ Mobile responsive (overlay + hamburger)
 *   ✓ Consistent padding and spacing
 */

import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get initial mobile state safely
// ─────────────────────────────────────────────────────────────────────────────
function getInitialIsMobile() {
  // Check if window exists (SSR safety)
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 820;
}

export default function RoleLayout({ role = 'admin' }) {
  // ─── State: Sidebar collapse state ──────────────────────────────────────
  const [collapsed, setCollapsed] = useState(false);

  // ─── State: Mobile sidebar drawer state ─────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── State: Mobile detection (updated on resize) ────────────────────────
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  // ─── Effect: Resize listener for responsive behavior ────────────────────
  useEffect(() => {
    // Immediately set correct mobile state on mount
    const currentIsMobile = getInitialIsMobile();
    setIsMobile(currentIsMobile);

    // Create memoized handler to avoid recreating on every render
    const handleResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);

      // Close sidebar drawer when transitioning to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    // Add listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []); // Empty dependency array: run once on mount

  // ─── Handler: Toggle sidebar on mobile ──────────────────────────────────
  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // ─── Handler: Close sidebar when user clicks on a page ──────────────────
  const handleSidebarChange = useCallback((newCollapsed) => {
    setCollapsed(newCollapsed);
  }, []);

  // ─── Computed: Sidebar width based on collapse state ────────────────────
  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed)'
    : 'var(--sidebar-width)';

  // ─── Render ────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg)',
      }}
    >
      {/* Mobile overlay — click to close sidebar */}
      {isMobile && sidebarOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998,
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 
        Sidebar — collapsible, role-specific navigation
        - On desktop: visible always, can collapse/expand
        - On mobile: hidden by default, shown as overlay when sidebarOpen=true
      */}
      <Sidebar
        role={role}
        onCollapsedChange={handleSidebarChange}
      />

      {/* Main content column — takes remaining space */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // On mobile: no left margin (sidebar floats over content)
          // On desktop: margin matches sidebar width so content doesn't overlap
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left var(--transition-slow)',
          minWidth: 0, // CRITICAL: prevents flex child overflow issues
        }}
      >
        {/* 
          Navbar — top bar with logo/org name, title, user menu
          - Shows hamburger button on mobile (isMobile=true)
          - Hamburger icon toggles sidebar visibility
        */}
        <Navbar
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onMenuToggle={handleMenuToggle}
        />

        {/* 
          Page content area — renders routed pages via <Outlet />
          - Scrollable on overflow
          - Consistent padding
        */}
        <main
          style={{
            flex: 1,
            padding: '24px',
            overflowY: 'auto',
            overflowX: 'hidden',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}