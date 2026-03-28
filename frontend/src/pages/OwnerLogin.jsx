import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function OwnerLogin() {
  const navigate = useNavigate();
  const { login, isOwner, currentUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Already logged in - redirect appropriately
  if (isOwner && currentUser) {
    navigate(currentUser.hasRestaurant ? '/owner/dashboard' : '/owner/setup');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password, false);
      if (user.role === 'owner') {
        navigate(user.hasRestaurant ? '/owner/dashboard' : '/owner/setup');
      } else {
        setError('This login is for restaurant owners only.');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-white flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl heading-font font-bold mb-3 tracking-tight">Welcome back</h1>
          <p className="text-muted text-sm leading-relaxed max-w-xs">Manage your restaurant and orders in real-time.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!!error && (
            <div className="bg-danger/5 border border-danger/20 text-danger p-4 text-sm font-medium mb-6 animate-fade-in">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-premium pl-12"
                placeholder="owner@restaurant.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-premium pl-12 pr-12"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Sign In <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-8">
          Don't have an account? <Link to="/owner-signup" className="font-bold text-primary hover:underline">Create one</Link>
        </p>

        <p className="text-center mt-6 text-[10px] text-muted/40">
          Powered by{' '}
          <a href="https://www.resurgenixtechnologies.com" target="_blank" rel="noopener noreferrer" className="hover:text-muted transition underline underline-offset-2">
            Resurgenix Technologies
          </a>
        </p>
      </motion.div>
    </div>
  );
}
