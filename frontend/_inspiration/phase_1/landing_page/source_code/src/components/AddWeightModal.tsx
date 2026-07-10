import React from 'react';
import { Language, Animal } from '../types';
import { translations } from '../translations';
import { X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AddWeightModalProps {
  currentLanguage: Language;
  isOpen: boolean;
  onClose: () => void;
  animals: Animal[];
  onAddWeightRecord: (animalId: string, weight: number, notes?: string) => void;
}

export default function AddWeightModal({
  currentLanguage,
  isOpen,
  onClose,
  animals,
  onAddWeightRecord,
}: AddWeightModalProps) {
  const t = translations[currentLanguage];
  const isRtl = currentLanguage === 'ar' || currentLanguage === 'darija';

  const [selectedAnimalId, setSelectedAnimalId] = React.useState('');
  const [weight, setWeight] = React.useState('');
  const [notes, setNotes] = React.useState('');

  React.useEffect(() => {
    if (isOpen && animals.length > 0) {
      setSelectedAnimalId(animals[0].id);
    }
  }, [isOpen, animals]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnimalId || !weight) return;

    onAddWeightRecord(selectedAnimalId, parseFloat(weight), notes);

    // Reset and close
    setWeight('');
    setNotes('');
    onClose();
  };

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
            className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden z-10 border border-secondary-container"
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
              <h3 className="text-lg font-bold">{t.addWeight}</h3>
              <p className="text-xs text-primary-fixed/80">{t.feat2Desc}</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Select Animal */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.animals}
                </label>
                <select
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs font-bold focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right pr-3' : 'text-left pl-3'
                  }`}
                >
                  {animals.map(animal => (
                    <option key={animal.id} value={animal.id}>
                      {animal.name} ({animal.id} - {animal.breed})
                    </option>
                  ))}
                </select>
              </div>

              {/* Weight input */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.weightKg} <span className="text-error">*</span>
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g. 65"
                  required
                  className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right pr-3' : 'text-left pl-3'
                  }`}
                />
              </div>

              {/* Notes */}
              <div>
                <label className={`block text-xs font-bold text-on-surface-variant mb-1 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.notesLabel}
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Measured before feeding"
                  className={`w-full py-2.5 bg-surface-container-low border border-secondary-container/50 rounded-lg text-xs focus:outline-none focus:border-primary ${
                    isRtl ? 'text-right pr-3' : 'text-left pl-3'
                  }`}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-primary text-on-primary font-bold text-xs rounded-xl shadow transition-all cursor-pointer"
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
