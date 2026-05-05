/**
 * src/layouts/RoleLayout.jsx
 *
 * Unified layout component for all three roles (admin, agent, superadmin).
 * Handles responsive sidebar overlay on mobile and side-by-side on desktop.
 */

import { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Get initial mobile state safely (SSR-safe)
// ─────────────────────────────────────────────────────────────────────────────
function getInitialIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 820;
}

export default function RoleLayout({ role = 'admin' }) {
  // ─── State: Sidebar collapse state (expanded vs collapsed) ────────────────
  const [collapsed, setCollapsed] = useState(false);

  // ─── State: Mobile sidebar drawer state (open vs closed on mobile) ────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ─── State: Mobile detection (updates on window resize) ─────────────────
  const [isMobile, setIsMobile] = useState(getInitialIsMobile);

  // ─── Effect: Listen for window resize to detect mobile/desktop ───────────
  useEffect(() => {
    // Set correct mobile state on component mount
    const currentIsMobile = getInitialIsMobile();
    setIsMobile(currentIsMobile);

    // Handle resize events
    const handleResize = () => {
      const mobile = window.innerWidth <= 820;
      setIsMobile(mobile);

      // Auto-close sidebar drawer when switching from mobile to desktop
      if (!mobile) {
        setSidebarOpen(false);
      }
    };

    // Attach resize listener
    window.addEventListener('resize', handleResize);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // ─── Handler: Toggle sidebar drawer on mobile (hamburger click) ──────────
  const handleMenuToggle = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  // ─── Handler: Close drawer when user navigates ─────────────────────────
  const handleCloseSidebar = useCallback(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  // ─── Handler: Update collapsed state from sidebar collapse button ────────
  const handleSidebarChange = useCallback((newCollapsed) => {
    setCollapsed(newCollapsed);
  }, []);

  // ─── Computed: Sidebar width based on collapse state ────────────────────
  const sidebarWidth = collapsed
    ? 'var(--sidebar-collapsed, 72px)'
    : 'var(--sidebar-width, 260px)';

  // ─── Render ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        background: 'var(--bg)',
        position: 'relative',
      }}
    >
      {/* ── Mobile Backdrop Overlay ────────────────────────────────────────
          Darkens page when sidebar is open; click to close sidebar
      */}
      {isMobile && sidebarOpen && (
        <div
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)', // ✅ Darker overlay for better visibility
            zIndex: 998, // Below sidebar (999)
            animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSidebarOpen(false);
          }}
        />
      )}

      {/* ── Sidebar Navigation ────────────────────────────────────────────
          Desktop (>820px): Always visible, reserves space via marginLeft
          Mobile (≤820px): Overlays content when sidebarOpen=true
      */}
      <Sidebar
        role={role}
        isMobile={isMobile}
        isOpen={sidebarOpen}
        onCollapsedChange={handleSidebarChange}
        onNavigate={handleCloseSidebar}
      />

      {/* ── Main Content Area ─────────────────────────────────────────────
          Flex child that takes remaining space after sidebar
      */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          // ✅ KEY: Desktop reserves sidebar space; mobile does NOT (overlay style)
          marginLeft: isMobile ? 0 : sidebarWidth,
          transition: 'margin-left var(--transition-slow, 0.35s cubic-bezier(0.4,0,0.2,1))',
          minWidth: 0, // 🔴 CRITICAL: Prevents flex child overflow
        }}
      >
        {/* ── Navbar: Top bar with hamburger, title, user menu ──────────────
            Shows hamburger on mobile (isMobile=true)
            Hamburger toggles sidebar overlay
        */}
        <Navbar
          isMobile={isMobile}
          sidebarOpen={sidebarOpen}
          onMenuToggle={handleMenuToggle}
        />

        {/* ── Main Content: Routed page content ──────────────────────────────
            Scrollable with padding; renders <Outlet /> from React Router
        */}
        <main
          style={{
            flex: 1,
            padding: 'clamp(12px, 5vw, 24px)', // Responsive padding
            paddingBottom: 'clamp(12px, 5vw, 24px)',
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