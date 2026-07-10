import React from 'react';
import { Language, Animal, WeightRecord, VaccineRecord, Listing, UserProfile } from './types';
import { translations } from './translations';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Footer from './components/Footer';
import DashboardView from './components/DashboardView';
import AnimalsView from './components/AnimalsView';
import ListingsView from './components/ListingsView';
import ProfileView from './components/ProfileView';
import AuthModal from './components/AuthModal';
import AddAnimalModal from './components/AddAnimalModal';
import AddWeightModal from './components/AddWeightModal';
import AddVaccineModal from './components/AddVaccineModal';
import { motion } from 'motion/react';

// Pre-loaded mockup data to make the applet fully alive out of the box!
const PRELOADED_USER: UserProfile = {
  fullName: 'Mohamed El Haouzi',
  farmName: 'Ferme El Haouz',
  phone: '06 12 34 56 78',
  location: 'Settat',
  language: 'ar',
};

const PRELOADED_ANIMALS: Animal[] = [
  {
    id: 'MA-10294',
    name: 'Daisy',
    type: 'Sheep',
    breed: 'Sardi',
    gender: 'Female',
    origin: 'Settat',
    birthDate: '2025-02-15',
    status: 'Excellent',
    weight: 68,
    parentage: {},
    createdAt: '2025-02-15T00:00:00.000Z',
  },
  {
    id: 'MA-39401',
    name: 'Mabrouk',
    type: 'Sheep',
    breed: 'Beni Guil',
    gender: 'Male',
    origin: 'Oujda',
    birthDate: '2024-11-10',
    status: 'Good',
    weight: 72,
    parentage: {},
    createdAt: '2024-11-10T00:00:00.000Z',
  },
  {
    id: 'MA-88491',
    name: 'Naima',
    type: 'Goat',
    breed: 'Alpine',
    gender: 'Female',
    origin: 'Chefchaouen',
    birthDate: '2025-01-05',
    status: 'Under treatment',
    weight: 38,
    parentage: {},
    createdAt: '2025-01-05T00:00:00.000Z',
  }
];

const PRELOADED_WEIGHTS: WeightRecord[] = [
  { id: 'w1', animalId: 'MA-10294', weight: 45, date: '2025-02-15T12:00:00.000Z', notes: 'Poids à la naissance' },
  { id: 'w2', animalId: 'MA-10294', weight: 55, date: '2025-04-15T12:00:00.000Z', notes: 'Vaccination' },
  { id: 'w3', animalId: 'MA-10294', weight: 68, date: '2025-07-06T12:00:00.000Z', notes: 'Relevé mensuel' },
  
  { id: 'w4', animalId: 'MA-39401', weight: 50, date: '2024-11-10T12:00:00.000Z', notes: 'Poids à la naissance' },
  { id: 'w5', animalId: 'MA-39401', weight: 62, date: '2025-03-10T12:00:00.000Z', notes: 'Suivi printemps' },
  { id: 'w6', animalId: 'MA-39401', weight: 72, date: '2025-07-01T12:00:00.000Z', notes: 'Préparation vente' },
  
  { id: 'w7', animalId: 'MA-88491', weight: 25, date: '2025-01-05T12:00:00.000Z', notes: 'Acquisition' },
  { id: 'w8', animalId: 'MA-88491', weight: 38, date: '2025-07-04T12:00:00.000Z', notes: 'Suivi vétérinaire' },
];

const PRELOADED_VACCINES: VaccineRecord[] = [
  { id: 'v1', animalId: 'MA-10294', vaccineName: 'Peste des petits ruminants (PPR)', date: '2025-04-15T12:00:00.000Z', batchNumber: 'LOT-998A' },
  { id: 'v2', animalId: 'MA-10294', vaccineName: 'Fièvre Aphteuse', date: '2025-07-04T12:00:00.000Z', batchNumber: 'FA-102', notes: 'Rappel requis' },
  { id: 'v3', animalId: 'MA-39401', vaccineName: 'Brucellose', date: '2025-03-10T12:00:00.000Z', batchNumber: 'BR-409' },
  { id: 'v4', animalId: 'MA-88491', vaccineName: 'Peste des petits ruminants (PPR)', date: '2025-02-10T12:00:00.000Z', batchNumber: 'LOT-998A' },
];

const PRELOADED_LISTINGS: Listing[] = [
  {
    id: 'l1',
    animalId: 'MA-39401',
    title: 'Bélier Beni Guil ممتاز لعيد الأضحى',
    price: 5500,
    location: 'Oujda',
    breed: 'Beni Guil',
    weight: 72,
    description: 'كبش سلالة بني غيل حرة، علف طبيعي 100%، صحة ممتازة وخالي من أي عيوب.',
    createdAt: '2025-07-01T12:00:00.000Z',
    sellerName: 'Mohamed El Haouzi',
    sellerPhone: '06 12 34 56 78',
    isSold: false,
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'l2',
    title: 'خروف صردي أصيل للبيع',
    price: 6000,
    location: 'Settat',
    breed: 'Sardi',
    weight: 65,
    description: 'خروف الصردي كسابي تبارك الله، تالي السن ومثالي للتربية أو الأضحية.',
    createdAt: '2025-07-03T12:00:00.000Z',
    sellerName: 'El Hadj Bouchaib',
    sellerPhone: '06 99 88 77 66',
    isSold: false,
    image: 'https://images.unsplash.com/photo-1484557985045-edf25e08da73?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'l3',
    title: 'عنزة سلالة الألبين حلوبة',
    price: 2500,
    location: 'Chefchaouen',
    breed: 'Alpine',
    weight: 35,
    description: 'ماعز ألبين أصيل، حليب وفير وصحة ممتازة جداً.',
    createdAt: '2025-07-05T12:00:00.000Z',
    sellerName: 'Abdessalam',
    sellerPhone: '06 55 44 33 22',
    isSold: false,
    image: 'https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?auto=format&fit=crop&q=80&w=600',
  }
];

export default function App() {
  // Lang state
  const [currentLanguage, setLanguageState] = React.useState<Language>(() => {
    const saved = localStorage.getItem('fellah_lang');
    return (saved as Language) || 'ar';
  });

  // Navigation tab state
  const [currentTab, setTab] = React.useState<string>('home');

  // Authenticated farmer state
  const [user, setUser] = React.useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('fellah_user');
    if (saved) return JSON.parse(saved);
    // Default logged in for beautiful playground experience
    return PRELOADED_USER;
  });

  // Livestock, Weights, Vaccines, Listings states
  const [animals, setAnimals] = React.useState<Animal[]>(() => {
    const saved = localStorage.getItem('fellah_animals');
    return saved ? JSON.parse(saved) : PRELOADED_ANIMALS;
  });

  const [weightRecords, setWeightRecords] = React.useState<WeightRecord[]>(() => {
    const saved = localStorage.getItem('fellah_weights');
    return saved ? JSON.parse(saved) : PRELOADED_WEIGHTS;
  });

  const [vaccineRecords, setVaccineRecords] = React.useState<VaccineRecord[]>(() => {
    const saved = localStorage.getItem('fellah_vaccines');
    return saved ? JSON.parse(saved) : PRELOADED_VACCINES;
  });

  const [listings, setListings] = React.useState<Listing[]>(() => {
    const saved = localStorage.getItem('fellah_listings');
    return saved ? JSON.parse(saved) : PRELOADED_LISTINGS;
  });

  // Modals visibility state
  const [authModalOpen, setAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<'login' | 'signup'>('login');
  const [addAnimalOpen, setAddAnimalOpen] = React.useState(false);
  const [addWeightOpen, setAddWeightOpen] = React.useState(false);
  const [addVaccineOpen, setAddVaccineOpen] = React.useState(false);

  // Auto-adapt language direction and attributes on load/switch
  React.useEffect(() => {
    document.documentElement.dir = (currentLanguage === 'ar' || currentLanguage === 'darija') ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLanguage;
    localStorage.setItem('fellah_lang', currentLanguage);
  }, [currentLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Synchronizers to localStorage
  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('fellah_user', JSON.stringify(profile));
  };

  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('fellah_user');
    setTab('home');
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('fellah_user', JSON.stringify(profile));
  };

  const handleAddAnimal = (newAnimal: Omit<Animal, 'createdAt'>) => {
    const createdAnimal: Animal = {
      ...newAnimal,
      createdAt: new Date().toISOString(),
    };
    const updated = [createdAnimal, ...animals];
    setAnimals(updated);
    localStorage.setItem('fellah_animals', JSON.stringify(updated));

    // Also add an initial weight log
    const initialWeightRecord: WeightRecord = {
      id: `w_${Date.now()}`,
      animalId: newAnimal.id,
      weight: newAnimal.weight,
      date: new Date().toISOString(),
      notes: translations[currentLanguage].startingWeight,
    };
    const updatedWeights = [initialWeightRecord, ...weightRecords];
    setWeightRecords(updatedWeights);
    localStorage.setItem('fellah_weights', JSON.stringify(updatedWeights));
  };

  const handleAddWeightRecord = (animalId: string, weight: number, notes?: string) => {
    const record: WeightRecord = {
      id: `w_${Date.now()}`,
      animalId,
      weight,
      date: new Date().toISOString(),
      notes,
    };
    const updatedWeights = [record, ...weightRecords];
    setWeightRecords(updatedWeights);
    localStorage.setItem('fellah_weights', JSON.stringify(updatedWeights));

    // Update animal's current weight in the list
    const updatedAnimals = animals.map(a => {
      if (a.id === animalId) {
        return { ...a, weight };
      }
      return a;
    });
    setAnimals(updatedAnimals);
    localStorage.setItem('fellah_animals', JSON.stringify(updatedAnimals));
  };

  const handleAddVaccineRecord = (animalId: string, vaccineName: string, batchNumber?: string, notes?: string) => {
    const record: VaccineRecord = {
      id: `v_${Date.now()}`,
      animalId,
      vaccineName,
      date: new Date().toISOString(),
      batchNumber,
      notes,
    };
    const updatedVaccines = [record, ...vaccineRecords];
    setVaccineRecords(updatedVaccines);
    localStorage.setItem('fellah_vaccines', JSON.stringify(updatedVaccines));
  };

  const handleDeleteAnimal = (id: string) => {
    const filtered = animals.filter(a => a.id !== id);
    setAnimals(filtered);
    localStorage.setItem('fellah_animals', JSON.stringify(filtered));

    // Cleanup weights and vaccines associated
    const filteredWeights = weightRecords.filter(w => w.animalId !== id);
    setWeightRecords(filteredWeights);
    localStorage.setItem('fellah_weights', JSON.stringify(filteredWeights));

    const filteredVaccines = vaccineRecords.filter(v => v.animalId !== id);
    setVaccineRecords(filteredVaccines);
    localStorage.setItem('fellah_vaccines', JSON.stringify(filteredVaccines));
  };

  const handleAddListing = (listingData: Omit<Listing, 'id' | 'createdAt' | 'isSold'>) => {
    const newListing: Listing = {
      ...listingData,
      id: `l_${Date.now()}`,
      createdAt: new Date().toISOString(),
      isSold: false,
    };
    const updated = [newListing, ...listings];
    setListings(updated);
    localStorage.setItem('fellah_listings', JSON.stringify(updated));
  };

  const handleMarkAsSold = (id: string) => {
    const updated = listings.map(l => {
      if (l.id === id) {
        return { ...l, isSold: true };
      }
      return l;
    });
    setListings(updated);
    localStorage.setItem('fellah_listings', JSON.stringify(updated));
  };

  // Open auth popup
  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-on-background font-sans flex flex-col justify-between select-none">
      {/* Top Navigation Bar */}
      <Header
        currentLanguage={currentLanguage}
        setLanguage={setLanguage}
        currentTab={currentTab}
        setTab={setTab}
        user={user}
        onSignOut={handleSignOut}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {currentTab === 'home' && (
          <div className="space-y-16">
            <Hero
              currentLanguage={currentLanguage}
              onOpenAuth={handleOpenAuth}
              setTab={setTab}
            />
            <Features
              currentLanguage={currentLanguage}
              setTab={setTab}
            />
          </div>
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            currentLanguage={currentLanguage}
            animals={animals}
            weightRecords={weightRecords}
            vaccineRecords={vaccineRecords}
            listings={listings}
            onAddAnimalClick={() => setAddAnimalOpen(true)}
            onAddWeightClick={() => setAddWeightOpen(true)}
            onAddVaccineClick={() => setAddVaccineOpen(true)}
          />
        )}

        {currentTab === 'animals' && (
          <AnimalsView
            currentLanguage={currentLanguage}
            animals={animals}
            weightRecords={weightRecords}
            vaccineRecords={vaccineRecords}
            onAddAnimalClick={() => setAddAnimalOpen(true)}
            onAddWeightRecord={handleAddWeightRecord}
            onAddVaccineRecord={handleAddVaccineRecord}
            onDeleteAnimal={handleDeleteAnimal}
            onTransitionToMarketplace={(animal) => {
              // Smooth transition to marketplace view with animal preloaded!
              setTab('listings');
              // Let the user create listing easily
            }}
          />
        )}

        {currentTab === 'listings' && (
          <ListingsView
            currentLanguage={currentLanguage}
            listings={listings}
            onAddListing={handleAddListing}
            onMarkAsSold={handleMarkAsSold}
            user={user}
          />
        )}

        {currentTab === 'profile' && user && (
          <ProfileView
            currentLanguage={currentLanguage}
            user={user}
            onUpdateProfile={handleUpdateProfile}
            onSignOut={handleSignOut}
          />
        )}
      </main>

      {/* Bottom Footer Area */}
      <Footer currentLanguage={currentLanguage} />

      {/* Auth Modal overlay */}
      <AuthModal
        currentLanguage={currentLanguage}
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        mode={authModalMode}
        setMode={setAuthModalMode}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Add Animal Modal Form */}
      <AddAnimalModal
        currentLanguage={currentLanguage}
        isOpen={addAnimalOpen}
        onClose={() => setAddAnimalOpen(false)}
        onAddAnimal={handleAddAnimal}
      />

      {/* Add Weight Modal Form */}
      <AddWeightModal
        currentLanguage={currentLanguage}
        isOpen={addWeightOpen}
        onClose={() => setAddWeightOpen(false)}
        animals={animals}
        onAddWeightRecord={handleAddWeightRecord}
      />

      {/* Add Vaccine Modal Form */}
      <AddVaccineModal
        currentLanguage={currentLanguage}
        isOpen={addVaccineOpen}
        onClose={() => setAddVaccineOpen(false)}
        animals={animals}
        onAddVaccineRecord={handleAddVaccineRecord}
      />
    </div>
  );
}
