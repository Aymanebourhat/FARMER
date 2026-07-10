import React from 'react';
import { Language, Animal, WeightRecord, VaccineRecord, Listing } from '../types';
import { translations } from '../translations';
import { 
  Plus, 
  TrendingUp, 
  ShieldAlert, 
  Award, 
  Calendar, 
  Activity, 
  CheckSquare, 
  PawPrint, 
  Store, 
  Truck, 
  HeartPulse, 
  Verified, 
  Inbox, 
  History,
  Info
} from 'lucide-react';
import { motion } from 'motion/react';

interface DashboardViewProps {
  currentLanguage: Language;
  animals: Animal[];
  weightRecords: WeightRecord[];
  vaccineRecords: VaccineRecord[];
  listings: Listing[];
  onAddAnimalClick: () => void;
  onAddWeightClick: () => void;
  onAddVaccineClick: () => void;
}

const dashboardTranslations = {
  ar: {
    welcomeBack: 'مرحباً بك مجدداً',
    summaryStatus: 'إليك ملخص لحالة مزرعتك ونشاطك الفلاحي اليوم.',
    profileCompletion: 'إكمال الملف الشخصي',
    totalAnimals: 'إجمالي المواشي',
    activeListings: 'الإعلانات النشطة',
    readyForSale: 'جاهز للبيع',
    healthReminders: 'تنبيهات صحية',
    myLivestock: 'مواشي المزرعة',
    noAnimalsAdded: 'لم تقم بإضافة أي حيوان بعد.',
    noAnimalsAddedSub: 'أضف حيوانك الأول للبدء في تدوين سجلات المزرعة، تتبع الأوزان، والحالة الصحية والبيع.',
    addAnimal: 'إضافة حيوان',
    futureMarketplace: 'السوق الفلاحي القادم',
    comingLater: 'قريباً',
    connectWithBuyers: 'تواصل مباشرة مع المشترين',
    connectWithBuyersSub: 'قريباً ستتمكن من عرض مواشيك مباشرة لشبكة وطنية من المشترين والكسابة الموثوقين.',
    recentActivity: 'آخر الأنشطة والعمليات',
    noRecentActivity: 'لا توجد أي أنشطة حديثة لعرضها.',
    addWeight: 'تسجيل وزن',
    addVaccine: 'تسجيل تلقيح',
    healthStatus: 'الحالة الصحية',
    excellent: 'ممتازة',
    underTreatment: 'تحت العلاج',
    totalHerd: 'القطيع الكلي',
    animalHead: 'رأس',
    recentWeightRecorded: 'تم تسجيل وزن جديد ({weight} كجم) لـ {name}',
    recentVaccineRecorded: 'تلقيح جديد لـ {name} ضد {vaccine}',
    recentAnimalCreated: 'تمت إضافة حيوان جديد: {name} ({breed})',
    moroccanSardi: 'الصردي المغربي الأصيل',
    details: 'تفاصيل',
    actions: 'إجراءات فلاحية سريع',
  },
  darija: {
    welcomeBack: 'مرحباً بك من جديد',
    summaryStatus: 'هاهو ملخص خفيف على الفيرمة والنشاط ديالك اليوم.',
    profileCompletion: 'تعمار البروفيل',
    totalAnimals: 'مجموع الكسيبة',
    activeListings: 'العروض اللي كاينة',
    readyForSale: 'واجد للبيع',
    healthReminders: 'تنبيهات الصحة',
    myLivestock: 'الكسيبة ديالي',
    noAnimalsAdded: 'مازال ما زدتي حتى شي بهيمة فالفيرمة.',
    noAnimalsAddedSub: 'زيد أول حيوان باش تبدا تقيد الميزان، الدوا، والتلقيحات وتبيع الكسيبة ديالك بكل سهولة.',
    addAnimal: 'زيد بهيمة',
    futureMarketplace: 'السوق الفلاحي الجاي',
    comingLater: 'قريباً إن شاء الله',
    connectWithBuyers: 'تواصل ديريكت مع الشرايا',
    connectWithBuyersSub: 'قريباً غادي تقدر تحط الكسيبة ديالك للبيع مباشرة لجميع الشرايا والكسابة فالمغرب كامل.',
    recentActivity: 'آخر التحركات',
    noRecentActivity: 'ما كاين حتى شي نشاط جديد دابا.',
    addWeight: 'قيد العبار',
    addVaccine: 'قيد جلبة',
    healthStatus: 'الحالة الصحية',
    excellent: 'ناضية',
    underTreatment: 'كيتبوقس / كيداوى',
    totalHerd: 'القطيع كامل',
    animalHead: 'راس',
    recentWeightRecorded: 'تقيد العبار د {name} ({weight} كجم)',
    recentVaccineRecorded: 'تلقيحة جديدة لـ {name} ({vaccine})',
    recentAnimalCreated: 'تزاد حيوان جديد {name} ({breed})',
    moroccanSardi: 'الصردي المغربي المخير',
    details: 'معلومات الكسيبة',
    actions: 'تحركات سريعة للفيرمة',
  },
  fr: {
    welcomeBack: 'Bon retour',
    summaryStatus: 'Voici un résumé de l\'état de votre exploitation aujourd\'hui.',
    profileCompletion: 'Profil complété',
    totalAnimals: 'Total Animaux',
    activeListings: 'Annonces actives',
    readyForSale: 'Prêts pour la vente',
    healthReminders: 'Rappels de santé',
    myLivestock: 'Mon Cheptel',
    noAnimalsAdded: 'Vous n\'avez pas encore ajouté d\'animaux.',
    noAnimalsAddedSub: 'Ajoutez votre premier animal pour commencer à bâtir vos registres de ferme, suivre la santé et gérer vos ventes.',
    addAnimal: 'Ajouter un animal',
    futureMarketplace: 'Futur Marché',
    comingLater: 'Bientôt disponible',
    connectWithBuyers: 'Connectez avec des acheteurs',
    connectWithBuyersSub: 'Bientôt vous pourrez lister votre bétail directement à un réseau national d\'acheteurs vérifiés.',
    recentActivity: 'Activité récente',
    noRecentActivity: 'Aucune activité récente à afficher.',
    addWeight: 'Ajouter Poids',
    addVaccine: 'Ajouter Vaccin',
    healthStatus: 'Statut de santé',
    excellent: 'Excellent',
    underTreatment: 'Sous traitement',
    totalHerd: 'Cheptel total',
    animalHead: 'têtes',
    recentWeightRecorded: 'Poids enregistré pour {name} ({weight} kg)',
    recentVaccineRecorded: 'Vaccin ({vaccine}) enregistré pour {name}',
    recentAnimalCreated: 'Nouvel animal ajouté : {name} ({breed})',
    moroccanSardi: 'Sardi Marocain Authentique',
    details: 'Détails',
    actions: 'Actions Rapides',
  },
  en: {
    welcomeBack: 'Welcome Back',
    summaryStatus: 'Here is a summary of your farm\'s status today.',
    profileCompletion: 'Profile Completion',
    totalAnimals: 'Total Animals',
    activeListings: 'Active Listings',
    readyForSale: 'Ready for Sale',
    healthReminders: 'Health Reminders',
    myLivestock: 'My Livestock',
    noAnimalsAdded: 'You have not added any animals yet.',
    noAnimalsAddedSub: 'Add your first animal to start building your farm records, track health, and manage sales.',
    addAnimal: 'Add Animal',
    futureMarketplace: 'Future Marketplace',
    comingLater: 'Coming Later',
    connectWithBuyers: 'Connect with Buyers',
    connectWithBuyersSub: 'Soon you\'ll be able to list your livestock directly to a nationwide network of verified buyers.',
    recentActivity: 'Recent Activity',
    noRecentActivity: 'No recent activity to display.',
    addWeight: 'Add Weight',
    addVaccine: 'Add Vaccine',
    healthStatus: 'Health Status',
    excellent: 'Excellent',
    underTreatment: 'Under treatment',
    totalHerd: 'Total Herd',
    animalHead: 'head',
    recentWeightRecorded: 'Weight recorded for {name} ({weight} kg)',
    recentVaccineRecorded: 'Vaccine ({vaccine}) recorded for {name}',
    recentAnimalCreated: 'New animal added: {name} ({breed})',
    moroccanSardi: 'Authentic Moroccan Sardi',
    details: 'Details',
    actions: 'Quick Farm Actions',
  }
};

const animalEmojis: Record<string, string> = {
  Sheep: '🐑',
  Cow: '🐄',
  Goat: '🐐',
  Camel: '🐪',
  Other: '🌾'
};

export default function DashboardView({
  currentLanguage,
  animals,
  weightRecords,
  vaccineRecords,
  listings,
  onAddAnimalClick,
  onAddWeightClick,
  onAddVaccineClick,
}: DashboardViewProps) {
  const tGlobal = translations[currentLanguage];
  const tLocal = dashboardTranslations[currentLanguage] || dashboardTranslations['fr'];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  // Dynamic calculations based on real array values
  const totalHerdCount = animals.length;
  const activeListingsCount = listings.filter(l => !l.isSold).length;
  const readyForSaleCount = animals.filter(a => a.status === 'Excellent' || a.status === 'Good').length;
  const healthRemindersCount = animals.filter(a => a.status === 'Under treatment').length;

  // Compile real activity logs dynamically to showcase active tracking
  const computedActivities = React.useMemo(() => {
    const logs: { id: string; text: string; date: string; type: 'weight' | 'vaccine' | 'animal' }[] = [];

    // Latest animals
    animals.slice(-3).forEach(a => {
      logs.push({
        id: `animal-${a.id}`,
        text: tLocal.recentAnimalCreated.replace('{name}', a.name).replace('{breed}', a.breed),
        date: a.createdAt || new Date().toISOString(),
        type: 'animal'
      });
    });

    // Latest weights
    weightRecords.slice(-3).forEach(w => {
      const animal = animals.find(a => a.id === w.animalId);
      const name = animal ? animal.name : `MA-${w.animalId.slice(0, 5)}`;
      logs.push({
        id: `weight-${w.id}`,
        text: tLocal.recentWeightRecorded.replace('{name}', name).replace('{weight}', String(w.weight)),
        date: w.date,
        type: 'weight'
      });
    });

    // Latest vaccines
    vaccineRecords.slice(-3).forEach(v => {
      const animal = animals.find(a => a.id === v.animalId);
      const name = animal ? animal.name : `MA-${v.animalId.slice(0, 5)}`;
      logs.push({
        id: `vaccine-${v.id}`,
        text: tLocal.recentVaccineRecorded.replace('{name}', name).replace('{vaccine}', v.vaccineName),
        date: v.date,
        type: 'vaccine'
      });
    });

    // Sort by date desc
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
  }, [animals, weightRecords, vaccineRecords, tLocal]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 py-4"
    >
      {/* Welcome & High Level Metrics (Bento Style) */}
      <section className={`grid grid-cols-1 md:grid-cols-12 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        
        {/* Welcome Card */}
        <div className="md:col-span-12 lg:col-span-4 bg-white rounded-2xl border border-secondary-container p-6 flex flex-col justify-between overflow-hidden relative group shadow-sm min-h-[180px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container rounded-bl-full opacity-5 -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-115"></div>
          
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h1 className="text-xl sm:text-2xl font-black text-primary tracking-tight">{tLocal.welcomeBack}</h1>
            <p className="text-xs text-on-surface-variant/90 font-medium mt-1">{tLocal.summaryStatus}</p>
          </div>

          <div className={`mt-6 flex items-center justify-between border-t border-surface-variant/40 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <span className="block text-[10px] font-black uppercase text-on-surface-variant/80 tracking-wider mb-1">
                {tLocal.profileCompletion}
              </span>
              <span className="text-xl font-extrabold text-primary">100%</span>
            </div>
            <Verified size={32} className="text-primary-container shrink-0" />
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="md:col-span-12 lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          
          {/* Metric 1: Total Animals */}
          <div className="bg-white rounded-2xl border border-secondary-container p-5 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
            <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-surface-container rounded-xl p-2.5">
                <PawPrint className="text-primary" size={20} />
              </div>
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-3xl font-black text-primary leading-none mb-1">{totalHerdCount}</p>
              <p className="text-[10px] font-black uppercase text-on-surface-variant/85 tracking-wider">{tLocal.totalAnimals}</p>
            </div>
          </div>

          {/* Metric 2: Active Listings */}
          <div className="bg-white rounded-2xl border border-secondary-container p-5 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
            <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-surface-container rounded-xl p-2.5">
                <Store className="text-primary" size={20} />
              </div>
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-3xl font-black text-primary leading-none mb-1">{activeListingsCount}</p>
              <p className="text-[10px] font-black uppercase text-on-surface-variant/85 tracking-wider">{tLocal.activeListings}</p>
            </div>
          </div>

          {/* Metric 3: Ready for Sale */}
          <div className="bg-white rounded-2xl border border-secondary-container p-5 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
            <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="bg-surface-container rounded-xl p-2.5">
                <Truck className="text-primary" size={20} />
              </div>
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className="text-3xl font-black text-primary leading-none mb-1">{readyForSaleCount}</p>
              <p className="text-[10px] font-black uppercase text-on-surface-variant/85 tracking-wider">{tLocal.readyForSale}</p>
            </div>
          </div>

          {/* Metric 4: Health Reminders */}
          <div className="bg-white rounded-2xl border border-secondary-container p-5 flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all">
            <div className={`flex justify-between items-start mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`${healthRemindersCount > 0 ? 'bg-error-container/30' : 'bg-surface-container'} rounded-xl p-2.5`}>
                <HeartPulse className={healthRemindersCount > 0 ? 'text-error' : 'text-primary'} size={20} />
              </div>
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <p className={`text-3xl font-black leading-none mb-1 ${healthRemindersCount > 0 ? 'text-error' : 'text-primary'}`}>
                {healthRemindersCount}
              </p>
              <p className="text-[10px] font-black uppercase text-on-surface-variant/85 tracking-wider">{tLocal.healthReminders}</p>
            </div>
          </div>

        </div>
      </section>

      {/* Main Content Area: Empty States or Tables & Teasers */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Livestock column (2/3 width) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-secondary-container overflow-hidden shadow-sm">
          {/* Polished header styled in earthy tones */}
          <div className={`bg-[#F5EBE0] px-6 py-4.5 border-b border-secondary-container flex justify-between items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h2 className="text-sm font-black uppercase tracking-wider text-primary">
              {tLocal.myLivestock}
            </h2>
            {animals.length > 0 && (
              <button
                onClick={onAddAnimalClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-on-primary hover:bg-primary-container text-[11px] font-bold rounded-lg shadow-sm transition-all cursor-pointer"
              >
                <Plus size={13} />
                <span>{tLocal.addAnimal}</span>
              </button>
            )}
          </div>

          {animals.length === 0 ? (
            /* High-Fidelity Empty State */
            <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center min-h-[320px] space-y-5">
              <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center border border-secondary-container/40">
                <Inbox size={36} className="text-outline" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="text-base font-black text-on-surface">{tLocal.noAnimalsAdded}</h3>
                <p className="text-xs text-on-surface-variant/90 leading-relaxed">{tLocal.noAnimalsAddedSub}</p>
              </div>
              <button
                onClick={onAddAnimalClick}
                className="px-6 py-3 bg-primary-container text-on-primary hover:bg-primary-container/90 transition-all font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <Plus size={15} />
                <span>{tLocal.addAnimal}</span>
              </button>
            </div>
          ) : (
            /* Compact list view for populated herd */
            <div className="divide-y divide-secondary-container/30">
              <div className="p-4 bg-surface-container-low flex justify-between text-[10px] font-black uppercase tracking-wider text-secondary/90">
                <span className="w-2/5">{tLocal.details}</span>
                <span className="w-1/5 text-center">{tGlobal.weight}</span>
                <span className="w-1/5 text-center">{tLocal.healthStatus}</span>
                <span className="w-1/5 text-right">{tLocal.actions}</span>
              </div>
              {animals.map((animal) => (
                <div key={animal.id} className="p-4 flex items-center justify-between text-xs hover:bg-surface-container-low transition-colors">
                  {/* Name and breed */}
                  <div className="w-2/5 flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label="cattle">
                      {animalEmojis[animal.type] || '🐑'}
                    </span>
                    <div className="space-y-0.5">
                      <p className="font-extrabold text-primary">{animal.name}</p>
                      <p className="text-[10px] text-on-surface-variant/80 font-semibold">{animal.breed}</p>
                    </div>
                  </div>

                  {/* Weight */}
                  <div className="w-1/5 text-center font-bold text-primary">
                    {animal.weight} kg
                  </div>

                  {/* Status Pill */}
                  <div className="w-1/5 flex justify-center">
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase ${
                      animal.status === 'Excellent' || animal.status === 'Good'
                        ? 'bg-primary-fixed text-primary'
                        : animal.status === 'Under treatment'
                        ? 'bg-error-container text-error'
                        : 'bg-secondary-fixed text-secondary'
                    }`}>
                      {animal.status === 'Excellent' ? tLocal.excellent : animal.status === 'Under treatment' ? tLocal.underTreatment : animal.status}
                    </span>
                  </div>

                  {/* Quick recording actions */}
                  <div className="w-1/5 flex justify-end gap-1.5">
                    <button
                      onClick={onAddWeightClick}
                      title={tLocal.addWeight}
                      className="p-1.5 border border-outline-variant hover:bg-surface-container text-primary rounded-lg transition-colors cursor-pointer"
                    >
                      <Activity size={13} />
                    </button>
                    <button
                      onClick={onAddVaccineClick}
                      title={tLocal.addVaccine}
                      className="p-1.5 border border-outline-variant hover:bg-surface-container text-primary rounded-lg transition-colors cursor-pointer"
                    >
                      <CheckSquare size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Teasers (1/3 width) */}
        <div className="space-y-6">
          
          {/* Future Marketplace Teaser */}
          <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden shadow-sm relative group">
            <div className="absolute top-4 right-4 bg-[#ebe1d6] text-on-secondary-container px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-widest uppercase z-10">
              {tLocal.comingLater}
            </div>
            
            <div className={`bg-[#F5EBE0] px-6 py-4.5 border-b border-secondary-container ${isRtl ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black uppercase tracking-wider text-primary">
                {tLocal.futureMarketplace}
              </h2>
            </div>

            <div className="p-6 space-y-4">
              {/* Illustration container */}
              <div className="w-full h-32 rounded-xl bg-surface-container overflow-hidden border border-secondary-container/40 relative">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkgOK4NdmBHBTH2qQcGzjtnNG9grOMe89U5QsCWOSVgn3G7GMhTu7FJ1Rk3NX8e0GGRKhDMtS7IrDRDgLJ9wn6sCdsqp09eRnEPayL5Uv_NlsslQzuhSLdb2VJO_IorrfrkO2A-RhrWi5sQaGBjXkNe6QPcX67QnH7zMPyXnv1nK2_cD1TYmGWjwj-mOkzBjAkxHhk9gNFBbmnS65hCJWpntg4w-xTl9wey6YGTg1MIviStu0mKxxE-45rdREq8NJ33Jruz4e5pNY" 
                  alt="Moroccan rural market scene" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80 group-hover:scale-[1.03] transition-transform duration-500"
                />
              </div>

              <div className={isRtl ? 'text-right' : 'text-left'}>
                <h3 className="text-xs font-black text-primary uppercase">{tLocal.connectWithBuyers}</h3>
                <p className="text-[11px] text-on-surface-variant/90 leading-relaxed mt-1">
                  {tLocal.connectWithBuyersSub}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Activity Card */}
          <div className="bg-white rounded-2xl border border-secondary-container overflow-hidden shadow-sm">
            <div className={`bg-[#F5EBE0] px-6 py-4.5 border-b border-secondary-container ${isRtl ? 'text-right' : 'text-left'}`}>
              <h2 className="text-sm font-black uppercase tracking-wider text-primary">
                {tLocal.recentActivity}
              </h2>
            </div>

            {computedActivities.length === 0 ? (
              <div className="p-6 flex flex-col items-center justify-center text-center py-12 text-on-surface-variant/80 space-y-2">
                <History className="opacity-40 animate-pulse text-secondary" size={24} />
                <p className="text-[11px] font-semibold">{tLocal.noRecentActivity}</p>
              </div>
            ) : (
              <div className="p-4 divide-y divide-secondary-container/20">
                {computedActivities.map((act) => (
                  <div key={act.id} className={`py-3 flex justify-between items-start gap-4 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-start gap-2 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-1.5 shrink-0" />
                      <span className="font-bold text-on-background/90 text-[11px]">
                        {act.text}
                      </span>
                    </div>
                    <span className="text-[9px] text-on-surface-variant/65 font-mono shrink-0">
                      {new Date(act.date).toLocaleDateString(currentLanguage === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>
    </motion.div>
  );
}
