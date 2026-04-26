import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, TimerReset, HeartHandshake } from 'lucide-react';

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_15%_20%,#dcfce7_0%,#f0fdf4_35%,#f8fafc_70%)] dark:bg-[radial-gradient(circle_at_15%_20%,#14532d_0%,#0f172a_40%,#020617_80%)]">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-80px] right-[-40px] w-72 h-72 rounded-full bg-emerald-300/30 blur-3xl" />
        <div className="absolute bottom-[-90px] left-[-50px] w-80 h-80 rounded-full bg-teal-300/25 blur-3xl" />
      </div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-16 lg:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-emerald-200/80 bg-white/70 backdrop-blur-sm text-emerald-800 text-sm font-semibold"
        >
          <HeartHandshake size={16} />
          Food Donation Management System
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-6 text-4xl md:text-6xl font-serif font-bold leading-tight text-stone-900 dark:text-stone-100"
        >
          Rescue Surplus Food.
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-600 dark:from-emerald-400 dark:to-teal-300">
            Track Every Pickup in Real Time.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 max-w-2xl text-stone-600 dark:text-stone-300 text-lg"
        >
          FoodConnect helps hotels post expiring food, volunteers claim quickly, and both parties verify handoff with secure hashes.
          Built for reliability, speed, and measurable impact.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.28 }}
          className="mt-10 flex flex-wrap gap-3"
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-white font-semibold shadow-lg bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 transition-transform hover:-translate-y-0.5"
          >
            Get Started
            <ArrowRight size={18} />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 bg-white/80 dark:bg-stone-900/60 border border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 font-semibold"
          >
            Explore Features
          </a>
        </motion.div>

        <section id="features" className="mt-14 grid md:grid-cols-3 gap-4">
          {[
            { icon: ShieldCheck, title: 'Secure Verification', text: 'Pickup and delivery hash verification prevents false completion.' },
            { icon: TimerReset, title: 'Expiry Alerts', text: 'Expiring donations are highlighted to prioritize urgent rescues.' },
            { icon: HeartHandshake, title: 'Impact Analytics', text: 'Track food saved, total donations, and active volunteers live.' },
          ].map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.33 + index * 0.08 }}
              className="rounded-3xl border border-white/60 dark:border-stone-700/80 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
            >
              <item.icon className="text-emerald-700 dark:text-emerald-400" size={20} />
              <h3 className="mt-3 text-lg font-semibold text-stone-900 dark:text-stone-100">{item.title}</h3>
              <p className="mt-2 text-sm text-stone-600 dark:text-stone-300">{item.text}</p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
