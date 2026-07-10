import React from 'react';
import { Language, Animal, WeightRecord, VaccineRecord } from '../types';
import { translations } from '../translations';
import { Search, Plus, Filter, Calendar, Activity, Syringe, Tag, MapPin, ChevronRight, Sparkles, Store, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AnimalsViewProps {
  currentLanguage: Language;
  animals: Animal[];
  weightRecords: WeightRecord[];
  vaccineRecords: VaccineRecord[];
  onAddAnimalClick: () => void;
  onAddWeightRecord: (animalId: string, weight: number, notes?: string) => void;
  onAddVaccineRecord: (animalId: string, vaccineName: string, batchNumber?: string, notes?: string) => void;
  onDeleteAnimal: (id: string) => void;
  onTransitionToMarketplace: (animal: Animal) => void;
}

export default function AnimalsView({
  currentLanguage,
  animals,
  weightRecords,
  vaccineRecords,
  onAddAnimalClick,
  onAddWeightRecord,
  onAddVaccineRecord,
  onDeleteAnimal,
  onTransitionToMarketplace,
}: AnimalsViewProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [search, setSearch] = React.useState('');
  const [selectedType, setSelectedType] = React.useState<string>('All');
  const [selectedBreed, setSelectedBreed] = React.useState<string>('All');
  const [selectedAnimal, setSelectedAnimal] = React.useState<Animal | null>(null);

  // New weight and health input forms (internal to details panel)
  const [newWeight, setNewWeight] = React.useState('');
  const [weightNotes, setWeightNotes] = React.useState('');
  const [newVaccine, setNewVaccine] = React.useState('');
  const [vaccineBatch, setVaccineBatch] = React.useState('');
  const [vaccineNotes, setVaccineNotes] = React.useState('');

  const [weightSuccess, setWeightSuccess] = React.useState(false);
  const [vaccineSuccess, setVaccineSuccess] = React.useState(false);

  // Unique breeds for filter
  const uniqueBreeds = React.useMemo(() => {
    const breeds = animals.map(a => a.breed);
    return ['All', ...Array.from(new Set(breeds))];
  }, [animals]);

  // Filtered animals list
  const filteredAnimals = React.useMemo(() => {
    return animals.filter(a => {
      const matchSearch = 
        a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.breed.toLowerCase().includes(search.toLowerCase()) ||
        a.origin.toLowerCase().includes(search.toLowerCase());
      
      const matchType = selectedType === 'All' || a.type === selectedType;
      const matchBreed = selectedBreed === 'All' || a.breed === selectedBreed;

      return matchSearch && matchType && matchBreed;
    });
  }, [animals, search, selectedType, selectedBreed]);

  const handleAddWeight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !newWeight) return;
    
    onAddWeightRecord(selectedAnimal.id, parseFloat(newWeight), weightNotes);
    
    // Update local detail sheet immediately
    setSelectedAnimal(prev => prev ? { ...prev, weight: parseFloat(newWeight) } : null);

    setNewWeight('');
    setWeightNotes('');
    setWeightSuccess(true);
    setTimeout(() => setWeightSuccess(false), 2000);
  };

  const handleAddVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimal || !newVaccine) return;

    onAddVaccineRecord(selectedAnimal.id, newVaccine, vaccineBatch, vaccineNotes);

    setNewVaccine('');
    setVaccineBatch('');
    setVaccineNotes('');
    setVaccineSuccess(true);
    setTimeout(() => setVaccineSuccess(false), 2000);
  };

  // Get records for selected animal
  const currentAnimalWeights = React.useMemo(() => {
    if (!selectedAnimal) return [];
    return weightRecords
      .filter(r => r.animalId === selectedAnimal.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [weightRecords, selectedAnimal]);

  const currentAnimalVaccines = React.useMemo(() => {
    if (!selectedAnimal) return [];
    return vaccineRecords
      .filter(r => r.animalId === selectedAnimal.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [vaccineRecords, selectedAnimal]);

  return (
    <div className="space-y-8 py-4 relative">
      {/* Header Area */}
      <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
        isRtl ? 'sm:flex-row-reverse' : ''
      }`}>
        <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-primary">{t.animals}</h2>
          <p className="text-sm text-on-surface-variant/80 mt-1">
            {animals.length} {currentLanguage === 'darija' ? 'راس مقيد فالكسيبة' : isRtl ? 'رأس مسجل في القطيع' : 'bêtes enregistrées'}
          </p>
        </div>

        <button
          id="anim-add-btn"
          onClick={onAddAnimalClick}
          className="flex items-center gap-1.5 px-5 py-3 bg-primary text-on-primary hover:bg-primary-container text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={18} />
          <span>{t.addAnimal}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className={`bg-white border border-secondary-container/60 rounded-2xl p-4 shadow-sm space-y-4 md:space-y-0 md:flex items-center gap-4 ${
        isRtl ? 'md:flex-row-reverse' : 'md:flex-row'
      }`}>
        {/* Search */}
        <div className="relative flex-1">
          <Search size={18} className={`absolute top-3.5 text-secondary/60 ${isRtl ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/50 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white transition-all ${
              isRtl ? 'pr-10 text-right' : 'pl-10 text-left'
            }`}
          />
        </div>

        {/* Species Filter */}
        <div className="flex items-center gap-2 md:w-48">
          <Filter size={16} className="text-secondary shrink-0" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
          >
            <option value="All">{t.filterType}: {t.all}</option>
            <option value="Sheep">{t.sheep}</option>
            <option value="Goat">{t.goat}</option>
            <option value="Cattle">{t.cattle}</option>
          </select>
        </div>

        {/* Breed Filter */}
        <div className="flex items-center gap-2 md:w-48">
          <Tag size={16} className="text-secondary shrink-0" />
          <select
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
            className="w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-xl text-xs font-bold focus:outline-none focus:border-primary"
          >
            <option value="All">{t.filterBreed}: {t.all}</option>
            {uniqueBreeds.filter(b => b !== 'All').map(breed => (
              <option key={breed} value={breed}>{breed}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Animals */}
      {filteredAnimals.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <motion.div
              layout
              key={animal.id}
              onClick={() => setSelectedAnimal(animal)}
              id={`animal-card-${animal.id}`}
              className="bg-white border border-secondary-container rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:border-primary/25 cursor-pointer transition-all flex flex-col justify-between"
            >
              {/* Card visual header */}
              <div className="p-5 border-b border-secondary-container/40">
                <div className={`flex justify-between items-start ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 bg-primary/10 text-primary rounded-full uppercase tracking-wider font-mono">
                      {animal.id}
                    </span>
                    <h3 className={`text-lg font-extrabold text-primary mt-1.5 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {animal.name}
                    </h3>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    animal.status === 'Excellent' ? 'bg-primary-fixed text-primary' :
                    animal.status === 'Good' ? 'bg-secondary-fixed text-secondary' :
                    'bg-error-container text-error'
                  }`}>
                    {t[animal.status.toLowerCase().replace(' ', '')]}
                  </span>
                </div>
              </div>

              {/* Specs */}
              <div className="p-5 bg-surface-container-lowest/50 space-y-3 text-xs font-medium">
                <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-on-surface-variant/70">{t.breedLabel}</span>
                  <span className="font-extrabold text-primary">{animal.breed}</span>
                </div>
                <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-on-surface-variant/70">{t.weightKg}</span>
                  <span className="font-extrabold text-primary">{animal.weight} kg</span>
                </div>
                <div className={`flex justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-on-surface-variant/70">{t.originLabel}</span>
                  <span className="font-extrabold text-primary flex items-center gap-0.5">
                    <MapPin size={12} />
                    {animal.origin}
                  </span>
                </div>
              </div>

              {/* Action area footer */}
              <div className={`p-4 bg-surface-container-low flex justify-between items-center border-t border-secondary-container/30 ${
                isRtl ? 'flex-row-reverse' : ''
              }`}>
                <span className="text-[10px] font-mono text-on-surface-variant/70">
                  {new Date(animal.birthDate).toLocaleDateString(currentLanguage === 'ar' ? 'ar-MA' : 'fr-FR', { year: 'numeric', month: 'short' })}
                </span>
                <span className="text-xs font-bold text-primary flex items-center gap-1">
                  <span>{isRtl ? 'عرض التفاصيل والنمو' : 'Détails & croissance'}</span>
                  <ChevronRight size={14} className={isRtl ? 'rotate-180' : ''} />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-secondary-container rounded-2xl max-w-xl mx-auto">
          <p className="text-sm text-on-surface-variant font-bold leading-relaxed px-6">
            {t.noAnimals}
          </p>
        </div>
      )}

      {/* Slide-over Detail Sheet */}
      <AnimatePresence>
        {selectedAnimal && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnimal(null)}
              className="absolute inset-0 bg-black"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between overflow-y-auto z-10 border-l border-secondary-container"
            >
              {/* Header */}
              <div className="p-6 bg-primary text-on-primary sticky top-0 z-10 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 bg-white/20 rounded">
                    {selectedAnimal.id}
                  </span>
                  <h3 className="text-xl font-extrabold mt-2">{selectedAnimal.name}</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onTransitionToMarketplace(selectedAnimal);
                      setSelectedAnimal(null);
                    }}
                    title={t.listForSale}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    <Store size={15} />
                    <span>{t.listForSale}</span>
                  </button>
                  <button
                    onClick={() => {
                      const confirmMsg = currentLanguage === 'darija'
                        ? 'واش تيقنتي بغيتي تحيد هاد البهيمة؟'
                        : isRtl
                        ? 'هل أنت متأكد من حذف هذا الحيوان؟'
                        : 'Supprimer cet animal ?';
                      if (confirm(confirmMsg)) {
                        onDeleteAnimal(selectedAnimal.id);
                        setSelectedAnimal(null);
                      }
                    }}
                    title={t.delete}
                    className="p-2 bg-error-container/20 hover:bg-error-container/40 text-error-container hover:text-white rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button
                    onClick={() => setSelectedAnimal(null)}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all"
                  >
                    <ChevronRight size={20} className={isRtl ? '' : 'rotate-180'} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 space-y-8 flex-1">
                {/* Details Card */}
                <div className="bg-surface-container-low rounded-2xl p-5 border border-secondary-container/40 space-y-4">
                  <h4 className={`text-sm font-bold text-primary flex items-center gap-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Sparkles size={16} />
                    <span>{t.parentageInfo}</span>
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      <span className="text-on-surface-variant/70 block mb-1">{t.breedLabel}</span>
                      <span className="font-bold text-primary text-sm">{selectedAnimal.breed}</span>
                    </div>
                    <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      <span className="text-on-surface-variant/70 block mb-1">{t.genderLabel}</span>
                      <span className="font-bold text-primary text-sm">
                        {selectedAnimal.gender === 'Male' ? t.male : t.female}
                      </span>
                    </div>
                    <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      <span className="text-on-surface-variant/70 block mb-1">{t.originLabel}</span>
                      <span className="font-bold text-primary text-sm">{selectedAnimal.origin}</span>
                    </div>
                    <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                      <span className="text-on-surface-variant/70 block mb-1">{t.birthDateLabel}</span>
                      <span className="font-bold text-primary text-sm">
                        {new Date(selectedAnimal.birthDate).toLocaleDateString((currentLanguage === 'ar' || currentLanguage === 'darija') ? 'ar-MA' : 'fr-FR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Growth records & Form */}
                <div className="space-y-4">
                  <h4 className={`text-base font-extrabold text-primary flex items-center gap-2 border-b border-secondary-container pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Activity size={18} />
                    <span>{t.growthHistory}</span>
                  </h4>

                  {/* Add weight mini form */}
                  <form onSubmit={handleAddWeight} className="bg-surface-container-low/50 p-4 rounded-xl border border-secondary-container/40 flex flex-col gap-3">
                    <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="number"
                        value={newWeight}
                        onChange={(e) => setNewWeight(e.target.value)}
                        placeholder={`${t.weightKg} e.g. 70`}
                        required
                        className={`flex-1 px-3 py-2 bg-white border border-secondary-container rounded-lg text-xs focus:outline-none focus:border-primary ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                      <input
                        type="text"
                        value={weightNotes}
                        onChange={(e) => setWeightNotes(e.target.value)}
                        placeholder={t.notesLabel}
                        className={`flex-1 px-3 py-2 bg-white border border-secondary-container rounded-lg text-xs focus:outline-none focus:border-primary ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                    </div>
                    <button
                      type="submit"
                      className="py-2 bg-primary text-on-primary font-bold text-xs rounded-lg shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                    >
                      {weightSuccess ? t.addRecordSuccess : t.addWeight}
                    </button>
                  </form>

                  {/* Weight log list */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {currentAnimalWeights.length > 0 ? (
                      currentAnimalWeights.map((w) => (
                        <div key={w.id} className={`flex justify-between items-center text-xs p-3 bg-white border border-secondary-container/30 rounded-xl ${
                          isRtl ? 'flex-row-reverse' : ''
                        }`}>
                          <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                            <span className="font-extrabold text-primary">{w.weight} kg</span>
                            {w.notes && <span className="text-[10px] text-on-surface-variant/70">({w.notes})</span>}
                          </div>
                          <span className="text-[10px] text-on-surface-variant/70 font-mono">
                            {new Date(w.date).toLocaleDateString((currentLanguage === 'ar' || currentLanguage === 'darija') ? 'ar-MA' : 'fr-FR')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-on-surface-variant/60 py-4">{t.noWeightRecords}</p>
                    )}
                  </div>
                </div>

                {/* Health logs & Form */}
                <div className="space-y-4">
                  <h4 className={`text-base font-extrabold text-primary flex items-center gap-2 border-b border-secondary-container pb-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <Syringe size={18} />
                    <span>{t.healthHistory}</span>
                  </h4>

                  {/* Add vaccine mini form */}
                  <form onSubmit={handleAddVaccine} className="bg-surface-container-low/50 p-4 rounded-xl border border-secondary-container/40 flex flex-col gap-3">
                    <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                      <input
                        type="text"
                        value={newVaccine}
                        onChange={(e) => setNewVaccine(e.target.value)}
                        placeholder={`${t.vaccineName} e.g. PPR`}
                        required
                        className={`w-full px-3 py-2 bg-white border border-secondary-container rounded-lg text-xs focus:outline-none focus:border-primary ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                      <input
                        type="text"
                        value={vaccineBatch}
                        onChange={(e) => setVaccineBatch(e.target.value)}
                        placeholder={t.batchNumber}
                        className={`w-full px-3 py-2 bg-white border border-secondary-container rounded-lg text-xs focus:outline-none focus:border-primary ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      />
                    </div>
                    <input
                      type="text"
                      value={vaccineNotes}
                      onChange={(e) => setVaccineNotes(e.target.value)}
                      placeholder={t.notesLabel}
                      className={`w-full px-3 py-2 bg-white border border-secondary-container rounded-lg text-xs focus:outline-none focus:border-primary ${
                        isRtl ? 'text-right' : 'text-left'
                      }`}
                    />
                    <button
                      type="submit"
                      className="py-2 bg-primary text-on-primary font-bold text-xs rounded-lg shadow-sm hover:bg-primary-container transition-all cursor-pointer"
                    >
                      {vaccineSuccess ? t.addRecordSuccess : t.addVaccine}
                    </button>
                  </form>

                  {/* Vaccine logs */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto">
                    {currentAnimalVaccines.length > 0 ? (
                      currentAnimalVaccines.map((v) => (
                        <div key={v.id} className={`flex justify-between items-start text-xs p-3 bg-white border border-secondary-container/30 rounded-xl ${
                          isRtl ? 'flex-row-reverse' : ''
                        }`}>
                          <div className="space-y-0.5" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                            <p className="font-extrabold text-primary">{v.vaccineName}</p>
                            {v.batchNumber && (
                              <p className="text-[10px] text-on-surface-variant/70">
                                {t.batchNumber}: {v.batchNumber}
                              </p>
                            )}
                            {v.notes && <p className="text-[10px] text-on-surface-variant/80 italic">{v.notes}</p>}
                          </div>
                          <span className="text-[10px] text-on-surface-variant/70 font-mono">
                            {new Date(v.date).toLocaleDateString((currentLanguage === 'ar' || currentLanguage === 'darija') ? 'ar-MA' : 'fr-FR')}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-xs text-on-surface-variant/60 py-4">{t.noVaccineRecords}</p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
