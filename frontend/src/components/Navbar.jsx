import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, CreditCard, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { currentUser, logout, isOwner, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getStyle = (path, tabName) => {
    const isPath = location.pathname === path;
    const currentTab = searchParams.get('tab');
    let isActive = false;

    if (isPath) {
      if (tabName) {
        isActive = currentTab === tabName;
      } else {
        isActive = !currentTab || !['payments', 'settings'].includes(currentTab);
      }
    }

    return `flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase transition ${
      isActive ? 'text-black' : 'text-gray-400 hover:text-black'
    }`;
  };

  const getMobileStyle = (path, tabName) => {
    const isPath = location.pathname === path;
    const currentTab = searchParams.get('tab');
    let isActive = false;

    if (isPath) {
      if (tabName) {
        isActive = currentTab === tabName;
      } else {
        isActive = !currentTab || !['payments', 'settings'].includes(currentTab);
      }
    }

    return `block text-xs font-bold tracking-widest uppercase py-2 ${
      isActive ? 'text-black' : 'text-gray-400'
    }`;
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="border-b border-border bg-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-[65px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="text-lg font-black tracking-[0.2em] uppercase">
          QR Dine
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {!currentUser && (
            <>
              <Link to="/owner-login" className="text-xs font-bold tracking-widest uppercase text-muted hover:text-primary transition">
                Owner Login
              </Link>
              <Link to="/owner-signup" className="btn-primary !text-[10px] !py-2.5 !px-5">
                Get Started
              </Link>
            </>
          )}

          {isOwner && (
            <>
              <Link to="/owner/dashboard" className={getStyle('/owner/dashboard', null)}>
                <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
              </Link>
              <Link to="/owner/dashboard?tab=payments" className={getStyle('/owner/dashboard', 'payments')}>
                <CreditCard className="w-3.5 h-3.5" /> Payments
              </Link>
              <Link to="/owner/dashboard?tab=settings" className={getStyle('/owner/dashboard', 'settings')}>
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-gray-400 hover:text-black transition">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </>
          )}

          {isAdmin && (
            <>
              <Link to="/admin/dashboard" className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-muted hover:text-primary transition">
                <LayoutDashboard className="w-3.5 h-3.5" /> Admin Panel
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1.5 text-xs font-bold tracking-widest uppercase text-muted hover:text-primary transition">
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-primary">
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden border-t border-border bg-white overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              {!currentUser && (
                <>
                  <Link to="/owner-login" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold tracking-widest uppercase text-muted py-2">Owner Login</Link>
                  <Link to="/owner-signup" onClick={() => setMobileMenuOpen(false)} className="block btn-primary text-center !text-[10px]">Get Started</Link>
                </>
              )}
              {isOwner && (
                <>
                  <Link to="/owner/dashboard" onClick={() => setMobileMenuOpen(false)} className={getMobileStyle('/owner/dashboard', null)}>Dashboard</Link>
                  <Link to="/owner/dashboard?tab=payments" onClick={() => setMobileMenuOpen(false)} className={getMobileStyle('/owner/dashboard', 'payments')}>Payments</Link>
                  <Link to="/owner/dashboard?tab=settings" onClick={() => setMobileMenuOpen(false)} className={getMobileStyle('/owner/dashboard', 'settings')}>Settings</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block text-xs font-bold tracking-widest uppercase text-gray-400 py-2 w-full text-left">Logout</button>
                </>
              )}
              {isAdmin && (
                <>
                  <Link to="/admin/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-xs font-bold tracking-widest uppercase text-muted py-2">Admin Panel</Link>
                  <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="block text-xs font-bold tracking-widest uppercase text-muted py-2 w-full text-left">Logout</button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
