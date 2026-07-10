import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  currentLanguage: Language;
  onOpenAuth: (mode: 'login' | 'signup') => void;
  setTab: (tab: string) => void;
}

export default function Hero({ currentLanguage, onOpenAuth, setTab }: HeroProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  return (
    <section className="py-12 md:py-16 lg:py-20">
      <div className={`flex flex-col lg:flex-row items-center gap-12 lg:gap-16 ${
        isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'
      }`}>
        {/* Left text column */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex-1 space-y-6 text-right lg:text-left"
          style={{ textAlign: isRtl ? 'right' : 'left' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary leading-tight tracking-tight">
            {t.heroTitle}
          </h2>
          <p className="text-base sm:text-lg text-on-surface-variant/90 leading-relaxed max-w-2xl">
            {t.heroSubtitle}
          </p>

          <div className={`flex flex-col sm:flex-row gap-4 pt-4 justify-start ${
            isRtl ? 'sm:flex-row-reverse' : 'sm:flex-row'
          }`}>
            <button
              id="hero-create-acc-btn"
              onClick={() => onOpenAuth('signup')}
              className="px-8 py-3.5 bg-primary text-on-primary hover:bg-primary-container font-semibold rounded-lg shadow-md transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.createFarmerAccount}
            </button>
            <button
              id="hero-login-btn"
              onClick={() => onOpenAuth('login')}
              className="px-8 py-3.5 border-2 border-primary text-primary hover:bg-surface-container font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {t.loginBtn}
            </button>
          </div>

          <div className={`pt-8 flex items-center gap-3 text-secondary ${
            isRtl ? 'justify-start flex-row-reverse' : 'justify-start'
          }`}>
            <ShieldCheck size={22} className="text-primary shrink-0" />
            <span className="text-sm font-semibold tracking-wide">
              {t.badgeBuiltForMoroccan}
            </span>
          </div>
        </motion.div>

        {/* Right illustration column */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex-1 w-full relative"
        >
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-surface-variant border border-secondary-container shadow-xl">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7T7ZVX1JlopYVpf8dOx7L5EPWVpv5--r8VhFTBOsKlboPsWv-a7x9Cq4gLEcnQGYr5P1xNlwSuYiribqK-MuhxlrwCTN5di2g1b4p1cP7wrG9CsVTaQlOUCQxkac1QGmsuaYV9VZcpTsrF0encwcSBvBC_XEvBIg6cxyTztHp9t3vqVFXnDckZ_ZHBJNhPfrerL-tN4SVk0G-qP6ulWLUN1IHdcrNitABWLY4jeo5u0USiYBxArOQBYHaUiaTnu8LZM3m6u_qPrs"
              alt="Moroccan farmer managing herd"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Decorative organic glow blob */}
          <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-primary-fixed/40 rounded-full filter blur-2xl opacity-60 pointer-events-none -z-10"></div>
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary-fixed/40 rounded-full filter blur-2xl opacity-60 pointer-events-none -z-10"></div>
        </motion.div>
      </div>
    </section>
  );
}
