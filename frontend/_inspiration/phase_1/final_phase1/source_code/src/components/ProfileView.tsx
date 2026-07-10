import React from 'react';
import { Language, UserProfile } from '../types';
import { translations } from '../translations';
import { User, Phone, MapPin, Globe, CheckCircle2, Info, LogOut, Edit3, Settings, ShieldCheck, Tractor } from 'lucide-react';
import { motion } from 'motion/react';

interface ProfileViewProps {
  currentLanguage: Language;
  user: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onSignOut: () => void;
}

// Cascading dataset for Moroccan agricultural geography
const regionsAndProvinces = {
  'Béni Mellal-Khénifra': {
    labelAr: 'بني ملال - خنيفرة',
    labelFr: 'Béni Mellal-Khénifra',
    provinces: [
      { value: 'Béni Mellal', labelAr: 'بني ملال', labelFr: 'Béni Mellal' },
      { value: 'Azilal', labelAr: 'أزيلال', labelFr: 'Azilal' },
      { value: 'Fquih Ben Salah', labelAr: 'الفقيه بن صالح', labelFr: 'Fquih Ben Salah' },
      { value: 'Khénifra', labelAr: 'خنيفرة', labelFr: 'Khénifra' },
      { value: 'Khouribga', labelAr: 'خريبكة', labelFr: 'Khouribga' }
    ]
  },
  'Casablanca-Settat': {
    labelAr: 'الدار البيضاء - سطات',
    labelFr: 'Casablanca-Settat',
    provinces: [
      { value: 'Settat', labelAr: 'سطات', labelFr: 'Settat' },
      { value: 'Berrechid', labelAr: 'برشيد', labelFr: 'Berrechid' },
      { value: 'Sidi Bennour', labelAr: 'سيدي بنور', labelFr: 'Sidi Bennour' },
      { value: 'El Jadida', labelAr: 'الجديدة', labelFr: 'El Jadida' },
      { value: 'Benslimane', labelAr: 'بنسليمان', labelFr: 'Benslimane' }
    ]
  },
  'Marrakech-Safi': {
    labelAr: 'مراكش - أسفي',
    labelFr: 'Marrakech-Safi',
    provinces: [
      { value: 'Marrakech', labelAr: 'مراكش', labelFr: 'Marrakech' },
      { value: 'Al Haouz', labelAr: 'الحوز', labelFr: 'Al Haouz' },
      { value: 'Chichaoua', labelAr: 'شيشاوة', labelFr: 'Chichaoua' },
      { value: 'El Kelaa des Sraghna', labelAr: 'قلعة السراغنة', labelFr: 'El Kelaa des Sraghna' },
      { value: 'Essaouira', labelAr: 'الصويرة', labelFr: 'Essaouira' },
      { value: 'Safi', labelAr: 'أسفي', labelFr: 'Safi' }
    ]
  },
  'Rabat-Salé-Kénitra': {
    labelAr: 'الرباط - سلا - القنيطرة',
    labelFr: 'Rabat-Salé-Kénitra',
    provinces: [
      { value: 'Kénitra', labelAr: 'القنيطرة', labelFr: 'Kénitra' },
      { value: 'Sidi Kacem', labelAr: 'سيدي قاسم', labelFr: 'Sidi Kacem' },
      { value: 'Sidi Slimane', labelAr: 'سيدي سليمان', labelFr: 'Sidi Slimane' },
      { value: 'Khémisset', labelAr: 'الخميسات', labelFr: 'Khémisset' }
    ]
  }
};

const formTranslations = {
  ar: {
    editProfile: 'تعديل الملف الشخصي',
    updateSubtitle: 'تحديث تفاصيل المزرعة وإعدادات الحساب المرجعية.',
    farmDetails: 'تفاصيل المزرعة',
    farmName: 'اسم المزرعة',
    region: 'الجهة',
    province: 'الإقليم / العمالة',
    commune: 'الجماعة',
    mainLivestock: 'النشاط الرئيسي (نوع المواشي)',
    farmSizeHectares: 'حجم المزرعة (بالهكتار)',
    accountSettings: 'إعدادات الحساب',
    fullName: 'الاسم الكامل',
    phoneNumber: 'رقم الهاتف',
    preferredLanguage: 'اللغة المفضلة',
    cancel: 'إلغاء',
    saveChanges: 'حفظ التغييرات',
    successMsg: 'تم تحديث ملفك الشخصي بنجاح!',
    backToProfile: 'الرجوع للملف الشخصي',
    viewProfile: 'عرض الملف الشخصي',
    verifiedFarmer: 'كساب موثق',
    morocco: 'المغرب',
    hectares: 'هكتار',
    noInfo: 'غير محدد',
    editBtn: 'تعديل معلومات الحساب والمزرعة',
  },
  darija: {
    editProfile: 'تعديل البروفيل ديالي',
    updateSubtitle: 'بدل معلومات الفيرمة والحساب ديالك بالزربة وبكل سهولة.',
    farmDetails: 'معلومات الفيرمة',
    farmName: 'سمية الفيرمة',
    region: 'الجهة الفلاحية',
    province: 'الإقليم / العمالة',
    commune: 'الجماعة / البلاد',
    mainLivestock: 'نوع الكسيبة الرئيسي',
    farmSizeHectares: 'حجم الفيرمة (بالهكتار)',
    accountSettings: 'إعدادات الحساب ديالي',
    fullName: 'السمية الكاملة',
    phoneNumber: 'النمرة د التلفون',
    preferredLanguage: 'اللغة اللي كتفضل',
    cancel: 'إلغاء',
    saveChanges: 'قيد التغييرات',
    successMsg: 'تبدلو المعلومات ديالك بنجاح!',
    backToProfile: 'رجع للبروفيل',
    viewProfile: 'البروفيل ديالي',
    verifiedFarmer: 'كساب موثق ناضي',
    morocco: 'المغرب',
    hectares: 'هكتار',
    noInfo: 'ما كاينش',
    editBtn: 'بدل معلومات الفيرمة والحساب',
  },
  fr: {
    editProfile: 'Modifier le Profil',
    updateSubtitle: 'Mettez à jour les détails de votre exploitation et vos paramètres de compte.',
    farmDetails: 'Détails de l\'Exploitation',
    farmName: 'Nom de l\'Exploitation',
    region: 'Région',
    province: 'Province',
    commune: 'Commune',
    mainLivestock: 'Type de Bétail Principal',
    farmSizeHectares: 'Taille de l\'Exploitation (Hectares)',
    accountSettings: 'Paramètres du Compte',
    fullName: 'Nom Complet',
    phoneNumber: 'Numéro de Téléphone',
    preferredLanguage: 'Langue Préférée',
    cancel: 'Annuler',
    saveChanges: 'Enregistrer les modifications',
    successMsg: 'Profil mis à jour avec succès !',
    backToProfile: 'Retour au profil',
    viewProfile: 'Profil de mon exploitation',
    verifiedFarmer: 'Éleveur Vérifié',
    morocco: 'Maroc',
    hectares: 'Hectares',
    noInfo: 'Non spécifié',
    editBtn: 'Modifier les détails de la ferme et du compte',
  },
  en: {
    editProfile: 'Edit Profile',
    updateSubtitle: 'Update your farm details and account settings.',
    farmDetails: 'Farm Details',
    farmName: 'Farm Name',
    region: 'Region',
    province: 'Province',
    commune: 'Commune',
    mainLivestock: 'Main Livestock Type',
    farmSizeHectares: 'Farm Size (Hectares)',
    accountSettings: 'Account Settings',
    fullName: 'Full Name',
    phoneNumber: 'Phone Number',
    preferredLanguage: 'Preferred Language',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    successMsg: 'Profile updated successfully!',
    backToProfile: 'Back to Profile',
    viewProfile: 'My Farm Profile',
    verifiedFarmer: 'Verified Breeder',
    morocco: 'Morocco',
    hectares: 'Hectares',
    noInfo: 'Not specified',
    editBtn: 'Edit Farm & Account Settings',
  }
};

const livestockOptions = [
  { value: 'Sheep', labelAr: 'أغنام الصردي', labelFr: 'Sheep (Sardi)', emoji: '🐑' },
  { value: 'Cow', labelAr: 'أبقار', labelFr: 'Cattle', emoji: '🐄' },
  { value: 'Goat', labelAr: 'ماعز', labelFr: 'Goats', emoji: '🐐' },
  { value: 'Camel', labelAr: 'جمال', labelFr: 'Camels', emoji: '🐪' },
  { value: 'Other', labelAr: 'آخر / زراعة', labelFr: 'Other / Agriculture', emoji: '🌾' },
];

export default function ProfileView({
  currentLanguage,
  user,
  onUpdateProfile,
  onSignOut,
}: ProfileViewProps) {
  const t = translations[currentLanguage];
  const ft = formTranslations[currentLanguage] || formTranslations['fr'];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [isEditing, setIsEditing] = React.useState(false);

  // Edit form states initialized with user current profile
  const [fullName, setFullName] = React.useState(user.fullName);
  const [farmName, setFarmName] = React.useState(user.farmName);
  const [phone, setPhone] = React.useState(user.phone);
  
  // Find initial region key based on user.region string
  const initialRegionKey = React.useMemo(() => {
    if (!user.region) return 'Béni Mellal-Khénifra';
    const found = Object.entries(regionsAndProvinces).find(([key, val]) => 
      key === user.region || val.labelFr === user.region || val.labelAr === user.region
    );
    return found ? found[0] : 'Béni Mellal-Khénifra';
  }, [user.region]);

  const [selectedRegion, setSelectedRegion] = React.useState<string>(initialRegionKey);

  // Filter provinces list based on current chosen region
  const provincesOfRegion = regionsAndProvinces[selectedRegion as keyof typeof regionsAndProvinces]?.provinces || [];

  // Find initial province based on user.province
  const initialProvinceVal = React.useMemo(() => {
    if (!user.province) return provincesOfRegion[0]?.value || '';
    const found = provincesOfRegion.find(p => p.value === user.province || p.labelFr === user.province || p.labelAr === user.province);
    return found ? found.value : (provincesOfRegion[0]?.value || '');
  }, [user.province, provincesOfRegion]);

  const [selectedProvince, setSelectedProvince] = React.useState<string>(initialProvinceVal);
  const [commune, setCommune] = React.useState(user.commune || '');
  const [livestockType, setLivestockType] = React.useState<string>(user.livestockType || 'Sheep');
  
  // Farm size state (extracting numbers if any)
  const [farmSize, setFarmSize] = React.useState<string>(() => {
    if (!user.farmSize) return '15';
    const match = user.farmSize.match(/\d+/);
    return match ? match[0] : '15';
  });

  const [preferredLang, setPreferredLang] = React.useState<string>(user.language || currentLanguage);
  const [success, setSuccess] = React.useState(false);

  // Sync province option list when region changes
  React.useEffect(() => {
    const list = regionsAndProvinces[selectedRegion as keyof typeof regionsAndProvinces]?.provinces || [];
    if (list.length > 0) {
      // Avoid resetting if it already matches user profile initially
      const hasMatch = list.some(p => p.value === selectedProvince || p.labelFr === user.province || p.labelAr === user.province);
      if (!hasMatch) {
        setSelectedProvince(list[0].value);
      }
    }
  }, [selectedRegion]);

  const handleRegionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const reg = e.target.value;
    setSelectedRegion(reg);
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Map labels to correct values
    const regionObj = regionsAndProvinces[selectedRegion as keyof typeof regionsAndProvinces];
    const provinceObj = regionObj?.provinces.find(p => p.value === selectedProvince);

    // Save actual text labels for the profile
    const finalRegionText = regionObj ? regionObj.labelFr : selectedRegion;
    const finalProvinceText = provinceObj ? provinceObj.labelFr : selectedProvince;
    const finalCommuneText = commune.trim() || ft.noInfo;

    onUpdateProfile({
      ...user,
      fullName: fullName.trim(),
      farmName: farmName.trim(),
      phone: phone.trim(),
      location: `${finalProvinceText}, ${finalRegionText}`,
      region: finalRegionText,
      province: finalProvinceText,
      commune: finalCommuneText,
      livestockType: livestockType as any,
      farmSize: `${farmSize} ${isRtl ? 'هكتار' : 'Hectares'}`,
      language: preferredLang as any,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setIsEditing(false); // return to dashboard view after successful save
    }, 1500);
  };

  const currentLivestockEmoji = React.useMemo(() => {
    const matched = livestockOptions.find(o => o.value === user.livestockType);
    return matched ? matched.emoji : '🐑';
  }, [user.livestockType]);

  const getLivestockLabel = (typeString: string) => {
    const matched = livestockOptions.find(o => o.value === typeString);
    if (!matched) return typeString;
    return isRtl ? matched.labelAr : matched.labelFr;
  };

  if (isEditing) {
    // Beautiful full page Edit Profile view that matches the requested design and reference HTML
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto py-4 space-y-6"
      >
        <div className={`mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">{ft.editProfile}</h1>
          <p className="text-sm text-on-surface-variant/90 mt-1">{ft.updateSubtitle}</p>
        </div>

        {success && (
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-4 bg-primary-fixed/40 border border-primary/20 text-primary text-xs font-bold rounded-xl text-center flex items-center justify-center gap-2 shadow-sm"
          >
            <CheckCircle2 size={16} className="animate-bounce" />
            <span>{ft.successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Farm Details Section */}
          <section className="bg-white border border-secondary-container rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-secondary-fixed py-4.5 px-6 border-b border-secondary-container/60">
              <h2 className={`text-sm font-black uppercase tracking-wider text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                {ft.farmDetails}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Farm Name */}
              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="farm-name">
                  {ft.farmName}
                </label>
                <input
                  id="farm-name"
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                  placeholder="e.g. Domaine Atlas"
                />
              </div>

              {/* Region, Province, Commune Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="region">
                    {ft.region}
                  </label>
                  <select
                    id="region"
                    value={selectedRegion}
                    onChange={handleRegionChange}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right pr-4' : 'text-left pl-4'}`}
                  >
                    {Object.entries(regionsAndProvinces).map(([key, value]) => (
                      <option key={key} value={key}>
                        {isRtl ? value.labelAr : value.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="province">
                    {ft.province}
                  </label>
                  <select
                    id="province"
                    value={selectedProvince}
                    onChange={handleProvinceChange}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right pr-4' : 'text-left pl-4'}`}
                  >
                    {provincesOfRegion.map((p) => (
                      <option key={p.value} value={p.value}>
                        {isRtl ? p.labelAr : p.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="commune">
                    {ft.commune}
                  </label>
                  <input
                    id="commune"
                    type="text"
                    required
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    placeholder="e.g. Oulad Yaich"
                  />
                </div>
              </div>

              {/* Main Livestock and Farm Size Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="livestock-type">
                    {ft.mainLivestock}
                  </label>
                  <select
                    id="livestock-type"
                    value={livestockType}
                    onChange={(e) => setLivestockType(e.target.value)}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right pr-4' : 'text-left pl-4'}`}
                  >
                    {livestockOptions.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.emoji} {isRtl ? o.labelAr : o.labelFr}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="farm-size">
                    {ft.farmSizeHectares}
                  </label>
                  <input
                    id="farm-size"
                    type="number"
                    min="0"
                    required
                    value={farmSize}
                    onChange={(e) => setFarmSize(e.target.value)}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Account Settings Section */}
          <section className="bg-white border border-secondary-container rounded-2xl overflow-hidden shadow-sm">
            <div className="bg-secondary-fixed py-4.5 px-6 border-b border-secondary-container/60">
              <h2 className={`text-sm font-black uppercase tracking-wider text-primary ${isRtl ? 'text-right' : 'text-left'}`}>
                {ft.accountSettings}
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="full-name">
                    {ft.fullName}
                  </label>
                  <input
                    id="full-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    placeholder="e.g. Youssef Benali"
                  />
                </div>

                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 ${isRtl ? 'text-right' : 'text-left'}`} htmlFor="phone-number">
                    {ft.phoneNumber}
                  </label>
                  <input
                    id="phone-number"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full border border-outline-variant/60 bg-surface-container-lowest text-on-surface rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all ${isRtl ? 'text-right' : 'text-left'}`}
                    placeholder="06 XX XX XX XX"
                  />
                </div>
              </div>

              <div>
                <label className={`block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {ft.preferredLanguage}
                </label>
                <div className={`flex gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="preferred-lang"
                      value="ar"
                      checked={preferredLang === 'ar'}
                      onChange={() => setPreferredLang('ar')}
                      className="w-4 h-4 text-primary focus:ring-primary border-outline-variant/60 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-all">العربية</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="preferred-lang"
                      value="fr"
                      checked={preferredLang === 'fr'}
                      onChange={() => setPreferredLang('fr')}
                      className="w-4 h-4 text-primary focus:ring-primary border-outline-variant/60 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-all">Français</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="radio"
                      name="preferred-lang"
                      value="darija"
                      checked={preferredLang === 'darija'}
                      onChange={() => setPreferredLang('darija')}
                      className="w-4 h-4 text-primary focus:ring-primary border-outline-variant/60 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-on-surface group-hover:text-primary transition-all">الدارجة</span>
                  </label>
                </div>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className={`flex justify-end gap-3 pt-4 border-t border-secondary-container/60 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-6 py-2.5 text-xs font-bold border border-outline/50 hover:bg-surface-container rounded-xl text-on-surface-variant transition-all cursor-pointer"
            >
              {ft.cancel}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold bg-primary text-on-primary hover:bg-primary-container rounded-xl shadow-md transition-all cursor-pointer"
            >
              {ft.saveChanges}
            </button>
          </div>
        </form>
      </motion.div>
    );
  }

  // Elegant profile details dashboard when not editing
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto py-4 space-y-8"
    >
      <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">{ft.viewProfile}</h2>
          <p className="text-sm text-on-surface-variant/80 mt-1">{t.badgeBuiltForMoroccan}</p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer self-start sm:self-center"
        >
          <Edit3 size={15} />
          <span>{ft.editBtn}</span>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 items-start ${
        isRtl ? 'md:flex-row-reverse' : ''
      }`}>
        {/* Profile Card Summary */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm space-y-6 text-center">
          <div className="w-20 h-20 rounded-full bg-primary-fixed text-primary flex items-center justify-center text-2xl font-bold mx-auto border border-primary/10 shadow-inner">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-extrabold text-primary">{user.farmName}</h3>
            <p className="text-xs text-on-surface-variant/80 font-semibold">{user.fullName}</p>
          </div>

          <div className="pt-4 border-t border-secondary-container/30 space-y-3 text-xs text-secondary/95">
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Phone size={14} className="text-primary shrink-0" />
              <span className="font-semibold">{user.phone}</span>
            </div>
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <MapPin size={14} className="text-primary shrink-0" />
              <span className="font-semibold">{user.location}, {ft.morocco}</span>
            </div>
            <div className={`flex items-center gap-2 justify-center ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span className="font-extrabold text-primary-container bg-primary-fixed px-1.5 py-0.5 rounded text-[10px]">
                {ft.verifiedFarmer}
              </span>
            </div>
          </div>

          <button
            onClick={onSignOut}
            className="w-full py-2.5 bg-error-container/20 hover:bg-error-container/40 text-error font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>{t.signOut}</span>
          </button>
        </div>

        {/* Display profile details & Moroccan Agricultural context */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm md:col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className={`text-sm font-black uppercase text-primary/75 tracking-wider pb-2 border-b border-secondary-container/30 ${isRtl ? 'text-right' : 'text-left'}`}>
              {isRtl ? 'بطاقة استغلالية المزرعة' : 'Farm Exploitation Record'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-on-surface">
              {/* Farm Name details */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.farmName}</span>
                <span className="text-sm font-extrabold text-primary">{user.farmName}</span>
              </div>

              {/* Main Livestock details with animal emoji */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.mainLivestock}</span>
                <span className="text-sm font-extrabold text-primary flex items-center gap-1.5 justify-start">
                  <span className="text-lg">{currentLivestockEmoji}</span>
                  <span>{getLivestockLabel(user.livestockType || 'Sheep')}</span>
                </span>
              </div>

              {/* Region and commune info */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.region} & {ft.province}</span>
                <span className="text-sm font-extrabold text-primary">
                  {user.province || ft.noInfo} ({user.region || ft.noInfo})
                </span>
              </div>

              {/* Commune info */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.commune}</span>
                <span className="text-sm font-extrabold text-primary">{user.commune || ft.noInfo}</span>
              </div>

              {/* Farm Size */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.farmSizeHectares}</span>
                <span className="text-sm font-extrabold text-primary">
                  {user.farmSize || ft.noInfo}
                </span>
              </div>

              {/* Account owner preferred Language */}
              <div className={`p-3.5 bg-surface-container-low rounded-xl flex flex-col gap-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                <span className="font-medium text-secondary">{ft.preferredLanguage}</span>
                <span className="text-sm font-extrabold text-primary capitalize">
                  {user.language === 'ar' ? 'العربية' : user.language === 'darija' ? 'الدارجة المغربية' : user.language === 'fr' ? 'Français' : 'English'}
                </span>
              </div>
            </div>
          </div>

          {/* Info Banner block */}
          <div className={`p-4.5 bg-primary/5 rounded-2xl border border-primary/10 flex gap-3.5 ${
            isRtl ? 'flex-row-reverse text-right' : 'text-left'
          }`}>
            <Info className="text-primary shrink-0 mt-0.5 animate-pulse" size={18} />
            <div className="space-y-1.5">
              <h4 className="text-xs font-black text-primary uppercase tracking-wide">
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
