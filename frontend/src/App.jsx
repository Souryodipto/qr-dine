import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import OwnerLogin from './pages/OwnerLogin';
import OwnerSignup from './pages/OwnerSignup';
import AdminLogin from './pages/AdminLogin';
import SetupWizard from './pages/SetupWizard';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import CustomerMenu from './pages/CustomerMenu';

// Protected route for owner-only access
function OwnerRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!currentUser) return <Navigate to="/owner-login" />;
  if (currentUser.role !== 'owner') return <Navigate to="/" />;
  return children;
}

// Protected route for admin-only access
function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (!currentUser) return <Navigate to="/admin-login" />;
  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') return <Navigate to="/" />;
  return children;
}

// Route that redirects logged-in owners away from public pages
function PublicOnlyRoute({ children }) {
  const { currentUser, loading } = useAuth();
  if (loading) return null;
  if (currentUser && currentUser.role === 'owner') return <Navigate to="/owner/dashboard" replace />;
  if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'superadmin')) return <Navigate to="/admin/dashboard" replace />;
  return children;
}

// Hide navbar on customer QR routes and admin login
function AppLayout({ children }) {
  const location = useLocation();
  const isCustomerRoute = location.pathname.startsWith('/menu/');
  const isAdminLogin = location.pathname === '/admin-login';
  return (
    <div className="min-h-screen bg-white text-primary font-sans">
      {!isCustomerRoute && !isAdminLogin && <Navbar />}
      {children}
    </div>
  );
}

function App() {
  return (
    <AppLayout>
      <Routes>
        {/* ─── Public Landing ─── */}
        <Route path="/" element={<PublicOnlyRoute><Landing /></PublicOnlyRoute>} />

        {/* ─── Customer QR Menu (Public — no auth) ─── */}
        {/* With table: /menu/:slug/table/:tableNumber */}
        <Route path="/menu/:slug/table/:tableNumber" element={<CustomerMenu />} />
        {/* Without table (e.g. takeaway QR): /menu/:slug */}
        <Route path="/menu/:slug" element={<CustomerMenu />} />

        {/* ─── Legacy QR format support ─── */}
        <Route path="/r/:restaurantId/table/:tableId" element={<CustomerMenu />} />

        {/* ─── Owner Panel ─── */}
        <Route path="/owner-login" element={<PublicOnlyRoute><OwnerLogin /></PublicOnlyRoute>} />
        <Route path="/owner-signup" element={<PublicOnlyRoute><OwnerSignup /></PublicOnlyRoute>} />
        <Route path="/owner/setup" element={
          <OwnerRoute>
            <SetupWizard />
          </OwnerRoute>
        } />
        <Route path="/owner/dashboard" element={
          <OwnerRoute>
            <OwnerDashboard />
          </OwnerRoute>
        } />

        {/* ─── Admin Panel (Hidden) ─── */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        } />

        {/* ─── Legacy redirects ─── */}
        <Route path="/login" element={<Navigate to="/owner-login" />} />
        <Route path="/signup" element={<Navigate to="/owner-signup" />} />
        <Route path="/setup" element={<Navigate to="/owner/setup" />} />
        <Route path="/dashboard" element={<Navigate to="/owner/dashboard" />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" />} />

        {/* ─── Catch-all ─── */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  );
}

export default App;
