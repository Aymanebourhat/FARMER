import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { User, Home, Phone, MapPin, Globe, CheckCircle2, Award, Info, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  currentLanguage: Language;
  user: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

export default function ProfileView({
  currentLanguage,
  user,
  onUpdateProfile,
  onSignOut,
}: ProfileViewProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [fullName, setFullName] = React.useState(user.fullName);
  const [farmName, setFarmName] = React.useState(user.farmName);
  const [phone, setPhone] = React.useState(user.phone);
  const [location, setLocation] = React.useState(user.location);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile({
      ...user,
      fullName,
      farmName,
      phone,
      location,
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  const moroccanCities = [
    'Settat', 'El Kelaa des Sraghna', 'Oujda', 'Marrakech', 'Chefchaouen', 
    'Fès', 'Meknès', 'Khenifra', 'Guelmim', 'Taroudant', 'Berkane', 'Safi'
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-4 space-y-8"
    >
      <div className={`text-right lg:text-left ${isRtl ? 'text-right' : 'text-left'}`}>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.myFarmProfile}</h2>
        <p className="text-sm text-on-surface-variant/80 mt-1">{t.badgeBuiltForMoroccan}</p>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${
        isRtl ? 'md:flex-row-reverse' : ''
      }`}>
        {/* Profile Card Summary */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-2xl font-bold mx-auto border border-primary/10">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-primary">{farmName}</h3>
            <p className="text-xs text-on-surface-variant/80 font-semibold">{fullName}</p>
          </div>

          <div className="pt-4 border-t border-secondary-container/30 space-y-3 text-xs text-secondary/95">
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Phone size={14} className="text-primary shrink-0" />
              <span className="font-semibold">{phone}</span>
            </div>
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <MapPin size={14} className="text-primary shrink-0" />
              <span className="font-semibold">{location}, Morocco</span>
            </div>
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <CheckCircle2 size={14} className="text-primary shrink-0" />
              <span className="font-extrabold text-primary-container bg-primary-fixed px-1.5 py-0.5 rounded text-[10px]">
                {isRtl ? 'عضو موثق' : 'Éleveur Vérifié'}
              </span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="w-full py-2.5 bg-error-container/30 hover:bg-error-container/50 text-error font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t.signOut}</span>
          </button>
        </div>

        {/* Edit profile form */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm md:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="p-3 bg-primary-fixed/30 border border-primary/10 text-primary text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2">
                <CheckCircle2 size={16} />
                <span>{t.addRecordSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.animalName}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={`w-full py-2.5 px-3 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              {/* Farm Name */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.farmName}
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className={`w-full py-2.5 px-3 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.phone}
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={`w-full py-2.5 px-3 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right' : 'text-left'
                  }`}
                />
              </div>

              {/* Location selection */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.location}
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className={`w-full py-2.5 px-3 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right pr-4' : 'text-left pl-4'
                  }`}
                >
                  {moroccanCities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-primary text-on-primary hover:bg-primary-container font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {t.save}
            </button>
          </form>

          {/* Info Banner block */}
          <div className={`mt-8 p-4 bg-primary/5 rounded-xl border border-primary/10 flex gap-3 ${
            isRtl ? 'flex-row-reverse text-right' : 'text-left'
          }`}>
            <Info className="text-primary shrink-0 mt-0.5" size={18} />
            <div className="space-y-1.5">
              <h4 className="text-xs font-extrabold text-primary">
                {currentLanguage === 'darija'
                  ? 'تطوير الكسيبة والمزارع فبلادنا المغرب'
                  : isRtl
                  ? 'تطوير سلاسل تربية المواشي بالمغرب'
                  : 'Développement des filières d\'élevage au Maroc'}
              </h4>
              <p className="text-[11px] text-on-surface-variant/90 leading-relaxed">
                {currentLanguage === 'darija'
                  ? 'منصة فلاح لينك كتعاون فـ رقمنة لمزارع والربط المباشر بين الكسابا والشرايا، باش تحسن جودة الكسيبة وتزيد فـ الأرباح.'
                  : isRtl
                  ? 'تدعم منصة FellahLink الإستراتيجية الوطنية "الجيل الأخضر" لرقمنة المزارع والربط المباشر بين المربين والمستهلكين، مما يساهم في تحسين جودة القطيع وزيادة الشفافية والربحية.'
                  : 'La plateforme FellahLink s\'inscrit dans la stratégie "Génération Green" pour la numérisation des exploitations et la mise en relation directe éleveur-acheteur.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
