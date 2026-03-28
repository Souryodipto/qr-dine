import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Mail, Lock, Building2, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function OwnerSignup() {
  const [restaurantName, setRestaurantName] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(name, email, password, restaurantName);
      // After signup, restaurant exists in DB but needs setup
      navigate('/owner/setup');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-65px)] flex items-center justify-center px-4 py-12 bg-white">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-muted hover:text-primary transition mb-10">
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <h1 className="text-4xl md:text-5xl heading-font font-bold mb-3 tracking-tight">Create account</h1>
        <p className="text-muted text-sm mb-10 leading-relaxed max-w-xs">Start your restaurant's digital journey today.</p>

        {!!error && (
          <div className="bg-danger/5 border border-danger/20 text-danger p-4 text-sm font-medium mb-6 animate-fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Restaurant Name</label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" required value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="input-premium pl-12" placeholder="e.g. The Urban Fork" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Your Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="input-premium pl-12" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="input-premium pl-12" placeholder="you@restaurant.com" />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-premium pl-12 pr-12"
                placeholder="Min. 6 characters"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-primary">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-muted-light absolute left-4 top-1/2 -translate-y-1/2" />
              <input type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-premium pl-12" placeholder="Re-enter password" />
            </div>
          </div>

          <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Create Account <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted mt-8">
          Already have an account?{' '}
          <Link to="/owner-login" className="text-primary font-bold underline underline-offset-4 hover:text-muted transition">Sign in</Link>
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
