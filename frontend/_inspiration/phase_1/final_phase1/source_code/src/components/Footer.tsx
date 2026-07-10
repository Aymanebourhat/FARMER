import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { Tractor } from 'lucide-react';

interface FooterProps {
  currentLanguage: Language;
}

export default function Footer({ currentLanguage }: FooterProps) {
  const t = translations[currentLanguage];
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-secondary-container/30 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-fixed">
              <Tractor size={15} />
            </div>
            <span className="font-sans text-lg font-bold tracking-tight text-primary">
              {t.appName}
            </span>
          </div>
          
          <p className="text-xs text-on-surface-variant/80 text-center max-w-md">
            {t.moroccanFarmsSupport}
          </p>

          <p className="text-xs text-on-surface-variant/70">
            &copy; {currentYear} {t.appName}. Built with pride for Moroccan farmers.
          </p>
        </div>
      </div>
    </footer>
  );
}
