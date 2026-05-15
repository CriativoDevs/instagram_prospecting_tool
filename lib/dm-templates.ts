import { ScoredProfile } from "@/types/instagram";

type BusinessType =
  | "barbearia"
  | "salao"
  | "estetica"
  | "unhas"
  | "spa"
  | "tatuagem"
  | "generico";

function detectBusinessType(profile: ScoredProfile): BusinessType {
  const text = [
    profile.biography,
    profile.fullName,
    profile.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (text.match(/tattoo|tatuagem|tatuador|ink|tattoostudio|blackwork|fineline/)) return "tatuagem";
  if (text.match(/barbearia|barbeiro|barber|barbershop|navalha/)) return "barbearia";
  if (text.match(/cabeleireiro|cabeleireira|hairsalon|hairstyle|coloracao|salao|salaodecabelo/)) return "salao";
  if (text.match(/estetica|esteticista|skincare|micropigmentacao|dermopigmentacao|peeling/)) return "estetica";
  if (text.match(/unhas|nails|nailart|manicure|pedicure|gelpolish/)) return "unhas";
  if (text.match(/spa|massagem|wellness|bemestar|relaxamento|holistic/)) return "spa";
  return "generico";
}

const TEMPLATES: Record<BusinessType, (name: string) => string> = {
  barbearia: (name) =>
    `Olá ${name}! Vi o vosso trabalho no Instagram — cortes impecáveis 👏

Desenvolvemos uma plataforma portuguesa de gestão para barbearias — marcações online, gestão de barbeiros, lembretes automáticos por SMS e relatórios de receita, tudo num só lugar.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para saber mais: https://timelyone.today`,

  salao: (name) =>
    `Olá ${name}! Adorei o trabalho do vosso salão no Instagram ✂️

Desenvolvemos uma plataforma portuguesa de gestão para salões de cabeleireiro — marcações online, gestão de equipa, lembretes por SMS e relatórios de receita num só lugar.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para conhecer melhor: https://timelyone.today`,

  estetica: (name) =>
    `Olá ${name}! Vi os vossos tratamentos no Instagram — trabalho de referência ✨

Desenvolvemos uma plataforma portuguesa de gestão para centros de estética — marcações automáticas, ficha de cliente, lembretes por SMS e relatórios num só lugar.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para saber mais: https://timelyone.today`,

  unhas: (name) =>
    `Olá ${name}! Vi os vossos designs no Instagram — que trabalho detalhista 💅

Desenvolvemos uma plataforma portuguesa de gestão para nail studios — marcações online, gestão de clientes recorrentes, lembretes por SMS e controlo de receita.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Saiba mais em: https://timelyone.today`,

  spa: (name) =>
    `Olá ${name}! Vi o vosso espaço no Instagram — que ambiente relaxante 🌿

Desenvolvemos uma plataforma portuguesa de gestão para spas e centros de bem-estar — marcações online, gestão de terapeutas, lembretes automáticos e relatórios de receita.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para conhecer: https://timelyone.today`,

  tatuagem: (name) =>
    `Olá ${name}! Vi o vosso trabalho no Instagram — arte incrível 🖋️

Desenvolvemos uma plataforma portuguesa de gestão para estúdios de tatuagem — marcações online com depósito, gestão de artistas, referências de clientes e agenda visual.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para saber mais: https://timelyone.today`,

  generico: (name) =>
    `Olá ${name}! Vi o vosso trabalho no Instagram e fiquei impressionado 👏

Desenvolvemos uma plataforma portuguesa de gestão para negócios de beleza e bem-estar — marcações automáticas, gestão de equipa, lembretes por SMS e relatórios de receita num só lugar.

Estamos a oferecer 14 dias grátis aos primeiros clientes em troca de feedback honesto. Para conhecer melhor: https://timelyone.today`,
};

export function generateDM(profile: ScoredProfile): string {
  const name = profile.fullName || profile.username;
  const type = detectBusinessType(profile);
  return TEMPLATES[type](name);
}
