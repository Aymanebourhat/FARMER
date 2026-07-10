export type AnimalType = 'Sheep' | 'Goat' | 'Cattle';

export interface Animal {
  id: string;
  name: string;
  type: AnimalType;
  breed: string;
  gender: 'Male' | 'Female';
  origin: string;
  birthDate: string;
  status: 'Excellent' | 'Good' | 'Fair' | 'Under treatment';
  weight: number;
  parentage: {
    fatherId?: string;
    motherId?: string;
  };
  createdAt: string;
}

export interface WeightRecord {
  id: string;
  animalId: string;
  weight: number;
  date: string;
  notes?: string;
}

export interface VaccineRecord {
  id: string;
  animalId: string;
  vaccineName: string;
  date: string;
  batchNumber?: string;
  notes?: string;
}

export interface Listing {
  id: string;
  animalId?: string; // Optional if created from scratch, but can link to real animal
  title: string;
  price: number; // in Moroccan Dirhams (MAD)
  location: string;
  description: string;
  createdAt: string;
  sellerName: string;
  sellerPhone: string;
  isSold: boolean;
  image?: string;
  breed?: string;
  weight?: number;
}

export interface UserProfile {
  fullName: string;
  farmName: string;
  phone: string;
  location: string;
  email?: string;
  language: 'ar' | 'fr' | 'en' | 'darija';
  region?: string;
  province?: string;
  commune?: string;
  livestockType?: 'Sheep' | 'Cow' | 'Goat' | 'Camel' | 'Other';
  farmSize?: string;
  onboardingComplete?: boolean;
}

export type Language = 'ar' | 'fr' | 'en' | 'darija';
