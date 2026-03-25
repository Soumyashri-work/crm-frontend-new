import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth pages
import Login from './pages/auth/Login';
import AuthCallback from './pages/auth/AuthCallback';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AgentLayout from './layouts/AgentLayout';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminTickets from './pages/admin/Tickets';
import TicketDetails from './pages/admin/TicketDetails';
// import Accounts from './pages/admin/Accounts';        // disabled — multi-tenancy: admin sees own tenant only
// import AccountDetail from './pages/admin/AccountDetail'; // disabled — same reason
import Customers from './pages/admin/Customers';
import CustomerDetail from './pages/admin/CustomerDetail';
import Users from './pages/admin/Users';
import UserDetail from './pages/admin/UserDetail';
import Settings from './pages/admin/Settings';

// Agent pages
import AgentDashboard from './pages/agent/Dashboard';
import MyTickets from './pages/agent/MyTickets';
import AgentProfile from './pages/agent/Profile';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:            30_000,
      retry:                1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login"         element={<Login />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"     element={<AdminDashboard />} />
              <Route path="tickets"       element={<AdminTickets />} />
              <Route path="tickets/:id"   element={<TicketDetails />} />
              {/* Accounts routes disabled — admin belongs to one tenant, no cross-org accounts view */}
              {/* <Route path="accounts"      element={<Accounts />} /> */}
              {/* <Route path="accounts/:id"  element={<AccountDetail />} /> */}
              <Route path="customers"     element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />
              <Route path="users"         element={<Users />} />
              <Route path="users/:id"     element={<UserDetail />} />
              <Route path="settings"      element={<Settings />} />
            </Route>

            {/* Agent routes */}
            <Route path="/agent" element={
              <ProtectedRoute>
                <AgentLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard"  element={<AgentDashboard />} />
              <Route path="my-tickets" element={<MyTickets />} />
              <Route path="tickets/:id" element={<TicketDetails />} />
              <Route path="profile"    element={<AgentProfile />} />
            </Route>

            {/* Fallbacks */}
            <Route path="/"  element={<Navigate to="/login" replace />} />
            <Route path="*"  element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
