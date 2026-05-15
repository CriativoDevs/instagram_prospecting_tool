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
}

export const DEFAULT_FILTERS: FilterConfig = {
  minFollowers: 200,
  maxFollowers: 5000,
  minPosts: 10,
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
