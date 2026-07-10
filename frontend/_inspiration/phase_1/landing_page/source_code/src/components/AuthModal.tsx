import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { X, User, Phone, Home, MapPin, Lock, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  currentLanguage: Language;
  isOpen: boolean;
  onClose: () => void;
  mode: 'login' | 'signup';
  setMode: (mode: 'login' | 'signup') => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthModal({
  currentLanguage,
  isOpen,
  onClose,
  mode,
  setMode,
  onAuthSuccess,
}: AuthModalProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [fullName, setFullName] = React.useState('');
  const [farmName, setFarmName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [location, setLocation] = React.useState('Settat');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'signup') {
      if (!fullName || !farmName || !phone || !password) {
        setError(t.fillAllFields);
        return;
      }
    } else {
      if (!phone || !password) {
        setError(t.fillAllFields);
        return;
      }
    }

    setSuccess(true);
    setTimeout(() => {
      const mockProfile: UserProfile = {
        fullName: mode === 'signup' ? fullName : 'Mohamed El Haouzi',
        farmName: mode === 'signup' ? farmName : 'Ferme El Haouz',
        phone: phone,
        location: mode === 'signup' ? location : 'Settat',
        email: email || undefined,
        language: currentLanguage,
      };
      onAuthSuccess(mockProfile);
      setSuccess(false);
      onClose();
      // Reset fields
      setFullName('');
      setFarmName('');
      setPhone('');
      setPassword('');
      setEmail('');
    }, 1500);
  };

  const moroccanCities = [
    'Settat', 'El Kelaa des Sraghna', 'Oujda', 'Marrakech', 'Chefchaouen', 
    'Fès', 'Meknès', 'Khenifra', 'Guelmim', 'Taroudant', 'Berkane', 'Safi'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-secondary-container"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all ${
                isRtl ? 'left-4' : 'right-4'
              }`}
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="p-6 bg-primary text-on-primary text-center">
              <h3 className="text-xl font-bold tracking-tight mb-2">
                {mode === 'login' ? t.welcomeBack : t.createAccountTitle}
              </h3>
              <p className="text-xs text-primary-fixed/80">
                {t.moroccanFarmsSupport}
              </p>
            </div>

            {/* Content Form */}
            <div className="p-6">
              {success ? (
                <div className="py-8 flex flex-col items-center justify-center space-y-4 text-center animate-pulse">
                  <CheckCircle2 size={56} className="text-primary" />
                  <p className="text-lg font-bold text-primary">
                    {mode === 'login' ? t.successLogin : t.successSignup}
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-error-container/30 border border-error/20 text-error text-xs font-semibold rounded-lg text-center">
                      {error}
                    </div>
                  )}

                  {mode === 'signup' && (
                    <>
                      {/* Full Name */}
                      <div>
                        <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t.animalName}
                        </label>
                        <div className="relative">
                          <User size={16} className={`absolute top-3 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
                          <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="e.g. Mohamed El Haouzi"
                            className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
                              isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
                            }`}
                          />
                        </div>
                      </div>

                      {/* Farm Name */}
                      <div>
                        <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                          {t.farmName}
                        </label>
                        <div className="relative">
                          <Home size={16} className={`absolute top-3 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
                          <input
                            type="text"
                            value={farmName}
                            onChange={(e) => setFarmName(e.target.value)}
                            placeholder="e.g. Ferme El Haouz"
                            className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
                              isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
                            }`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  {/* Phone Number */}
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.phone} <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <Phone size={16} className={`absolute top-3 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="e.g. 0612345678"
                        required
                        className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
                          isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
                        }`}
                      />
                    </div>
                  </div>

                  {mode === 'signup' && (
                    /* Farm Region / Location */
                    <div>
                      <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t.location}
                      </label>
                      <div className="relative">
                        <MapPin size={16} className={`absolute top-3 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
                        <select
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all appearance-none ${
                            isRtl ? 'pr-10 pl-4 text-right' : 'pl-10 pr-4 text-left'
                          }`}
                        >
                          {moroccanCities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Password */}
                  <div>
                    <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {mode === 'login' ? t.loginBtn : t.signUp} - Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className={`absolute top-3 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/60 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
                          isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="auth-submit-btn"
                    type="submit"
                    className="w-full py-3 bg-primary text-on-primary hover:bg-primary-container font-bold rounded-xl shadow-md transition-all mt-6"
                  >
                    {mode === 'login' ? t.login : t.signUp}
                  </button>

                  {/* Switch Mode Trigger */}
                  <div className="pt-4 text-center">
                    <button
                      id="auth-toggle-btn"
                      type="button"
                      onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                      className="text-xs font-bold text-primary hover:underline"
                    >
                      {mode === 'login'
                        ? `${t.signUp} ->`
                        : `${t.loginBtn} ->`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
