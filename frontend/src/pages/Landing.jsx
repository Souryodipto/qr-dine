import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Store, Utensils, BarChart3, Shield, Zap, ArrowRight, ChevronDown, Check } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Store, title: 'Instant Onboarding', desc: 'Set up your restaurant in under 5 minutes. No technical knowledge required.' },
    { icon: QrCode, title: 'Auto QR System', desc: 'Generate unique QR codes for every table. Customers scan and order instantly.' },
    { icon: Utensils, title: 'Full Menu Control', desc: 'Create categories, add items, set prices, and toggle availability in real-time.' },
    { icon: BarChart3, title: 'Live Analytics', desc: 'Track orders, revenue, and peak hours from a clean, minimal dashboard.' },
    { icon: Shield, title: 'Tenant Isolation', desc: 'Each restaurant is fully isolated. Your data is yours. Always.' },
    { icon: Zap, title: 'Zero Friction', desc: 'Customers never need to download an app or create an account. Just scan.' },
  ];

  const steps = [
    { num: '01', title: 'Sign Up & Configure', desc: 'Create your account, set up your restaurant profile, menu, and payment details.' },
    { num: '02', title: 'Generate QR Codes', desc: 'Tell us how many tables you have. We auto-generate a unique QR for each.' },
    { num: '03', title: 'Go Live', desc: 'Print your QR codes, place them on tables. Customers scan, order, and pay.' },
  ];

  return (
    <div className="min-h-screen bg-white text-primary">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <p className="text-white/40 text-xs tracking-[0.5em] uppercase mb-6 font-semibold">Restaurant SaaS Platform</p>
            <h1 className="text-white text-5xl sm:text-6xl md:text-8xl font-bold leading-[0.95] mb-8" style={{ fontFamily: "'Playfair Display', serif" }}>
              The Future of<br />Dine-In Ordering
            </h1>
            <p className="text-white/50 text-base md:text-lg max-w-xl mx-auto leading-relaxed mb-12">
              A plug-and-play platform where restaurants onboard in minutes, customers order via QR — no apps, no downloads, no friction.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/owner-signup')} className="bg-white text-black font-bold text-xs tracking-[0.15em] uppercase px-10 py-5 hover:bg-white/90 transition-all">
                Get Started
              </button>
              <button onClick={() => navigate('/owner-login')} className="border border-white/30 text-white font-bold text-xs tracking-[0.15em] uppercase px-10 py-5 hover:bg-white/10 transition-all">
                Owner Login
              </button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="w-5 h-5 text-white/30 animate-bounce" />
          </motion.div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 bg-white border-b border-border">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-xs tracking-[0.4em] uppercase text-muted font-semibold mb-4">How It Works</p>
            <h2 className="text-4xl md:text-5xl heading-font font-bold">Three steps to go live</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="text-center md:text-left"
              >
                <span className="text-6xl md:text-7xl font-black text-border leading-none block mb-6">{step.num}</span>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 md:py-32 bg-surface-alt">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <p className="text-xs tracking-[0.4em] uppercase text-muted font-semibold mb-4">Platform Features</p>
            <h2 className="text-4xl md:text-5xl heading-font font-bold">Everything you need.<br />Nothing you don't.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-white border border-border p-8 hover:shadow-lg transition-shadow group"
                >
                  <div className="w-12 h-12 bg-black flex items-center justify-center mb-6 group-hover:scale-105 transition-transform">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                  <p className="text-muted text-sm leading-relaxed">{feature.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 bg-white border-b border-border">
        <div className="max-w-xl mx-auto px-6 text-center">
          <p className="text-xs tracking-[0.4em] uppercase text-muted font-semibold mb-4">Pricing</p>
          <h2 className="text-4xl md:text-5xl heading-font font-bold mb-4">Simple, transparent pricing</h2>
          <p className="text-muted text-sm mb-12">One plan. Everything included. No hidden fees.</p>

          <div className="border border-border p-10 text-left">
            <p className="text-[10px] font-bold tracking-widest uppercase text-muted mb-2">Standard Plan</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-5xl font-black">₹1499</span>
              <span className="text-sm text-muted">/month</span>
            </div>
            <p className="text-[10px] text-muted mb-8">+ GST applicable</p>

            <div className="space-y-3 mb-10">
              {['Up to 10 tables', 'Unlimited orders', 'Direct payment to bank', 'Order dashboard', 'Menu management', 'QR code generation'].map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-black flex-shrink-0" />
                  <span className="text-sm">{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => navigate('/owner-signup')} className="btn-primary w-full flex items-center justify-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-black py-24 md:py-32">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-white text-4xl md:text-5xl heading-font font-bold mb-6">Ready to modernize<br />your restaurant?</h2>
          <p className="text-white/40 text-sm md:text-base mb-12 max-w-md mx-auto leading-relaxed">
            Join restaurants already using QR Dine to streamline orders and delight customers.
          </p>
          <button onClick={() => navigate('/owner-signup')} className="bg-white text-black font-bold text-xs tracking-[0.15em] uppercase px-12 py-5 hover:bg-white/90 transition-all inline-flex items-center gap-3">
            Start Setup <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-white py-16 text-sm text-muted">
        <div className="max-w-3xl mx-auto px-6 flex flex-col items-center text-center gap-8">
          <div>
            <span className="font-black tracking-[0.2em] uppercase text-xl text-primary block mb-2">QR DINE</span>
            <p className="text-xs text-muted-light max-w-xs">A premium plug-and-play platform for modern restaurant ordering.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
            <a href="#" className="hover:text-primary transition">Terms</a>
            <a href="#" className="hover:text-primary transition">Privacy</a>
            <a href="#" className="hover:text-primary transition">Support</a>
            <a href="#" className="hover:text-primary transition">Contact</a>
          </div>
          <div className="pt-8 border-t border-border/50 w-full">
            <p className="text-[10px] text-muted-light/60 tracking-wider">© 2026 QR Dine. All rights reserved.</p>
            <p className="text-[9px] text-muted-light/30 mt-2 italic">
              Powered by <a href="https://www.resurgenixtechnologies.com" target="_blank" rel="noopener noreferrer" className="hover:text-muted transition underline underline-offset-2">Resurgenix Technologies</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
