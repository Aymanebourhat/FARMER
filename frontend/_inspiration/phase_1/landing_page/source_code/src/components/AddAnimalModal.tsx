import React from 'react';
import { Language, Animal, AnimalType } from '../types';
import { translations } from '../translations';
import { X, Sparkles, Calendar, Tag, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddAnimalModalProps {
  currentLanguage: Language;
  isOpen: boolean;
  onClose: () => void;
  onAddAnimal: (animal: Omit<Animal, 'createdAt'>) => void;
}

export default function AddAnimalModal({
  currentLanguage,
  isOpen,
  onClose,
  onAddAnimal,
}: AddAnimalModalProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [name, setName] = React.useState('');
  const [tagId, setTagId] = React.useState('');
  const [type, setType] = React.useState<AnimalType>('Sheep');
  const [breed, setBreed] = React.useState('Sardi');
  const [gender, setGender] = React.useState<'Male' | 'Female'>('Male');
  const [origin, setOrigin] = React.useState('Settat');
  const [birthDate, setBirthDate] = React.useState('2025-05-10');
  const [weight, setWeight] = React.useState('45');
  const [status, setStatus] = React.useState<Animal['status']>('Excellent');

  React.useEffect(() => {
    if (isOpen) {
      // Auto-generate a neat mock ID on open
      const rand = Math.floor(10000 + Math.random() * 90000);
      setTagId(`MA-${rand}`);
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !tagId || !weight) return;

    onAddAnimal({
      id: tagId,
      name,
      type,
      breed,
      gender,
      origin,
      birthDate,
      weight: parseFloat(weight),
      status,
      parentage: {},
    });

    // Reset and close
    setName('');
    onClose();
  };

  const moroccanCities = [
    'Settat', 'El Kelaa des Sraghna', 'Oujda', 'Marrakech', 'Chefchaouen', 
    'Fès', 'Meknès', 'Khenifra', 'Guelmim', 'Taroudant', 'Berkane', 'Safi'
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-secondary-container"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className={`absolute top-4 p-2 text-on-surface-variant hover:bg-surface-container rounded-full transition-all ${
                isRtl ? 'left-4' : 'right-4'
              }`}
            >
              <X size={18} />
            </button>

            <div className="p-5 bg-primary text-on-primary text-center">
              <h3 className="text-lg font-bold">{t.addAnimal}</h3>
              <p className="text-xs text-primary-fixed/80">{t.badgeBuiltForMoroccan}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Type selector */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.filterType}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Sheep', 'Goat', 'Cattle'] as AnimalType[]).map(tType => (
                    <button
                      key={tType}
                      type="button"
                      onClick={() => setType(tType)}
                      className={`py-2 text-xs font-bold border rounded-lg transition-all ${
                        type === tType
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-surface-container-low border-secondary-container text-secondary hover:bg-surface-container'
                      }`}
                    >
                      {t[tType.toLowerCase()]}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID & Name */}
              <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.idNumber} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={tagId}
                    onChange={(e) => setTagId(e.target.value)}
                    required
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs font-mono focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.animalName} <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Daisy"
                    required
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>
              </div>

              {/* Breed & Origin */}
              <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.breedLabel}
                  </label>
                  <input
                    type="text"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Sardi"
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.originLabel}
                  </label>
                  <select
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  >
                    {moroccanCities.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Gender & Birth Date */}
              <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.genderLabel}
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGender('Male')}
                      className={`flex-1 py-1.5 text-xs font-bold border rounded-lg ${
                        gender === 'Male'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-white border-secondary-container text-secondary'
                      }`}
                    >
                      {t.male}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGender('Female')}
                      className={`flex-1 py-1.5 text-xs font-bold border rounded-lg ${
                        gender === 'Female'
                          ? 'bg-primary text-on-primary border-primary'
                          : 'bg-white border-secondary-container text-secondary'
                      }`}
                    >
                      {t.female}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.birthDateLabel}
                  </label>
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full py-1.5 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary text-center"
                  />
                </div>
              </div>

              {/* Starting Weight & Status */}
              <div className={`grid grid-cols-2 gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.startingWeight} (kg) <span className="text-error">*</span>
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    required
                    className={`w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                      isRtl ? 'text-right pr-3' : 'text-left pl-3'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                    {t.healthyStatus}
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Animal['status'])}
                    className="w-full py-2 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary text-center"
                  >
                    <option value="Excellent">{t.excellent}</option>
                    <option value="Good">{t.good}</option>
                    <option value="Fair">{t.fair}</option>
                    <option value="Under treatment">{t.underTreatment}</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary font-bold text-sm rounded-xl shadow-md hover:bg-primary-container transition-all cursor-pointer"
              >
                {t.save}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
