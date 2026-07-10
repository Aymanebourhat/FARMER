import React from 'react';
import { Language, UserProfile } from '../types';
import { 
  MapPin, CheckCircle2, Tractor, ShieldCheck, Sparkles, PawPrint, Layers, ArrowLeft, ArrowRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProfileCompletionViewProps {
  currentLanguage: Language;
  user: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

export default function ProfileCompletionView({
  currentLanguage,
  user,
  onSaveProfile,
  onSignOut
}: ProfileCompletionViewProps) {
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  // Form State
  const [farmName, setFarmName] = React.useState(user.farmName || '');
  const [selectedRegion, setSelectedRegion] = React.useState('marrakech-safi');
  const [selectedProvince, setSelectedProvince] = React.useState('marrakech');
  const [selectedCommune, setSelectedCommune] = React.useState('marrakech');
  const [livestockType, setLivestockType] = React.useState<'Sheep' | 'Cow' | 'Goat' | 'Camel' | 'Other'>('Sheep');
  const [farmSize, setFarmSize] = React.useState<'Small' | 'Medium' | 'Large'>('Medium');

  // Input states
  const [farmNameFocused, setFarmNameFocused] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);

  // Synced placeholder typing effect for Farm Name input
  const [syncPhraseIndex, setSyncPhraseIndex] = React.useState(0);
  const [syncCharIndex, setSyncCharIndex] = React.useState(0);
  const [syncPhase, setSyncPhase] = React.useState<'typing' | 'holding' | 'deleting'>('typing');
  const [cursorVisible, setCursorVisible] = React.useState(true);

  React.useEffect(() => {
    const cursorInterval = setInterval(() => {
      setCursorVisible(v => !v);
    }, 500);
    return () => clearInterval(cursorInterval);
  }, []);

  const farmNamePlaceholders = React.useMemo(() => {
    if (isRtl) {
      return ["مثلا: ضيعة البركة", "أدخل اسم ضيعتك هنا"];
    } else if (currentLanguage === 'fr') {
      return ["ex: Domaine Al Baraka", "Saisissez le nom de votre domaine"];
    } else {
      return ["e.g. Domaine Al Baraka", "Enter your farm name here"];
    }
  }, [isRtl, currentLanguage]);

  React.useEffect(() => {
    const activePhrase = farmNamePlaceholders[syncPhraseIndex % farmNamePlaceholders.length];
    let timeoutId: NodeJS.Timeout;

    if (syncPhase === 'typing') {
      if (syncCharIndex < activePhrase.length) {
        timeoutId = setTimeout(() => {
          setSyncCharIndex(prev => prev + 1);
        }, 60);
      } else {
        timeoutId = setTimeout(() => {
          setSyncPhase('holding');
        }, 100);
      }
    } else if (syncPhase === 'holding') {
      timeoutId = setTimeout(() => {
        setSyncPhase('deleting');
      }, 2500);
    } else if (syncPhase === 'deleting') {
      if (syncCharIndex > 0) {
        timeoutId = setTimeout(() => {
          setSyncCharIndex(prev => prev - 1);
        }, 30);
      } else {
        timeoutId = setTimeout(() => {
          setSyncPhraseIndex(prev => (prev + 1) % farmNamePlaceholders.length);
          setSyncPhase('typing');
        }, 400);
      }
    }

    return () => clearTimeout(timeoutId);
  }, [syncCharIndex, syncPhase, syncPhraseIndex, farmNamePlaceholders]);

  const displayedFarmPlaceholder = farmNamePlaceholders[syncPhraseIndex % farmNamePlaceholders.length].slice(0, syncCharIndex);

  // Dynamic cascades for Moroccan Agricultural regions
  const locationHierarchy = React.useMemo(() => ({
    'marrakech-safi': {
      label: isRtl ? 'مراكش - آسفي' : (currentLanguage === 'fr' ? 'Marrakech-Safi' : 'Marrakech-Safi'),
      provinces: {
        'marrakech': {
          label: isRtl ? 'مراكش' : 'Marrakech',
          communes: [
            { value: 'marrakech', label: isRtl ? 'مراكش المدنية' : 'Marrakech' },
            { value: 'tameslouht', label: isRtl ? 'تمصلوحت' : 'Tameslouht' },
            { value: 'oudaya', label: isRtl ? 'الأوداية' : 'Oudaya' },
            { value: 'saada', label: isRtl ? 'سعادة' : 'Saada' }
          ]
        },
        'al-haouz': {
          label: isRtl ? 'الحوز' : 'Al Haouz',
          communes: [
            { value: 'tahannaout', label: isRtl ? 'تحناوت' : 'Tahannaout' },
            { value: 'asni', label: isRtl ? 'أسني' : 'Asni' },
            { value: 'ourika', label: isRtl ? 'أوريكة' : 'Ourika' }
          ]
        },
        'chichaoua': {
          label: isRtl ? 'شيشاوة' : 'Chichaoua',
          communes: [
            { value: 'chichaoua-city', label: isRtl ? 'بلدية شيشاوة' : 'Chichaoua' },
            { value: 'imintanout', label: isRtl ? 'إمنتانوت' : 'Imintanout' }
          ]
        }
      }
    },
    'casablanca-settat': {
      label: isRtl ? 'الدار البيضاء - سطات' : (currentLanguage === 'fr' ? 'Casablanca-Settat' : 'Casablanca-Settat'),
      provinces: {
        'settat': {
          label: isRtl ? 'سطات' : 'Settat',
          communes: [
            { value: 'settat-city', label: isRtl ? 'بلدية سطات' : 'Settat' },
            { value: 'oulad-mrah', label: isRtl ? 'أولاد امراح' : "Oulad M'rah" },
            { value: 'guisser', label: isRtl ? 'كيسر' : 'Guisser' }
          ]
        },
        'berrechid': {
          label: isRtl ? 'برشيد' : 'Berrechid',
          communes: [
            { value: 'berrechid-city', label: isRtl ? 'برشيد المدينة' : 'Berrechid' },
            { value: 'sahel', label: isRtl ? 'الساحل' : 'Sahel' }
          ]
        }
      }
    },
    'rabat-sale-kenitra': {
      label: isRtl ? 'الرباط - سلا - القنيطرة' : (currentLanguage === 'fr' ? 'Rabat-Salé-Kénitra' : 'Rabat-Salé-Kénitra'),
      provinces: {
        'kenitra': {
          label: isRtl ? 'القنيطرة' : 'Kénitra',
          communes: [
            { value: 'kenitra-city', label: isRtl ? 'القنيطرة المدينة' : 'Kénitra' },
            { value: 'souk-el-arbaa', label: isRtl ? 'سوق الأربعاء الغرب' : 'Souk El Arbaa' }
          ]
        },
        'sidi-kacem': {
          label: isRtl ? 'سيدي قاسم' : 'Sidi Kacem',
          communes: [
            { value: 'sidi-kacem-city', label: isRtl ? 'سيدي قاسم' : 'Sidi Kacem' },
            { value: 'had-kourt', label: isRtl ? 'حد كورت' : 'Had Kourt' }
          ]
        }
      }
    }
  }), [isRtl, currentLanguage]);

  // Handle region changes
  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reg = e.target.value as keyof typeof locationHierarchy;
    setSelectedRegion(reg);
    const provincesOfRegion = locationHierarchy[reg].provinces;
    const firstProv = Object.keys(provincesOfRegion)[0];
    setSelectedProvince(firstProv);
    const firstComm = provincesOfRegion[firstProv as keyof typeof provincesOfRegion].communes[0].value;
    setSelectedCommune(firstComm);
  };

  // Handle province changes
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prov = e.target.value;
    setSelectedProvince(prov);
    const reg = selectedRegion as keyof typeof locationHierarchy;
    const communesOfProv = locationHierarchy[reg].provinces[prov as keyof typeof locationHierarchy[typeof reg]['provinces']].communes;
    setSelectedCommune(communesOfProv[0].value);
  };

  const currentProvinces = locationHierarchy[selectedRegion as keyof typeof locationHierarchy]?.provinces || {};
  const currentCommunes = (currentProvinces[selectedProvince as keyof typeof currentProvinces] as any)?.communes || [];

  // Localized Strings
  const localTexts = {
    title: isRtl ? "أكمل ملفك التعريفي الفلاحي" : (currentLanguage === 'fr' ? 'Complete Your Farm Profile' : 'Complete Your Farm Profile'),
    subtitle: isRtl 
      ? "أخبرنا المزيد عن مزرعتك ونوع نشاطك لتخصيص تجربتك بشكل كامل." 
      : "Tell us a bit more about your operation to personalize your experience.",
    completionLabel: isRtl ? "نسبة إكمال الحساب" : "Profile Completion",
    farmNameLabel: isRtl ? "اسم الضيعة / المزرعة" : "Farm Name",
    locationCardTitle: isRtl ? "موقع الضيعة الفلاحية" : "Farm Location",
    locationCardDesc: isRtl 
      ? "تساعد بيانات الموقع الدقيقة في ربطك بالمشترين المحليين، التعاونيات، والمصالح البيطرية في إقليمك." 
      : "Accurate location data helps connect you with local buyers and veterinary services.",
    regionLabel: isRtl ? "الجهة" : "Region",
    provinceLabel: isRtl ? "الإقليم" : "Province",
    communeLabel: isRtl ? "الجماعة" : "Commune",
    livestockLabel: isRtl ? "النوع الرئيسي للمواشي" : "Main Livestock Type",
    farmSizeLabel: isRtl ? "حجم الاستغلالية الفلاحية" : "Farm Size",
    sizeSmall: isRtl ? "صغيرة (أقل من 20 رأس)" : "Small",
    sizeMedium: isRtl ? "متوسطة (20 - 100 رأس)" : "Medium",
    sizeLarge: isRtl ? "كبيرة (أكثر من 100 رأس)" : "Large",
    saveBtn: isRtl ? "حفظ وتفعيل الحساب" : "Save Profile",
    signOut: isRtl ? "تسجيل الخروج" : "Sign Out",
    welcome: isRtl ? "مرحباً بك في فلاح لينك" : "Welcome to FellahLink",
    redirecting: isRtl ? "جاري تحضير لوحة التحكم الخاصة بك..." : "Redirecting to your smart farm dashboard...",
    validationError: isRtl ? "المرجو إدخال اسم الضيعة للمتابعة." : "Please enter your Farm Name to proceed."
  };

  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!farmName.trim()) {
      setErrorMsg(localTexts.validationError);
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      const regionLabelText = locationHierarchy[selectedRegion as keyof typeof locationHierarchy].label;
      const provinceLabelText = (currentProvinces[selectedProvince as keyof typeof currentProvinces] as any).label;
      const communeLabelText = currentCommunes.find((c: any) => c.value === selectedCommune)?.label || selectedCommune;

      const updatedProfile: UserProfile = {
        ...user,
        farmName: farmName.trim(),
        location: `${provinceLabelText}, ${regionLabelText}`,
        region: regionLabelText,
        province: provinceLabelText,
        commune: communeLabelText,
        livestockType,
        farmSize,
        onboardingComplete: true
      };

      setSubmitting(false);
      setCompleted(true);

      setTimeout(() => {
        onSaveProfile(updatedProfile);
      }, 1500);
    }, 1500);
  };

  // Calculate profile completion percentage based on inputs
  const completionPercentage = React.useMemo(() => {
    let score = 0;
    if (farmName.trim()) score += 20;
    if (selectedRegion) score += 10;
    if (selectedProvince) score += 10;
    if (selectedCommune) score += 10;
    if (livestockType) score += 30;
    if (farmSize) score += 20;
    return score;
  }, [farmName, selectedRegion, selectedProvince, selectedCommune, livestockType, farmSize]);

  return (
    <div className="w-full min-h-screen bg-background flex flex-col" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* Top Navigation */}
      <header className="w-full h-20 bg-surface border-b border-secondary-container flex items-center px-4 md:px-8 justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-fixed">
            <Tractor size={16} />
          </div>
          <span className="font-sans text-lg font-black text-primary tracking-tight">FellahLink</span>
        </div>
        <button
          onClick={onSignOut}
          className="text-xs font-bold text-secondary hover:text-primary transition-colors hover:underline px-3 py-1.5 rounded-lg hover:bg-secondary-container/30"
        >
          {localTexts.signOut}
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center py-10 px-4 md:px-8 w-full max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {completed ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl bg-surface-container-lowest rounded-xl border border-secondary-container p-12 text-center shadow-lg relative overflow-hidden flex flex-col items-center justify-center space-y-6"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary-fixed via-primary to-primary-container" />
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                <CheckCircle2 size={72} className="text-primary relative z-10 animate-bounce" />
              </div>
              <h2 className="text-2xl font-black text-primary">
                {localTexts.welcome}!
              </h2>
              <p className="text-sm text-on-surface-variant font-medium">
                {localTexts.redirecting}
              </p>
              <div className="w-32 bg-surface-variant h-1 rounded-full overflow-hidden mt-2">
                <div className="bg-primary h-full rounded-full animate-infinite-loading" style={{
                  animation: 'shimmer 1.5s infinite linear',
                  backgroundImage: 'linear-gradient(to right, #012d1d 0%, #c1ecd4 50%, #012d1d 100%)',
                  backgroundSize: '200% 100%'
                }} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="w-full max-w-2xl bg-surface-container-lowest rounded-xl border border-secondary-container p-6 md:p-8 shadow-sm relative overflow-hidden"
            >
              {/* Green indicator bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary" />

              {/* Title Section */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-widest text-primary bg-primary/15 px-2.5 py-1 rounded-full">
                    <Sparkles size={11} className="animate-spin duration-1000" />
                    {isRtl ? 'إكمال الحساب' : 'Profile Setup'}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-on-surface mb-2 tracking-tight">
                  {localTexts.title}
                </h2>
                <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
                  {localTexts.subtitle}
                </p>

                {/* Progress bar */}
                <div className="mt-6 bg-surface-container rounded-xl p-3.5 border border-secondary-container/40">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-on-surface">{localTexts.completionLabel}</span>
                    <span className="text-xs font-bold text-primary">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-surface-variant h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 p-3.5 bg-error-container/20 border border-error/20 text-error text-xs font-bold rounded-lg text-center">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Farm Name Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-on-surface" htmlFor="farm_name">
                    {localTexts.farmNameLabel}
                  </label>
                  <div className="relative">
                    <span className={`absolute inset-y-0 flex items-center pointer-events-none text-outline-variant z-10 ${isRtl ? 'right-3' : 'left-3'}`}>
                      <Tractor size={18} />
                    </span>
                    <input
                      className={`w-full h-12 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary text-sm text-on-surface placeholder:text-outline outline-none transition-colors relative z-0 ${
                        isRtl ? 'pr-10 pl-3 text-right' : 'pl-10 pr-3 text-left'
                      }`}
                      id="farm_name"
                      name="farm_name"
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      onFocus={() => setFarmNameFocused(true)}
                      onBlur={() => setFarmNameFocused(false)}
                    />
                    {/* Animated custom placeholder typing inside the field! */}
                    {!farmNameFocused && !farmName && (
                      <div className={`absolute inset-y-0 flex items-center pointer-events-none text-on-surface-variant/45 text-sm z-10 ${isRtl ? 'right-10' : 'left-10'}`}>
                        <span>{displayedFarmPlaceholder}</span>
                        {cursorVisible && <span className="text-primary font-semibold ml-0.5 font-mono">|</span>}
                      </div>
                    )}
                  </div>
                </div>

                {/* Farm Location Cascade Card */}
                <div className="bg-surface-container-low rounded-xl p-4 border border-secondary-container">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary mt-0.5">
                      <MapPin size={20} className="fill-primary/20" />
                    </div>
                    <div>
                      <h3 className="text-xs md:text-sm font-black text-on-surface">{localTexts.locationCardTitle}</h3>
                      <p className="text-[11px] md:text-xs text-on-surface-variant mt-1 leading-relaxed">
                        {localTexts.locationCardDesc}
                      </p>
                    </div>
                  </div>

                  {/* Dropdowns row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Region Select */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface" htmlFor="region">
                        {localTexts.regionLabel}
                      </label>
                      <select 
                        className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface outline-none"
                        id="region"
                        value={selectedRegion}
                        onChange={handleRegionChange}
                      >
                        {Object.entries(locationHierarchy).map(([key, value]: [string, any]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Province Select */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface" htmlFor="province">
                        {localTexts.provinceLabel}
                      </label>
                      <select 
                        className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface outline-none"
                        id="province"
                        value={selectedProvince}
                        onChange={handleProvinceChange}
                      >
                        {Object.entries(currentProvinces).map(([key, value]: [string, any]) => (
                          <option key={key} value={key}>{value.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Commune Select */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase tracking-wider text-on-surface" htmlFor="commune">
                        {localTexts.communeLabel}
                      </label>
                      <select 
                        className="w-full h-11 px-3 bg-surface-container-lowest border border-outline-variant rounded focus:border-primary focus:ring-1 focus:ring-primary text-xs text-on-surface outline-none"
                        id="commune"
                        value={selectedCommune}
                        onChange={(e) => setSelectedCommune(e.target.value)}
                      >
                        {currentCommunes.map((comm: any) => (
                          <option key={comm.value} value={comm.value}>{comm.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Main Livestock Type Select Cards */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-on-surface">
                    {localTexts.livestockLabel}
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    
                    {/* Sheep Option */}
                    <label className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="livestock_type" 
                        className="sr-only"
                        checked={livestockType === 'Sheep'}
                        onChange={() => setLivestockType('Sheep')}
                      />
                      <div className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all text-center ${
                        livestockType === 'Sheep'
                          ? 'border-primary bg-primary-fixed text-primary font-black shadow-sm scale-[1.03]'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="text-3xl mb-1.5 transition-transform group-hover:scale-115 duration-200" role="img" aria-label="sheep">🐑</span>
                        <span className="text-xs font-bold">{isRtl ? 'أغنام' : 'Sheep'}</span>
                      </div>
                    </label>

                    {/* Cow Option */}
                    <label className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="livestock_type" 
                        className="sr-only"
                        checked={livestockType === 'Cow'}
                        onChange={() => setLivestockType('Cow')}
                      />
                      <div className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all text-center ${
                        livestockType === 'Cow'
                          ? 'border-primary bg-primary-fixed text-primary font-black shadow-sm scale-[1.03]'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="text-3xl mb-1.5 transition-transform group-hover:scale-115 duration-200" role="img" aria-label="cow">🐄</span>
                        <span className="text-xs font-bold">{isRtl ? 'أبقار' : 'Cow'}</span>
                      </div>
                    </label>

                    {/* Goat Option */}
                    <label className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="livestock_type" 
                        className="sr-only"
                        checked={livestockType === 'Goat'}
                        onChange={() => setLivestockType('Goat')}
                      />
                      <div className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all text-center ${
                        livestockType === 'Goat'
                          ? 'border-primary bg-primary-fixed text-primary font-black shadow-sm scale-[1.03]'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="text-3xl mb-1.5 transition-transform group-hover:scale-115 duration-200" role="img" aria-label="goat">🐐</span>
                        <span className="text-xs font-bold">{isRtl ? 'ماعز' : 'Goat'}</span>
                      </div>
                    </label>

                    {/* Camel Option */}
                    <label className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="livestock_type" 
                        className="sr-only"
                        checked={livestockType === 'Camel'}
                        onChange={() => setLivestockType('Camel')}
                      />
                      <div className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all text-center ${
                        livestockType === 'Camel'
                          ? 'border-primary bg-primary-fixed text-primary font-black shadow-sm scale-[1.03]'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="text-3xl mb-1.5 transition-transform group-hover:scale-115 duration-200" role="img" aria-label="camel">🐪</span>
                        <span className="text-xs font-bold">{isRtl ? 'جمال' : 'Camel'}</span>
                      </div>
                    </label>

                    {/* Other Option */}
                    <label className="cursor-pointer group">
                      <input 
                        type="radio" 
                        name="livestock_type" 
                        className="sr-only"
                        checked={livestockType === 'Other'}
                        onChange={() => setLivestockType('Other')}
                      />
                      <div className={`flex flex-col items-center justify-center p-3.5 border rounded-lg transition-all text-center ${
                        livestockType === 'Other'
                          ? 'border-primary bg-primary-fixed text-primary font-black shadow-sm scale-[1.03]'
                          : 'border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface-variant'
                      }`}>
                        <span className="text-3xl mb-1.5 transition-transform group-hover:scale-115 duration-200" role="img" aria-label="other">🌾</span>
                        <span className="text-xs font-bold">{isRtl ? 'آخر' : 'Other'}</span>
                      </div>
                    </label>

                  </div>
                </div>

                {/* Farm Size Select Option */}
                <div className="space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-on-surface">
                    {localTexts.farmSizeLabel}
                  </label>
                  <div className="flex flex-wrap gap-6 p-4 rounded-xl border border-secondary-container/40 bg-surface-container-lowest">
                    
                    {/* Small Radio */}
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="farm_size" 
                        className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
                        checked={farmSize === 'Small'}
                        onChange={() => setFarmSize('Small')}
                      />
                      <span className="text-xs md:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {localTexts.sizeSmall}
                      </span>
                    </label>

                    {/* Medium Radio */}
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="farm_size" 
                        className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
                        checked={farmSize === 'Medium'}
                        onChange={() => setFarmSize('Medium')}
                      />
                      <span className="text-xs md:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {localTexts.sizeMedium}
                      </span>
                    </label>

                    {/* Large Radio */}
                    <label className="flex items-center gap-2.5 cursor-pointer group">
                      <input 
                        type="radio" 
                        name="farm_size" 
                        className="w-5 h-5 text-primary focus:ring-primary border-outline-variant"
                        checked={farmSize === 'Large'}
                        onChange={() => setFarmSize('Large')}
                      />
                      <span className="text-xs md:text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {localTexts.sizeLarge}
                      </span>
                    </label>

                  </div>
                </div>

                {/* Bottom Buttons Section */}
                <div className="pt-6 mt-6 border-t border-secondary-container flex items-center justify-end">
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full md:w-auto md:min-w-[160px] h-12 bg-primary text-on-primary font-bold uppercase tracking-wider text-xs rounded-lg flex items-center justify-center px-6 hover:opacity-95 active:scale-95 transition-all shadow-md shadow-primary/10 ml-auto"
                  >
                    {submitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>{isRtl ? 'جاري الحفظ...' : 'Saving...'}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{localTexts.saveBtn}</span>
                        {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                      </div>
                    )}
                  </button>
                </div>

              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Embedded Shimmer Animation style rule */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}
