import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Shield, Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, isAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAdmin) {
    navigate('/admin/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const user = await login(email, password, true); // true = admin login
      if (user.role === 'admin' || user.role === 'superadmin') {
        navigate('/admin/dashboard');
      } else {
        setError('Unauthorized. Admin access only.');
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 border border-white/20 flex items-center justify-center mx-auto mb-5">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-widest uppercase">Admin Access</h1>
          <p className="text-white/30 text-[10px] tracking-widest uppercase mt-2">Restricted • Company Only</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="border border-white/20 p-3 text-[10px] text-center font-bold text-red-400 bg-red-400/10">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold tracking-widest uppercase text-white/40 mb-1.5">Email</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm py-3 pl-10 pr-4 outline-none focus:border-white/30 transition placeholder:text-white/20"
                placeholder="admin@qrdine.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-[9px] font-bold tracking-widest uppercase text-white/40 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white text-sm py-3 pl-10 pr-10 outline-none focus:border-white/30 transition placeholder:text-white/20"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="w-full bg-white text-black text-xs font-bold tracking-widest uppercase py-3.5 hover:bg-white/90 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-6">
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Authenticate <ArrowRight className="w-3.5 h-3.5" /></>
            )}
          </button>
        </form>

        <p className="text-center text-[9px] text-white/20 mt-6 tracking-wider">
          Session expires after 24 hours
        </p>
      </motion.div>
    </div>
  );
}
