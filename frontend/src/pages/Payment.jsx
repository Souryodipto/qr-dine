import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CreditCard, Check, ArrowRight, Shield } from 'lucide-react';

// TODO: Replace simulated payment with real payment gateway integration (Razorpay/Stripe)

export default function Payment() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  if (!currentUser) {
    navigate('/owner-login');
    return null;
  }

  // Already paid — go to setup/dashboard
  if (localStorage.getItem('payment_status') === 'paid') {
    navigate(currentUser.restaurantId ? '/owner/dashboard' : '/owner/setup');
    return null;
  }

  const features = [
    'Up to 10 tables',
    'Unlimited orders',
    'Direct payment to bank',
    'Order dashboard',
    'Menu management',
    'QR code generation',
  ];

  const handleSimulatePayment = () => {
    // TODO: Replace simulated payment with real payment gateway integration (Razorpay/Stripe)
    localStorage.setItem('payment_status', 'paid');
    navigate('/owner/setup');
  };

  return (
    <div className="min-h-[calc(100vh-65px)] bg-white flex items-center justify-center px-6 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-black flex items-center justify-center mx-auto mb-5">
            <CreditCard className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl heading-font font-bold mb-2">Activate Your Plan</h1>
          <p className="text-muted text-sm">Complete payment to access your dashboard</p>
        </div>

        {/* Plan Card */}
        <div className="border border-border p-8 mb-6">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-1">Standard Plan</p>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black">₹1499</span>
                <span className="text-sm text-muted">/month</span>
              </div>
              <p className="text-[10px] text-muted mt-1">+ GST applicable</p>
            </div>
          </div>

          <div className="border-t border-border pt-6 space-y-3">
            {features.map((feature, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-black flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Action */}
        <button
          onClick={handleSimulatePayment}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          Proceed (Simulate Payment) <ArrowRight className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-center gap-2 mt-4 text-[10px] text-muted">
          <Shield className="w-3 h-3" />
          <span>Secure payment • Cancel anytime</span>
        </div>

        {/* Branding */}
        <p className="text-center mt-8 text-[10px] text-muted/40">
          Powered by{' '}
          <a href="https://www.resurgenixtechnologies.com" target="_blank" rel="noopener noreferrer" className="hover:text-muted transition underline underline-offset-2">
            Resurgenix Technologies
          </a>
        </p>
      </motion.div>
    </div>
  );
}
