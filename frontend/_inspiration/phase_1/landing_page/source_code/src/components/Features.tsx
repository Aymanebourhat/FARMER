import React from 'react';
import { Language } from '../types';
import { translations } from '../translations';
import { ClipboardList, Scale, Syringe, Store } from 'lucide-react';
import { motion } from 'motion/react';

interface FeaturesProps {
  currentLanguage: Language;
  setTab: (tab: string) => void;
}

export default function Features({ currentLanguage, setTab }: FeaturesProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  return (
    <section className="py-12 md:py-16 border-t border-secondary-container/30">
      <h3 className={`text-2xl sm:text-3xl font-extrabold text-primary mb-10 ${
        isRtl ? 'text-right' : 'text-left'
      }`}>
        {t.sectionTitleBento}
      </h3>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {/* Card 1: Livestock records (large card) */}
        <motion.div
          variants={itemVariants}
          onClick={() => setTab('animals')}
          className="md:col-span-2 md:row-span-2 bg-white border border-secondary-container rounded-2xl p-6 sm:p-8 flex flex-col justify-between hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
        >
          <div>
            <div className="w-12 h-12 bg-secondary-fixed rounded-xl flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform">
              <ClipboardList size={22} />
            </div>
            <h4 className={`text-xl sm:text-2xl font-bold text-primary mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat1Title}
            </h4>
            <p className={`text-sm text-on-surface-variant/95 leading-relaxed mb-6 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat1Desc}
            </p>
          </div>
          
          <div className="h-44 rounded-xl bg-surface-container-low p-5 flex flex-col justify-between border border-secondary-container/40 shadow-inner">
            <div className={`flex items-center justify-between border-b border-secondary-container/30 pb-2.5 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-xs font-bold text-primary font-mono">#MA-10294</span>
              <span className="text-[10px] bg-success-container text-success px-2.5 py-0.5 rounded-full font-bold">
                {t.excellent}
              </span>
            </div>
            
            <div className={`grid grid-cols-3 gap-2 py-2 ${isRtl ? 'text-right' : 'text-left'}`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
              <div>
                <span className="text-[10px] text-on-surface-variant/70 block">{t.animalName}</span>
                <span className="text-xs font-bold text-primary">Daisy</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant/70 block">{t.breedLabel}</span>
                <span className="text-xs font-bold text-primary">Sardi (سردي)</span>
              </div>
              <div>
                <span className="text-[10px] text-on-surface-variant/70 block">{t.currentWeight}</span>
                <span className="text-xs font-bold text-primary">68 kg</span>
              </div>
            </div>

            <div className={`bg-white/80 rounded-lg p-2.5 text-xs border border-secondary-container/20 flex justify-between items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <span className="text-on-surface-variant/80 text-[11px] font-medium">{t.recentActivities}</span>
              <span className="text-primary font-bold text-[11px]">{t.addVaccine || 'Vaccine'}: Fièvre Aphteuse</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Growth tracking */}
        <motion.div
          variants={itemVariants}
          onClick={() => setTab('dashboard')}
          className="bg-white border border-secondary-container rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-secondary-fixed rounded-xl flex items-center justify-center mb-5 text-primary group-hover:scale-110 transition-transform">
            <Scale size={22} />
          </div>
          <div>
            <h4 className={`text-lg sm:text-xl font-bold text-primary mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat2Title}
            </h4>
            <p className={`text-sm text-on-surface-variant/90 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat2Desc}
            </p>
          </div>
        </motion.div>

        {/* Card 3: Health history */}
        <motion.div
          variants={itemVariants}
          onClick={() => setTab('animals')}
          className="bg-white border border-secondary-container rounded-2xl p-6 flex flex-col justify-between hover:shadow-lg hover:border-primary/20 transition-all duration-300 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-error-container rounded-xl flex items-center justify-center mb-5 text-error group-hover:scale-110 transition-transform">
            <Syringe size={22} />
          </div>
          <div>
            <h4 className={`text-lg sm:text-xl font-bold text-primary mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat3Title}
            </h4>
            <p className={`text-sm text-on-surface-variant/90 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat3Desc}
            </p>
          </div>
        </motion.div>

        {/* Card 4: Future marketplace */}
        <motion.div
          variants={itemVariants}
          onClick={() => setTab('listings')}
          className="bg-primary text-on-primary rounded-2xl p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 cursor-pointer group md:col-span-2 lg:col-span-1"
        >
          <div className="w-12 h-12 bg-primary-container/80 text-primary-fixed rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
            <Store size={22} />
          </div>
          <div>
            <h4 className={`text-lg sm:text-xl font-bold text-white mb-2.5 ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat4Title}
            </h4>
            <p className={`text-sm text-primary-fixed/90 leading-relaxed ${isRtl ? 'text-right' : 'text-left'}`}>
              {t.feat4Desc}
            </p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
