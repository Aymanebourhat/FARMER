import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { Globe, User, LogOut, Menu, X, Tractor } from 'lucide-react';

interface HeaderProps {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  currentTab: string;
  setTab: (tab: string) => void;
  user: any;
  onSignOut: () => void;
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export default function Header({
  currentLanguage,
  setLanguage,
  currentTab,
  setTab,
  user,
  onSignOut,
  onOpenAuth,
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [langMenuOpen, setLangMenuOpen] = React.useState(false);
  
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const getLanguageLabel = (lang: Language) => {
    const keyMap: Record<Language, string> = {
      ar: 'arabic',
      darija: 'darija',
      fr: 'french',
      en: 'english'
    };
    return t[keyMap[lang]] || '';
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'animals', label: t.animals },
    { id: 'listings', label: t.listings },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-secondary-container/40 shadow-sm transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo and Main Nav */}
          <div className="flex items-center gap-10">
            <button 
              onClick={() => { setTab('home'); setMobileMenuOpen(false); }}
              className="flex items-center gap-2 hover:opacity-90 focus:outline-none"
              id="logo-btn"
            >
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-fixed">
                <Tractor size={20} className="text-primary-fixed" />
              </div>
              <span className="font-sans text-2xl font-extrabold tracking-tight text-primary">
                {t.appName}
              </span>
            </button>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setTab(item.id)}
                  className={`font-sans font-semibold text-sm transition-all duration-200 py-2 border-b-2 ${
                    currentTab === item.id
                      ? 'text-primary border-primary'
                      : 'text-on-surface-variant/80 border-transparent hover:text-primary hover:border-primary/40'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                id="lang-selector-btn"
                onClick={() => setLangMenuOpen(!langMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-secondary hover:bg-surface-container transition-all"
              >
                <Globe size={16} />
                <span>{getLanguageLabel(currentLanguage)}</span>
              </button>

              {langMenuOpen && (
                <div 
                  className={`absolute mt-2 w-36 rounded-xl bg-white border border-secondary-container shadow-lg z-50 overflow-hidden ${
                    isRtl ? 'left-0' : 'right-0'
                  }`}
                >
                  {(['ar', 'darija', 'fr', 'en'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => {
                        setLanguage(lang);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-sm font-medium hover:bg-surface-container transition-all ${
                        isRtl ? 'text-right' : 'text-left'
                      } ${currentLanguage === lang ? 'bg-primary-fixed/20 text-primary font-semibold' : 'text-on-background'}`}
                    >
                      {getLanguageLabel(lang)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Auth / Profile Area */}
            {user ? (
              <div className="hidden md:flex items-center gap-3">
                <button
                  id="profile-nav-btn"
                  onClick={() => setTab('profile')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    currentTab === 'profile'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-secondary-container/60 text-secondary hover:bg-surface-container'
                  }`}
                >
                  <User size={16} />
                  <span>{user.farmName || user.fullName}</span>
                </button>
                <button
                  id="signout-btn"
                  onClick={onSignOut}
                  title={t.signOut}
                  className="p-2 text-on-surface-variant hover:text-error hover:bg-error-container/40 rounded-lg transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <button
                  id="login-header-btn"
                  onClick={() => onOpenAuth('login')}
                  className="px-4 py-2 text-sm font-bold text-primary hover:bg-surface-container rounded-lg transition-all"
                >
                  {t.login}
                </button>
                <button
                  id="signup-header-btn"
                  onClick={() => onOpenAuth('signup')}
                  className="px-4 py-2 text-sm font-bold bg-primary text-on-primary hover:bg-primary-container rounded-lg transition-all shadow-sm"
                >
                  {t.signUp}
                </button>
              </div>
            )}

            {/* Mobile Menu Icon */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-secondary md:hidden hover:bg-surface-container rounded-lg transition-all"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-secondary-container bg-white shadow-inner animate-fade-in py-4 px-4 space-y-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setTab(item.id);
                setMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold text-right transition-all ${
                isRtl ? 'text-right' : 'text-left'
              } ${
                currentTab === item.id
                  ? 'bg-primary text-on-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {item.label}
            </button>
          ))}
          
          <hr className="border-secondary-container/60" />

          {user ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  setTab('profile');
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-2 text-secondary hover:bg-surface-container ${
                  isRtl ? 'flex-row-reverse text-right' : 'text-left'
                }`}
              >
                <User size={16} />
                <span>{user.farmName || user.fullName}</span>
              </button>
              <button
                onClick={() => {
                  onSignOut();
                  setMobileMenuOpen(false);
                }}
                className={`w-full py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-2 text-error hover:bg-error-container/20 ${
                  isRtl ? 'flex-row-reverse text-right' : 'text-left'
                }`}
              >
                <LogOut size={16} />
                <span>{t.signOut}</span>
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onOpenAuth('login');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-sm font-bold border border-secondary-container text-primary rounded-xl"
              >
                {t.login}
              </button>
              <button
                onClick={() => {
                  onOpenAuth('signup');
                  setMobileMenuOpen(false);
                }}
                className="flex-1 py-2.5 text-center text-sm font-bold bg-primary text-on-primary rounded-xl shadow-sm"
              >
                {t.signUp}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
