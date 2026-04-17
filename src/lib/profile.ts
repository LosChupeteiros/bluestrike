import { z } from "zod";

export const INITIAL_ELO = 1000;

export const IN_GAME_ROLE_VALUES = [
  "awper",
  "igl",
  "entry-fragger",
  "rifler",
  "lurker",
  "support",
  "coach",
] as const;

export type InGameRole = (typeof IN_GAME_ROLE_VALUES)[number];

export const IN_GAME_ROLES: Array<{
  value: InGameRole;
  label: string;
  description: string;
}> = [
  {
    value: "awper",
    label: "AWP",
    description: "Busca picks de impacto e controla ritmo com sniper.",
  },
  {
    value: "igl",
    label: "IGL",
    description: "Chama o jogo, ajusta o plano e dita a leitura tatica.",
  },
  {
    value: "entry-fragger",
    label: "Entry",
    description: "Abre espaco, entra primeiro e puxa as trocas duras.",
  },
  {
    value: "rifler",
    label: "Rifler",
    description: "Consistencia no rifle, trocas e controle de round.",
  },
  {
    value: "lurker",
    label: "Lurker",
    description: "Joga em timing, flank e pressao fora do radar.",
  },
  {
    value: "support",
    label: "Support",
    description: "Sustenta setups, utilitarios e o coletivo do time.",
  },
  {
    value: "coach",
    label: "Coach",
    description: "Estrutura a equipe, leitura de jogo e preparacao.",
  },
];

export interface UserProfile {
  id: string;
  publicId: number;
  steamId: string;
  steamPersonaName: string;
  steamAvatarUrl: string | null;
  steamProfileUrl: string | null;
  steamLevel: number;
  elo: number;
  fullName: string | null;
  cpf: string | null;
  phone: string | null;
  birthDate: string | null;
  email: string | null;
  bio: string | null;
  inGameRole: InGameRole | null;
  isAdmin: boolean;
  createdAt: string;
  updatedAt: string;
  // Faceit integration
  faceitId: string | null;
  faceitNickname: string | null;
  faceitAvatar: string | null;
  faceitElo: number | null;
  faceitLevel: number | null;
  faceitTeamIds: string[] | null;
  // Faceit lifetime stats (cached from API, refreshed periodically)
  faceitKdRatio: number | null;
  faceitWinStreak: number | null;
  faceitMatches: number | null;
  faceitWinRate: number | null;
  faceitHsRate: number | null;
  faceitStatsSyncedAt: string | null;
}

export const REQUIRED_PROFILE_FIELDS = [
  "fullName",
  "cpf",
  "phone",
  "birthDate",
  "email",
] as const satisfies ReadonlyArray<keyof UserProfile>;

export const ELO_BANDS = [
  {
    key: "bronze",
    label: "Bronze",
    min: 0,
    max: 999,
    description: "Entrada no competitivo e adaptacao ao ritmo dos campeonatos.",
    accentClass: "text-orange-400",
    badgeVariant: "upcoming" as const,
  },
  {
    key: "silver",
    label: "Silver",
    min: 1000,
    max: 1299,
    description: "Base competitiva da plataforma. Todo jogador novo comeca aqui.",
    accentClass: "text-gray-300",
    badgeVariant: "finished" as const,
  },
  {
    key: "gold",
    label: "Gold",
    min: 1300,
    max: 1599,
    description: "Jogador consolidado, leitura mais limpa e boa consistencia.",
    accentClass: "text-yellow-400",
    badgeVariant: "gold" as const,
  },
  {
    key: "platinum",
    label: "Platinum",
    min: 1600,
    max: 1899,
    description: "Perfil forte de campeonato, impacto regular e boa tomada de decisao.",
    accentClass: "text-cyan-400",
    badgeVariant: "ongoing" as const,
  },
  {
    key: "diamond",
    label: "Diamond",
    min: 1900,
    max: 2199,
    description: "Faixa de alto nivel, muito acima da media da fila competitiva.",
    accentClass: "text-purple-400",
    badgeVariant: "purple" as const,
  },
  {
    key: "elite",
    label: "Elite",
    min: 2200,
    max: Number.POSITIVE_INFINITY,
    description: "Topo do ecossistema BlueStrike, briga direta com a elite do hub.",
    accentClass: "text-[var(--primary)]",
    badgeVariant: "default" as const,
  },
] as const;

const BRAZIL_DDD_CODES = new Set([
  "11", "12", "13", "14", "15", "16", "17", "18", "19",
  "21", "22", "24", "27", "28",
  "31", "32", "33", "34", "35", "37", "38",
  "41", "42", "43", "44", "45", "46",
  "47", "48", "49",
  "51", "53", "54", "55",
  "61", "62", "63", "64", "65", "66", "67", "68", "69",
  "71", "73", "74", "75", "77", "79",
  "81", "82", "83", "84", "85", "86", "87", "88", "89",
  "91", "92", "93", "94", "95", "96", "97", "98", "99",
]);

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseBirthDateParts(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime()) ||
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day, date };
}

function getTodayUtc() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function isValidBirthDate(value: string) {
  const parts = parseBirthDateParts(value);

  if (!parts || parts.year < 1900) {
    return false;
  }

  return parts.date < getTodayUtc();
}

function isValidCpf(rawValue: string) {
  const cpf = onlyDigits(rawValue);

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  const digits = cpf.split("").map(Number);

  const calcDigit = (sliceLength: number) => {
    const sum = digits
      .slice(0, sliceLength)
      .reduce((accumulator, digit, index) => accumulator + digit * (sliceLength + 1 - index), 0);

    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  return calcDigit(9) === digits[9] && calcDigit(10) === digits[10];
}

function isValidBrazilPhone(rawValue: string) {
  const digits = onlyDigits(rawValue);

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const ddd = digits.slice(0, 2);
  return BRAZIL_DDD_CODES.has(ddd) && digits[2] === "9";
}

export function formatCpf(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "").slice(0, 11);

  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

export function formatPhone(value: string | null | undefined) {
  const digits = onlyDigits(value ?? "").slice(0, 11);

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

export function formatBirthDate(value: string | null | undefined) {
  const parts = value ? parseBirthDateParts(value) : null;

  if (!parts) {
    return null;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(parts.date);
}

export function getProfileAge(value: string | null | undefined) {
  const parts = value ? parseBirthDateParts(value) : null;

  if (!parts) {
    return null;
  }

  const today = new Date();
  let age = today.getUTCFullYear() - parts.year;
  const monthDifference = today.getUTCMonth() + 1 - parts.month;

  if (monthDifference < 0 || (monthDifference === 0 && today.getUTCDate() < parts.day)) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function roleLabel(role: InGameRole | null | undefined) {
  if (!role) return "Não definido";

  return IN_GAME_ROLES.find((item) => item.value === role)?.label ?? "Não definido";
}

export function calculateProfileCompletion(profile: UserProfile) {
  const completed = REQUIRED_PROFILE_FIELDS.filter((field) => Boolean(profile[field])).length;
  return Math.round((completed / REQUIRED_PROFILE_FIELDS.length) * 100);
}

export function isProfileComplete(profile: UserProfile) {
  return calculateProfileCompletion(profile) === 100;
}

export function getMissingRequiredFields(profile: UserProfile) {
  const labels: Record<(typeof REQUIRED_PROFILE_FIELDS)[number], string> = {
    fullName: "Nome completo",
    cpf: "CPF",
    phone: "Celular",
    birthDate: "Data de nascimento",
    email: "E-mail",
  };

  return REQUIRED_PROFILE_FIELDS.filter((field) => !profile[field]).map((field) => labels[field]);
}

export function getPublicDisplayName(profile: Pick<UserProfile, "fullName" | "steamPersonaName">) {
  return profile.fullName?.trim() || profile.steamPersonaName;
}

export function getProfilePath(publicId: number) {
  return `/profile/${publicId}`;
}

export function getEloBand(elo: number) {
  return ELO_BANDS.find((band) => elo >= band.min && elo <= band.max) ?? ELO_BANDS[0];
}

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome completo muito longo.")
    .refine(
      (value) => value.split(/\s+/).filter(Boolean).length >= 2,
      "Informe nome e sobrenome."
    ),
  cpf: z
    .string()
    .transform(onlyDigits)
    .refine((value) => value.length === 11, "CPF precisa ter 11 dígitos.")
    .refine(isValidCpf, "CPF inválido."),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine(isValidBrazilPhone, "Celular inválido. Use DDD + celular com 9 dígitos."),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida.")
    .refine(isValidBirthDate, "Data de nascimento inválida."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, "Informe seu e-mail.")
    .email("E-mail inválido.")
    .max(254, "E-mail muito longo."),
  bio: z
    .string()
    .trim()
    .max(280, "A bio pode ter no máximo 280 caracteres.")
    .optional()
    .transform((value) => value || null),
  inGameRole: z
    .enum(IN_GAME_ROLE_VALUES)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const profileBioSchema = z.object({
  bio: z
    .string()
    .trim()
    .max(280, "A bio pode ter no máximo 280 caracteres.")
    .optional()
    .transform((value) => value || null),
  inGameRole: z
    .enum(IN_GAME_ROLE_VALUES)
    .nullable()
    .optional()
    .transform((value) => value ?? null),
});

export type ProfileBioInput = z.infer<typeof profileBioSchema>;
