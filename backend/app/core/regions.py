MOROCCO_REGIONS: dict[str, tuple[str, ...]] = {
    "Tanger-Tetouan-Al Hoceima": (
        "Tanger-Assilah",
        "M'diq-Fnideq",
        "Tetouan",
        "Fahs-Anjra",
        "Larache",
        "Al Hoceima",
        "Chefchaouen",
        "Ouezzane",
    ),
    "Oriental": (
        "Oujda-Angad",
        "Nador",
        "Driouch",
        "Jerada",
        "Berkane",
        "Taourirt",
        "Guercif",
        "Figuig",
    ),
    "Fes-Meknes": (
        "Fes",
        "Meknes",
        "El Hajeb",
        "Ifrane",
        "Moulay Yacoub",
        "Sefrou",
        "Boulemane",
        "Taounate",
        "Taza",
    ),
    "Rabat-Sale-Kenitra": (
        "Rabat",
        "Sale",
        "Skhirate-Temara",
        "Kenitra",
        "Khemisset",
        "Sidi Kacem",
        "Sidi Slimane",
    ),
    "Beni Mellal-Khenifra": (
        "Beni Mellal",
        "Azilal",
        "Fquih Ben Salah",
        "Khenifra",
        "Khouribga",
    ),
    "Casablanca-Settat": (
        "Casablanca",
        "Mohammedia",
        "Nouaceur",
        "Mediouna",
        "Benslimane",
        "Berrechid",
        "Settat",
        "El Jadida",
        "Sidi Bennour",
    ),
    "Marrakech-Safi": (
        "Marrakech",
        "Chichaoua",
        "Al Haouz",
        "El Kelaa des Sraghna",
        "Essaouira",
        "Rehamna",
        "Safi",
        "Youssoufia",
    ),
    "Draa-Tafilalet": (
        "Errachidia",
        "Ouarzazate",
        "Midelt",
        "Tinghir",
        "Zagora",
    ),
    "Souss-Massa": (
        "Agadir-Ida-Ou-Tanane",
        "Inezgane-Ait Melloul",
        "Chtouka-Ait Baha",
        "Taroudant",
        "Tiznit",
        "Tata",
    ),
    "Guelmim-Oued Noun": (
        "Guelmim",
        "Assa-Zag",
        "Tan-Tan",
        "Sidi Ifni",
    ),
    "Laayoune-Sakia El Hamra": (
        "Laayoune",
        "Boujdour",
        "Tarfaya",
        "Es-Semara",
    ),
    "Dakhla-Oued Ed-Dahab": (
        "Oued Ed-Dahab",
        "Aousserd",
    ),
}


def list_regions() -> tuple[str, ...]:
    return tuple(MOROCCO_REGIONS.keys())


def list_provinces(region: str) -> tuple[str, ...]:
    return MOROCCO_REGIONS.get(region, ())


def is_valid_region(region: str) -> bool:
    return region in MOROCCO_REGIONS


def is_valid_region_province(region: str, province: str) -> bool:
    return province in MOROCCO_REGIONS.get(region, ())
