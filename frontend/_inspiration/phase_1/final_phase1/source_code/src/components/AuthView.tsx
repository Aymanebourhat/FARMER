import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { 
  User, Phone, Home, MapPin, Lock, CheckCircle2, Globe, Eye, EyeOff, 
  Tractor, ArrowLeft, ArrowRight, ShieldCheck, TrendingUp, Sparkles 
} from 'lucide-react';
import { motion } from 'motion/react';
import TextType from './TextType';

interface AuthViewProps {
  currentLanguage: Language;
  setLanguage: (lang: Language) => void;
  mode: 'login' | 'signup';
  setMode: (mode: 'login' | 'signup') => void;
  onAuthSuccess: (user: UserProfile) => void;
  onCancel: () => void;
}

export default function AuthView({
  currentLanguage,
  setLanguage,
  mode,
  setMode,
  onAuthSuccess,
  onCancel,
}: AuthViewProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [fullName, setFullName] = React.useState('');
  const [farmName, setFarmName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [location, setLocation] = React.useState('Settat');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  // Focus states to handle dynamic typing placeholders
  const [fullNameFocused, setFullNameFocused] = React.useState(false);
  const [farmNameFocused, setFarmNameFocused] = React.useState(false);
  const [phoneFocused, setPhoneFocused] = React.useState(false);
  const [passwordFocused, setPasswordFocused] = React.useState(false);

  // Active hover/tab state for decorative features to add micro-interactions
  const [activeFeature, setActiveFeature] = React.useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // validation
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
        language: currentLanguage,
        onboardingComplete: mode === 'signup' ? false : true,
      };
      onAuthSuccess(mockProfile);
      setSuccess(false);
      // Reset fields
      setFullName('');
      setFarmName('');
      setPhone('');
      setPassword('');
      setShowPassword(false);
    }, 1500);
  };

  const moroccanCities = [
    'Settat', 'El Kelaa des Sraghna', 'Oujda', 'Marrakech', 'Chefchaouen', 
    'Fès', 'Meknès', 'Khenifra', 'Guelmim', 'Taroudant', 'Berkane', 'Safi'
  ];

  // Features list for the interactive side panel
  const features = [
    {
      id: 0,
      title: t.feat1Title || 'Livestock Records',
      desc: t.feat1Desc || 'Detailed digital cards for every sheep.',
      icon: <Tractor className="text-primary-container" size={20} />,
      badge: 'Sardi & Timahdite'
    },
    {
      id: 1,
      title: t.feat2Title || 'Weight Tracker',
      desc: t.feat2Desc || 'Monitor growth progress & marketing value.',
      icon: <TrendingUp className="text-primary-container" size={20} />,
      badge: '+12% growth avg'
    },
    {
      id: 2,
      title: t.feat3Title || 'Health History',
      desc: t.feat3Desc || 'Preventive vaccination logs & treatment schedules.',
      icon: <ShieldCheck className="text-primary-container" size={20} />,
      badge: '100% Secure Logs'
    }
  ];

  // Synchronized typing placeholder animation states
  const [syncPhraseIndex, setSyncPhraseIndex] = React.useState(0);
  const [syncCharIndex, setSyncCharIndex] = React.useState(0);
  const [syncPhase, setSyncPhase] = React.useState<'typing' | 'holding' | 'deleting'>('typing');

  // Blinking cursor state
  const [cursorVisible, setCursorVisible] = React.useState(true);
  React.useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const placeholderTexts = React.useMemo(() => ({
    fullName: isRtl 
      ? ["مثلا: محمد العلمي", "أدخل اسمك الكامل هنا"] 
      : ["Mohamed Alami", "Enter your full name here"],
    farmName: isRtl 
      ? ["مثلا: فيرمة الأمل", "أدخل اسم مزرعتك هنا"] 
      : ["Ferme Al Amal", "Enter your farm name here"],
    phone: isRtl 
      ? ["06XXXXXXXX", "أدخل رقم هاتفك"] 
      : ["06XXXXXXXX", "Enter your phone number"],
    password: isRtl 
      ? ["••••••••", "أدخل كلمة سر قوية"] 
      : ["••••••••", "Enter a secure password"]
  }), [isRtl]);

  React.useEffect(() => {
    const fnPhrases = placeholderTexts.fullName;
    const farmPhrases = placeholderTexts.farmName;
    const phonePhrases = placeholderTexts.phone;
    const passPhrases = placeholderTexts.password;

    const activeFn = fnPhrases[syncPhraseIndex % fnPhrases.length];
    const activeFarm = farmPhrases[syncPhraseIndex % farmPhrases.length];
    const activePhone = phonePhrases[syncPhraseIndex % phonePhrases.length];
    const activePass = passPhrases[syncPhraseIndex % passPhrases.length];

    const maxLength = Math.max(
      activeFn.length,
      activeFarm.length,
      activePhone.length,
      activePass.length
    );

    let timeoutId: NodeJS.Timeout;

    if (syncPhase === 'typing') {
      if (syncCharIndex < maxLength) {
        timeoutId = setTimeout(() => {
          setSyncCharIndex(prev => prev + 1);
        }, 50); // typing speed
      } else {
        timeoutId = setTimeout(() => {
          setSyncPhase('holding');
        }, 50);
      }
    } else if (syncPhase === 'holding') {
      timeoutId = setTimeout(() => {
        setSyncPhase('deleting');
      }, 2500); // hold duration
    } else if (syncPhase === 'deleting') {
      if (syncCharIndex > 0) {
        timeoutId = setTimeout(() => {
          setSyncCharIndex(prev => prev - 1);
        }, 25); // deleting speed
      } else {
        timeoutId = setTimeout(() => {
          setSyncPhraseIndex(prev => (prev + 1) % 2);
          setSyncPhase('typing');
        }, 300); // brief gap before next typing start
      }
    }

    return () => clearTimeout(timeoutId);
  }, [syncCharIndex, syncPhase, syncPhraseIndex, placeholderTexts]);

  // Derived sliced text to render inside the placeholder elements
  const displayedFnText = placeholderTexts.fullName[syncPhraseIndex % placeholderTexts.fullName.length].slice(0, syncCharIndex);
  const displayedFarmText = placeholderTexts.farmName[syncPhraseIndex % placeholderTexts.farmName.length].slice(0, syncCharIndex);
  const displayedPhoneText = placeholderTexts.phone[syncPhraseIndex % placeholderTexts.phone.length].slice(0, syncCharIndex);
  const displayedPassText = placeholderTexts.password[syncPhraseIndex % placeholderTexts.password.length].slice(0, syncCharIndex);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-6xl mx-auto py-4 md:py-8 lg:py-12"
    >
      {/* Back Button with subtle styling */}
      <div className={`mb-6 flex ${isRtl ? 'justify-end' : 'justify-start'}`}>
        <button
          onClick={onCancel}
          className="group flex items-center gap-2 text-sm font-semibold text-secondary hover:text-primary transition-all px-3 py-1.5 rounded-lg hover:bg-surface-container"
        >
          {isRtl ? (
            <>
              <span>الرجوع للرئيسية</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform animate-pulse" />
            </>
          ) : (
            <>
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform animate-pulse" />
              <span>Back to Home</span>
            </>
          )}
        </button>
      </div>

      {/* Modern Grid Split Screen to make the page incredibly Alive */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch ${isRtl ? 'lg:flex-row-reverse' : 'lg:flex-row'}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* Left Interactive Panel (Hidden on small screens, gorgeous on large screens) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-gradient-to-br from-primary-fixed/30 via-secondary-fixed/20 to-surface-container-low rounded-2xl border border-secondary-fixed-dim/50 shadow-sm relative overflow-hidden">
          {/* Decorative Background Art */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-80 h-80 bg-tertiary-fixed/10 rounded-full blur-2xl pointer-events-none" />

          {/* Top Info section */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-fixed shadow-md shadow-primary/10">
                <Tractor size={18} className="text-primary-fixed" />
              </div>
              <span className="font-sans text-xl font-extrabold tracking-tight text-primary">
                FellahLink
              </span>
            </div>

            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                <Sparkles size={12} className="animate-pulse text-primary" />
                {isRtl ? 'منصة الفلاح الرقمية الأولى بالمغرب' : '#1 Moroccan Farmer App'}
              </span>
              <h2 className="text-2xl font-black text-primary leading-snug">
                {isRtl ? "طوّر أسلوب تسيير كسيـبتك ورقمن مشروعك الفلاحي" : "Elevate Livestock Management in Morocco today"}
              </h2>
              <p className="text-sm text-on-surface-variant/90 leading-relaxed">
                {isRtl 
                  ? 'انضم إلى مئات المربين وعزز قيمة مواشيك عبر تتبع دقيق للأوزان، التلقيحات، مع الحفاظ على سجل كامل وموثوق لكل حيوان.' 
                  : 'Track sheep pedigrees, organize health logs, and optimize individual growth trends seamlessly from any Moroccan province.'}
              </p>
            </div>

            {/* Interactive Feature Cards with hover triggers */}
            <div className="mt-8 space-y-3">
              {features.map((feat) => (
                <div
                  key={feat.id}
                  onMouseEnter={() => setActiveFeature(feat.id)}
                  className={`p-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                    activeFeature === feat.id
                      ? 'bg-white border-primary/20 shadow-sm scale-[1.02]'
                      : 'bg-white/50 border-secondary-container/20 hover:bg-white/80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-fixed text-primary mt-0.5">
                      {feat.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-primary">{feat.title}</h4>
                        <span className="text-[9px] font-bold bg-secondary-fixed text-on-secondary-fixed-variant px-1.5 py-0.5 rounded-full font-mono">
                          {feat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant/80 mt-1">{feat.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Moroccan Support Flag/Badge */}
          <div className="mt-8 pt-4 border-t border-secondary-container/30">
            <p className="text-[11px] text-on-surface-variant/90 leading-relaxed italic font-medium">
              {t.moroccanFarmsSupport}
            </p>
            <div className="flex items-center gap-2 mt-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success animate-ping" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                {t.badgeBuiltForMoroccan || 'Built for Moroccan Farmers'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Form Card Panel */}
        <div className="col-span-1 lg:col-span-7 flex flex-col justify-center">
          <div className="bg-surface-container-lowest border border-secondary-fixed-dim rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden">
            {/* Top decorative accent bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-tertiary-fixed" />
            
            {/* Logo and Greeting for Mobile (hidden on desktop) */}
            <div className="text-center mb-6 lg:hidden">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-3">
                <Tractor size={26} />
              </div>
              <h1 className="text-3xl font-extrabold text-primary tracking-tight mb-1">
                FellahLink
              </h1>
              <p className="text-sm text-on-surface-variant font-medium">
                {mode === 'signup' ? t.createAccountTitle : t.welcomeBack}
              </p>
            </div>

            {/* Desktop form header (visible on desktop) */}
            <div className="hidden lg:block mb-6">
              <h1 className="text-2xl font-black text-primary tracking-tight mb-1">
                {mode === 'signup' ? t.createAccountTitle : t.welcomeBack}
              </h1>
              <p className="text-xs text-on-surface-variant">
                {mode === 'signup' 
                  ? (isRtl ? "سجل حسابك ككساب مجانا في أقل من دقيقة" : "Register your farm in less than a minute")
                  : (isRtl ? "أدخل نمرة الهاتف لتسجيل الدخول للحساب" : "Enter your phone number to sign in")
                }
              </p>
            </div>

            {success ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                  <CheckCircle2 size={64} className="text-primary relative z-10 animate-bounce" />
                </div>
                <h2 className="text-xl font-black text-primary">
                  {mode === 'login' ? t.successLogin : t.successSignup}
                </h2>
                <p className="text-xs text-on-surface-variant">
                  {isRtl ? 'جاري توجيهك إلى لوحة التحكم الشخصية...' : 'Redirecting to your smart farm dashboard...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3.5 bg-error-container/30 border border-error/20 text-error text-xs font-semibold rounded-lg text-center">
                    {error}
                  </div>
                )}

                {mode === 'signup' && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-1">
                      <label htmlFor="fullname" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t.fullNameLabel}
                      </label>
                      <div className="relative">
                        <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                          <User size={18} />
                        </span>
                        <input
                          id="fullname"
                          type="text"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          onFocus={() => setFullNameFocused(true)}
                          onBlur={() => setFullNameFocused(false)}
                          required
                          className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors relative z-0 ${
                            isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
                          }`}
                        />
                        {/* Dynamic Typing placeholder inside the field! */}
                        {!fullNameFocused && !fullName && (
                          <div className={`absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/50 text-sm z-10 ${isRtl ? 'right-10' : 'left-10'}`}>
                            <span>{displayedFnText}</span>
                            {cursorVisible && <span className="text-primary/70 font-semibold ml-0.5 font-mono">|</span>}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Farm Name */}
                    <div className="space-y-1">
                      <label htmlFor="farmname" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                        {t.farmName}
                      </label>
                      <div className="relative">
                        <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                          <Home size={18} />
                        </span>
                        <input
                          id="farmname"
                          type="text"
                          value={farmName}
                          onChange={(e) => setFarmName(e.target.value)}
                          onFocus={() => setFarmNameFocused(true)}
                          onBlur={() => setFarmNameFocused(false)}
                          required
                          className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors relative z-0 ${
                            isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
                          }`}
                        />
                        {/* Dynamic Typing placeholder inside the field! */}
                        {!farmNameFocused && !farmName && (
                          <div className={`absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/50 text-sm z-10 ${isRtl ? 'right-10' : 'left-10'}`}>
                            <span>{displayedFarmText}</span>
                            {cursorVisible && <span className="text-primary/70 font-semibold ml-0.5 font-mono">|</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Phone Number */}
                <div className="space-y-1">
                  <label htmlFor="phone" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.phone}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                      <Phone size={18} />
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      onFocus={() => setPhoneFocused(true)}
                      onBlur={() => setPhoneFocused(false)}
                      pattern="[0-9]{10}"
                      required
                      className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors relative z-0 ${
                        isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
                      }`}
                    />
                    {/* Dynamic Typing placeholder inside the field! */}
                    {!phoneFocused && !phone && (
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/50 text-sm z-10 ${isRtl ? 'right-10' : 'left-10'}`}>
                        <span>{displayedPhoneText}</span>
                        {cursorVisible && <span className="text-primary/70 font-semibold ml-0.5 font-mono">|</span>}
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] text-outline mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.moroccanPhoneNotice}
                  </p>
                </div>

                {mode === 'signup' && (
                  /* Farm Region / Location */
                  <div className="space-y-1">
                    <label htmlFor="location" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {t.location}
                    </label>
                    <div className="relative">
                      <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                        <MapPin size={18} />
                      </span>
                      <select
                        id="location"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm appearance-none transition-colors relative z-0 ${
                          isRtl ? 'pr-10 pl-8 text-right' : 'pl-10 pr-8 text-left'
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
                <div className="space-y-1">
                  <label htmlFor="password" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.passwordLabel}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                      <Lock size={18} />
                    </span>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                      minLength={8}
                      required
                      className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm transition-colors relative z-0 ${
                        isRtl ? 'pr-10 pl-10 text-right' : 'pl-10 pr-10 text-left'
                      }`}
                    />
                    {/* Dynamic Typing placeholder inside the field! */}
                    {!passwordFocused && !password && (
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/50 text-sm z-10 ${isRtl ? 'right-10' : 'left-10'}`}>
                        <span>{displayedPassText}</span>
                        {cursorVisible && <span className="text-primary/70 font-semibold ml-0.5 font-mono">|</span>}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute inset-y-0 flex items-center text-outline-variant hover:text-primary transition-colors z-20 ${
                        isRtl ? 'left-3' : 'right-3'
                      }`}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  <p className={`text-[10px] text-outline mt-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.passwordLengthNotice}
                  </p>
                </div>

                {/* Preferred Language Select matching the exact layout */}
                <div className="space-y-1">
                  <label htmlFor="language" className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant/90 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.preferredLanguageLabel}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                      <Globe size={18} />
                    </span>
                    <select
                      id="language"
                      value={currentLanguage}
                      onChange={(e) => setLanguage(e.target.value as Language)}
                      className={`block w-full py-3 border border-secondary-fixed-dim rounded-lg bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm appearance-none transition-colors relative z-0 ${
                        isRtl ? 'pr-10 pl-8 text-right' : 'pl-10 pr-8 text-left'
                      }`}
                    >
                      <option value="ar">العربية (Arabic)</option>
                      <option value="darija">الدارجة المغربية (Darija)</option>
                      <option value="fr">Français (French)</option>
                      <option value="en">English (English)</option>
                    </select>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-on-primary bg-primary hover:bg-primary-container focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all active:shadow-inner mt-6 transform hover:scale-[1.01]"
                >
                  {mode === 'login' ? t.loginBtn : t.signUp}
                </button>
              </form>
            )}

            {/* Toggle Option Link */}
            {!success && (
              <div className="mt-6 text-center border-t border-secondary-container/30 pt-4">
                <p className="text-xs text-on-surface-variant font-medium">
                  {mode === 'login' ? t.signUpPrompt : t.loginPrompt}{' '}
                  <button
                    id="auth-toggle-btn"
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-xs font-bold text-primary hover:text-primary-container hover:underline transition-colors decoration-primary/30 underline-offset-2 animate-pulse"
                  >
                    {mode === 'login' ? t.signUpHere : t.loginHere}
                  </button>
                </p>
              </div>
            )}

          </div>
        </div>

      </div>
    </motion.div>
  );
}
