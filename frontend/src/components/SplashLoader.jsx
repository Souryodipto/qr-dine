import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashLoader({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 400);
    const t2 = setTimeout(() => setPhase(2), 1200);
    const t3 = setTimeout(() => setPhase(3), 2000);
    const t4 = setTimeout(() => { if (onComplete) onComplete(); }, 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center"
        >
          {/* Logo text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 0 ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="text-center"
          >
            <h1 className="text-white text-5xl md:text-7xl font-bold tracking-[0.3em] uppercase" style={{ fontFamily: "'Inter', sans-serif" }}>
              QR DINE
            </h1>
          </motion.div>

          {/* Animated line */}
          <motion.div
            initial={{ width: 0 }}
            animate={phase >= 1 ? { width: 120 } : { width: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="h-[1px] bg-white/60 mt-6"
          />

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="text-white/50 text-xs tracking-[0.4em] uppercase mt-4"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Restaurant SaaS Platform
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
