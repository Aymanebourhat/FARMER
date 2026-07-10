import React from 'react';
import { Language, Animal, WeightRecord, VaccineRecord, Listing } from '../types';
import { translations } from '../translations';
import { Plus, TrendingUp, ShieldAlert, Award, Calendar, Activity, CheckSquare } from 'lucide-react';
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
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  // Stats calculation
  const totalHerdCount = animals.length;
  
  const avgWeight = totalHerdCount > 0
    ? Math.round(animals.reduce((acc, a) => acc + a.weight, 0) / totalHerdCount)
    : 0;
    
  const excellentCount = animals.filter(a => a.status === 'Excellent' || a.status === 'Good').length;
  const excellentPercentage = totalHerdCount > 0
    ? Math.round((excellentCount / totalHerdCount) * 100)
    : 100;

  const activeListingsCount = listings.filter(l => !l.isSold).length;

  // Let's create an elegant responsive SVG Line Chart for animal weights
  // Gather recent weights grouped by date
  const sortedRecords = [...weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const chartData = sortedRecords.slice(-6).map(r => ({
    label: new Date(r.date).toLocaleDateString((currentLanguage === 'ar' || currentLanguage === 'darija') ? 'ar-MA' : 'fr-FR', { month: 'short', day: 'numeric' }),
    value: r.weight,
  }));

  // Render a responsive path for SVG
  const svgWidth = 500;
  const svgHeight = 200;
  const padding = 30;
  
  const points = chartData.map((d, i) => {
    if (chartData.length <= 1) return '';
    const x = padding + (i / (chartData.length - 1)) * (svgWidth - padding * 2);
    // scale y between min and max weight
    const weights = chartData.map(c => c.value);
    const maxW = Math.max(...weights, 100);
    const minW = Math.min(...weights, 0);
    const range = maxW - minW || 1;
    const y = svgHeight - padding - ((d.value - minW) / range) * (svgHeight - padding * 2);
    return `${x},${y}`;
  });

  const pathD = points.length > 1 ? `M ${points.join(' L ')}` : '';

  // Breed distribution percentages
  const breedsCount: Record<string, number> = {};
  animals.forEach(a => {
    breedsCount[a.breed] = (breedsCount[a.breed] || 0) + 1;
  });

  const recentActivities = [
    { id: 1, type: 'weight', text: isRtl ? "تم تسجيل وزن خروف الصردي (68 كجم)" : "Poids enregistré pour le mouton Sardi (68 kg)", date: "2026-07-06" },
    { id: 2, type: 'vaccine', text: isRtl ? "تلقيح ضد الحمى القلاعية لـ دايزي" : "Vaccination anti-aphteuse pour Daisy", date: "2026-07-04" },
    { id: 3, type: 'listing', text: isRtl ? "عرض كبش بني غيل للبيع في السوق (5500 درهم)" : "Bélier Beni Guil mis en vente (5500 MAD)", date: "2026-07-01" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 py-4"
    >
      {/* Header and Quick Actions */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        isRtl ? 'sm:flex-row-reverse' : ''
      }`}>
        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.dashboard}</h2>
          <p className="text-sm text-on-surface-variant/80 mt-1">{t.badgeBuiltForMoroccan}</p>
        </div>
        
        {/* Quick action triggers */}
        <div className={`flex flex-wrap gap-2.5 w-full sm:w-auto ${
          isRtl ? 'flex-row-reverse' : ''
        }`}>
          <button
            id="dash-add-animal-btn"
            onClick={onAddAnimalClick}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary hover:bg-primary-container text-xs font-bold rounded-xl shadow transition-all cursor-pointer"
          >
            <Plus size={16} />
            <span>{t.addAnimal}</span>
          </button>
          <button
            id="dash-add-weight-btn"
            onClick={onAddWeightClick}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-primary text-primary hover:bg-surface-container text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Activity size={16} />
            <span>{t.addWeight}</span>
          </button>
          <button
            id="dash-add-vaccine-btn"
            onClick={onAddVaccineClick}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-primary text-primary hover:bg-surface-container text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <CheckSquare size={16} />
            <span>{t.addVaccine}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Herd */}
        <div className="bg-white border border-secondary-container/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <span className={`text-xs font-bold text-on-surface-variant/80 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.totalHerd}
          </span>
          <div className={`flex items-baseline gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-3xl sm:text-4xl font-extrabold text-primary">{totalHerdCount}</span>
            <span className="text-xs font-semibold text-secondary">{isRtl ? 'رأس' : 'têtes'}</span>
          </div>
        </div>

        {/* KPI 2: Average Weight */}
        <div className="bg-white border border-secondary-container/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <span className={`text-xs font-bold text-on-surface-variant/80 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.averageWeight}
          </span>
          <div className={`flex items-baseline gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-3xl sm:text-4xl font-extrabold text-primary">{avgWeight}</span>
            <span className="text-xs font-semibold text-secondary">kg</span>
          </div>
        </div>

        {/* KPI 3: Healthy Ratio */}
        <div className="bg-white border border-secondary-container/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <span className={`text-xs font-bold text-on-surface-variant/80 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.healthyStatus}
          </span>
          <div className={`flex items-baseline gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-3xl sm:text-4xl font-extrabold text-primary">{excellentPercentage}%</span>
            <span className="text-xs font-semibold text-primary-container bg-primary-fixed px-1.5 py-0.5 rounded">
              {t.excellent}
            </span>
          </div>
        </div>

        {/* KPI 4: Active Listings */}
        <div className="bg-white border border-secondary-container/60 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <span className={`text-xs font-bold text-on-surface-variant/80 ${isRtl ? 'text-right' : 'text-left'}`}>
            {t.activeListings}
          </span>
          <div className={`flex items-baseline gap-2 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <span className="text-3xl sm:text-4xl font-extrabold text-primary">{activeListingsCount}</span>
            <span className="text-xs font-semibold text-secondary">{isRtl ? 'إعلان' : 'annonces'}</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card: Growth Trend */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm lg:col-span-2">
          <div className={`flex justify-between items-center mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <h3 className="text-base sm:text-lg font-bold text-primary flex items-center gap-2">
              <TrendingUp size={18} className="text-primary" />
              <span>{t.growthTrend}</span>
            </h3>
          </div>

          {/* SVG Chart */}
          {chartData.length > 1 ? (
            <div className="w-full h-56 relative">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-full overflow-visible">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={svgWidth - padding} y2={padding} stroke="#ebe1d6" strokeDasharray="3,3" />
                <line x1={padding} y1={svgHeight / 2} x2={svgWidth - padding} y2={svgHeight / 2} stroke="#ebe1d6" strokeDasharray="3,3" />
                <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} stroke="#ebe1d6" />

                {/* Trend Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#012d1d"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Plot Points */}
                {chartData.map((d, i) => {
                  const x = padding + (i / (chartData.length - 1)) * (svgWidth - padding * 2);
                  const weights = chartData.map(c => c.value);
                  const maxW = Math.max(...weights, 100);
                  const minW = Math.min(...weights, 0);
                  const range = maxW - minW || 1;
                  const y = svgHeight - padding - ((d.value - minW) / range) * (svgHeight - padding * 2);

                  return (
                    <g key={i} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="6" fill="#012d1d" />
                      <circle cx={x} cy={y} r="10" fill="#012d1d" fillOpacity="0.2" className="hover:scale-125 transition-transform" />
                      {/* Tooltip text */}
                      <text x={x} y={y - 12} textAnchor="middle" className="text-[10px] font-bold fill-primary font-sans">
                        {d.value} kg
                      </text>
                    </g>
                  );
                })}

                {/* X Axis Labels */}
                {chartData.map((d, i) => {
                  const x = padding + (i / (chartData.length - 1)) * (svgWidth - padding * 2);
                  return (
                    <text key={i} x={x} y={svgHeight - 10} textAnchor="middle" className="text-[10px] fill-on-surface-variant font-medium font-sans">
                      {d.label}
                    </text>
                  );
                })}
              </svg>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center border-2 border-dashed border-secondary-container rounded-xl">
              <span className="text-xs text-on-surface-variant/70">{t.noWeightRecords}</span>
            </div>
          )}
        </div>

        {/* Breed Distribution Card */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm">
          <h3 className={`text-base sm:text-lg font-bold text-primary mb-6 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Award size={18} className="text-primary" />
            <span>{t.breedDistribution}</span>
          </h3>

          <div className="space-y-4">
            {Object.entries(breedsCount).length > 0 ? (
              Object.entries(breedsCount).map(([breed, count]) => {
                const percentage = Math.round((count / totalHerdCount) * 100);
                return (
                  <div key={breed} className="space-y-1.5">
                    <div className={`flex justify-between text-xs font-bold text-on-background ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <span>{breed}</span>
                      <span>{count} {isRtl ? 'رأس' : 'bêtes'} ({percentage}%)</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-44 flex items-center justify-center text-xs text-on-surface-variant/70">
                {t.noAnimals}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vaccine alerts & Recent Activities logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Medical events */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm">
          <h3 className={`text-base sm:text-lg font-bold text-primary mb-5 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Calendar size={18} className="text-primary" />
            <span>{t.upcomingVaccines}</span>
          </h3>

          <div className="space-y-3">
            <div className={`flex items-start gap-3 p-3 bg-error-container/30 border border-error/20 rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <ShieldAlert className="text-error shrink-0 mt-0.5" size={18} />
              <div className="space-y-0.5" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <p className="text-xs font-extrabold text-primary">MA-10294 (Daisy)</p>
                <p className="text-[11px] text-on-surface-variant/90 font-medium">
                  {isRtl ? "تلقيح ضد الحمى القلاعية مستحق في" : "Vaccination anti-aphteuse requise le"} 15/07/2026
                </p>
              </div>
            </div>

            <div className={`flex items-start gap-3 p-3 bg-secondary-container/40 border border-secondary-fixed rounded-xl ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Calendar className="text-secondary shrink-0 mt-0.5" size={18} />
              <div className="space-y-0.5" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <p className="text-xs font-extrabold text-primary">MA-88491 (Naima)</p>
                <p className="text-[11px] text-on-surface-variant/90 font-medium">
                  {isRtl ? "الفحص البيطري الروتيني القادم" : "Contrôle vétérinaire de routine"} - 22/07/2026
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent logs */}
        <div className="bg-white border border-secondary-container rounded-2xl p-6 shadow-sm">
          <h3 className={`text-base sm:text-lg font-bold text-primary mb-5 flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <Activity size={18} className="text-primary" />
            <span>{t.recentActivities}</span>
          </h3>

          <div className="space-y-4">
            {recentActivities.map((act) => (
              <div key={act.id} className={`flex justify-between items-center text-xs border-b border-secondary-container/30 pb-2.5 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}>
                <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-1.5 h-1.5 bg-primary rounded-full shrink-0" />
                  <span className="font-bold text-on-background/90" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    {act.text}
                  </span>
                </div>
                <span className="text-[10px] text-on-surface-variant/70 font-mono">
                  {new Date(act.date).toLocaleDateString(currentLanguage === 'ar' ? 'ar-MA' : 'fr-FR', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
