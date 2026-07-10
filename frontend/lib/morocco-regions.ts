import type { Locale } from "@/lib/i18n";

export const MOROCCO_REGIONS = {
  "Tanger-Tetouan-Al Hoceima": [
    "Tanger-Assilah",
    "M'diq-Fnideq",
    "Tetouan",
    "Fahs-Anjra",
    "Larache",
    "Al Hoceima",
    "Chefchaouen",
    "Ouezzane",
  ],
  Oriental: [
    "Oujda-Angad",
    "Nador",
    "Driouch",
    "Jerada",
    "Berkane",
    "Taourirt",
    "Guercif",
    "Figuig",
  ],
  "Fes-Meknes": [
    "Fes",
    "Meknes",
    "El Hajeb",
    "Ifrane",
    "Moulay Yacoub",
    "Sefrou",
    "Boulemane",
    "Taounate",
    "Taza",
  ],
  "Rabat-Sale-Kenitra": [
    "Rabat",
    "Sale",
    "Skhirate-Temara",
    "Kenitra",
    "Khemisset",
    "Sidi Kacem",
    "Sidi Slimane",
  ],
  "Beni Mellal-Khenifra": [
    "Beni Mellal",
    "Azilal",
    "Fquih Ben Salah",
    "Khenifra",
    "Khouribga",
  ],
  "Casablanca-Settat": [
    "Casablanca",
    "Mohammedia",
    "Nouaceur",
    "Mediouna",
    "Benslimane",
    "Berrechid",
    "Settat",
    "El Jadida",
    "Sidi Bennour",
  ],
  "Marrakech-Safi": [
    "Marrakech",
    "Chichaoua",
    "Al Haouz",
    "El Kelaa des Sraghna",
    "Essaouira",
    "Rehamna",
    "Safi",
    "Youssoufia",
  ],
  "Draa-Tafilalet": ["Errachidia", "Ouarzazate", "Midelt", "Tinghir", "Zagora"],
  "Souss-Massa": [
    "Agadir-Ida-Ou-Tanane",
    "Inezgane-Ait Melloul",
    "Chtouka-Ait Baha",
    "Taroudant",
    "Tiznit",
    "Tata",
  ],
  "Guelmim-Oued Noun": ["Guelmim", "Assa-Zag", "Tan-Tan", "Sidi Ifni"],
  "Laayoune-Sakia El Hamra": ["Laayoune", "Boujdour", "Tarfaya", "Es-Semara"],
  "Dakhla-Oued Ed-Dahab": ["Oued Ed-Dahab", "Aousserd"],
} as const;

export type MoroccoRegion = keyof typeof MOROCCO_REGIONS;

const regionLabelsAr: Partial<Record<MoroccoRegion, string>> = {
  "Tanger-Tetouan-Al Hoceima": "طنجة - تطوان - الحسيمة",
  Oriental: "الشرق",
  "Fes-Meknes": "فاس - مكناس",
  "Rabat-Sale-Kenitra": "الرباط - سلا - القنيطرة",
  "Beni Mellal-Khenifra": "بني ملال - خنيفرة",
  "Casablanca-Settat": "الدار البيضاء - سطات",
  "Marrakech-Safi": "مراكش - آسفي",
  "Draa-Tafilalet": "درعة - تافيلالت",
  "Souss-Massa": "سوس - ماسة",
  "Guelmim-Oued Noun": "كلميم - واد نون",
  "Laayoune-Sakia El Hamra": "العيون - الساقية الحمراء",
  "Dakhla-Oued Ed-Dahab": "الداخلة - وادي الذهب",
};

export const regionOptions = Object.keys(MOROCCO_REGIONS) as MoroccoRegion[];

export function getProvinceOptions(region: string | null | undefined): readonly string[] {
  if (!region || !(region in MOROCCO_REGIONS)) {
    return [];
  }

  return MOROCCO_REGIONS[region as MoroccoRegion];
}

export function getRegionLabel(region: string, locale: Locale): string {
  if (locale !== "fr" && region in regionLabelsAr) {
    return regionLabelsAr[region as MoroccoRegion] ?? region;
  }

  return region;
}

export function isKnownRegion(region: string): region is MoroccoRegion {
  return region in MOROCCO_REGIONS;
}

