export interface Niche {
  id: string;
  label: string;
  emoji: string;
  hashtags: string[];
}

export interface FilterConfig {
  minFollowers: number;
  maxFollowers: number;
  minPosts: number;
  maxProfiles: number;
  searchMode: 'hashtag' | 'geo';
  address?: string;
  radius?: number;
  countryCode?: string;
}

export const GEO_COUNTRIES = [
  { code: "pt", label: "Portugal", flag: "🇵🇹" },
  { code: "br", label: "Brasil", flag: "🇧🇷" },
  { code: "es", label: "Espanha", flag: "🇪🇸" },
  { code: "gb", label: "Reino Unido", flag: "🇬🇧" },
  { code: "fr", label: "França", flag: "🇫🇷" },
  { code: "de", label: "Alemanha", flag: "🇩🇪" },
  { code: "us", label: "EUA", flag: "🇺🇸" },
] as const;

export const GEO_RADIUS_OPTIONS = [1, 5, 10, 25, 50] as const;
export type GeoRadius = typeof GEO_RADIUS_OPTIONS[number];

export const DEFAULT_FILTERS: FilterConfig = {
  minFollowers: 200,
  maxFollowers: 5000,
  minPosts: 10,
  maxProfiles: 50,
  searchMode: 'hashtag',
  radius: 10,
  countryCode: 'pt',
};

export const NICHES: Niche[] = [
  {
    id: "barbearia",
    label: "Barbearia",
    emoji: "💈",
    hashtags: [
      "barbearia", "barbeiro", "barber", "barbershop", "barberlife",
      "navalha", "barbeirosbrasil", "barberstyle", "classicbarber", "barbersofinstagram",
    ],
  },
  {
    id: "cabelo",
    label: "Cabelo & Salão",
    emoji: "✂️",
    hashtags: [
      "cabeleireiro", "cabeleireira", "salaobeleza", "hairsalon", "hairstyle",
      "haircut", "coloracao", "escova", "alisamento", "salaodecabelo",
    ],
  },
  {
    id: "estetica",
    label: "Estética",
    emoji: "✨",
    hashtags: [
      "estetica", "esteticista", "skincare", "micropigmentacao", "tratamentofacial",
      "beleza", "limpezadepele", "peeling", "aesthetics", "dermopigmentacao",
    ],
  },
  {
    id: "unhas",
    label: "Unhas",
    emoji: "💅",
    hashtags: [
      "unhas", "unhasdecoradas", "nails", "nailart", "manicure",
      "naildesign", "gelpolish", "pedicure", "nailstagram", "alongamento",
    ],
  },
  {
    id: "spa",
    label: "Spa & Bem-estar",
    emoji: "🌿",
    hashtags: [
      "spa", "massagem", "wellness", "bemestar", "relaxamento",
      "massage", "terapiaholistica", "reflexologia", "aromaterapia", "ayurveda",
    ],
  },
  {
    id: "tatuagem",
    label: "Tatuagem",
    emoji: "🖋️",
    hashtags: [
      "tatuagem", "tatuador", "tattoo", "tattooartist", "tattoostudio",
      "ink", "blackwork", "fineline", "tattoolife", "tatuagembrasil",
    ],
  },
];
