import { INITIAL_ELO, type InGameRole, type UserProfile } from "@/lib/profile";
import type { Team, TeamMemberRole } from "@/types";

const DEFAULT_AVATAR = "https://avatars.steamstatic.com/b5bd56c1aa4644a474a2e4972be27ef9e82e517e_full.jpg";

interface MockProfileSeed {
  publicId: number;
  steamPersonaName: string;
  fullName: string;
  steamId: string;
  role: InGameRole;
  elo: number;
  birthDate: string;
  bio: string;
  avatar?: string;
  isAdmin?: boolean;
  stats: {
    winRate: number;
    kdRatio: number;
    hsRate: number;
  };
}

export interface MockRecentMatchSummary {
  id: string;
  tournamentName: string;
  map: string;
  playedAt: string;
  status: "finished" | "live";
  team1: {
    name: string;
    tag: string;
    score: number;
    elo: number;
  };
  team2: {
    name: string;
    tag: string;
    score: number;
    elo: number;
  };
}

export interface MockMatchPlayerLine {
  publicId: number;
  nickname: string;
  avatar: string;
  elo: number;
  kills: number;
  deaths: number;
  assists: number;
  hsRate: number;
}

export interface MockMatchDetail {
  id: string;
  tournamentName: string;
  scheduledAt: string;
  map: string;
  status: "finished" | "live";
  team1: {
    name: string;
    tag: string;
    score: number;
    elo: number;
    players: MockMatchPlayerLine[];
  };
  team2: {
    name: string;
    tag: string;
    score: number;
    elo: number;
    players: MockMatchPlayerLine[];
  };
}

const mockProfileSeeds: MockProfileSeed[] = [
  {
    publicId: 1,
    steamPersonaName: "IsacChupeta",
    fullName: "Isac Nogueira",
    steamId: "76561198842144251",
    role: "igl",
    elo: 1675,
    birthDate: "2002-08-15",
    bio: "IGL focado em ritmo, leitura de round e comunicação limpa para campeonato.",
    stats: {
      winRate: 68,
      kdRatio: 1.22,
      hsRate: 47,
    },
  },
  {
    publicId: 2,
    steamPersonaName: "RafaAWP",
    fullName: "Rafael Moraes",
    steamId: "76561199000000002",
    role: "awper",
    elo: 1710,
    birthDate: "1999-05-11",
    bio: "AWP agressiva, muita confiança em pick inicial e retake.",
    stats: {
      winRate: 64,
      kdRatio: 1.19,
      hsRate: 36,
    },
  },
  {
    publicId: 3,
    steamPersonaName: "vntz",
    fullName: "Vinícius Teixeira",
    steamId: "76561199000000003",
    role: "entry-fragger",
    elo: 1620,
    birthDate: "2001-11-03",
    bio: "Entry explosivo, puxa espaço e vive de trade curta e impacto.",
    stats: {
      winRate: 61,
      kdRatio: 1.14,
      hsRate: 52,
    },
  },
  {
    publicId: 4,
    steamPersonaName: "lucax",
    fullName: "Lucas Andrade",
    steamId: "76561199000000004",
    role: "rifler",
    elo: 1590,
    birthDate: "2000-02-25",
    bio: "Rifler de confiança para mid round, clutch e pressão constante.",
    stats: {
      winRate: 60,
      kdRatio: 1.11,
      hsRate: 49,
    },
  },
  {
    publicId: 5,
    steamPersonaName: "naka",
    fullName: "Renato Nakamura",
    steamId: "76561199000000005",
    role: "support",
    elo: 1555,
    birthDate: "1998-10-19",
    bio: "Support com utilitário forte, leitura de exec e muita disciplina.",
    stats: {
      winRate: 59,
      kdRatio: 1.03,
      hsRate: 42,
    },
  },
  {
    publicId: 6,
    steamPersonaName: "M4theus",
    fullName: "Matheus Costa",
    steamId: "76561199000000006",
    role: "igl",
    elo: 1640,
    birthDate: "2001-06-08",
    bio: "IGL de cadência alta, gosta de variar defaults e forçar adaptação.",
    stats: {
      winRate: 62,
      kdRatio: 1.10,
      hsRate: 44,
    },
  },
  {
    publicId: 7,
    steamPersonaName: "caioz",
    fullName: "Caio Souza",
    steamId: "76561199000000007",
    role: "awper",
    elo: 1605,
    birthDate: "2003-01-30",
    bio: "AWP paciente, melhor em setups longos e controle de abertura.",
    stats: {
      winRate: 58,
      kdRatio: 1.08,
      hsRate: 34,
    },
  },
  {
    publicId: 8,
    steamPersonaName: "brn",
    fullName: "Bruno Lima",
    steamId: "76561199000000008",
    role: "entry-fragger",
    elo: 1580,
    birthDate: "2002-12-02",
    bio: "Entry vertical, gosta de puxar ritmo e romper setup cedo.",
    stats: {
      winRate: 56,
      kdRatio: 1.05,
      hsRate: 51,
    },
  },
  {
    publicId: 9,
    steamPersonaName: "dzz",
    fullName: "Diego Zanetti",
    steamId: "76561199000000009",
    role: "lurker",
    elo: 1545,
    birthDate: "1999-09-14",
    bio: "Lurker de tempo, clutch e pressão lateral nos finais de round.",
    stats: {
      winRate: 57,
      kdRatio: 1.07,
      hsRate: 46,
    },
  },
  {
    publicId: 10,
    steamPersonaName: "pedrin",
    fullName: "Pedro Henrique Rocha",
    steamId: "76561199000000010",
    role: "support",
    elo: 1520,
    birthDate: "2004-03-21",
    bio: "Support com foco em utilidade, pós-plant e setups defensivos.",
    stats: {
      winRate: 55,
      kdRatio: 1.01,
      hsRate: 41,
    },
  },
];

function seedToUserProfile(seed: MockProfileSeed): UserProfile {
  return {
    id: `mock-profile-${seed.publicId}`,
    publicId: seed.publicId,
    steamId: seed.steamId,
    steamPersonaName: seed.steamPersonaName,
    steamAvatarUrl: seed.avatar ?? DEFAULT_AVATAR,
    steamProfileUrl: `https://steamcommunity.com/profiles/${seed.steamId}`,
    steamLevel: 42,
    elo: seed.elo,
    fullName: seed.fullName,
    cpf: null,
    phone: null,
    email: null,
    birthDate: seed.birthDate,
    bio: seed.bio,
    inGameRole: seed.role,
    isAdmin: Boolean(seed.isAdmin),
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-04-14T00:00:00.000Z",
    faceitId: null,
    faceitNickname: null,
    faceitAvatar: null,
    faceitElo: null,
    faceitLevel: null,
    faceitTeamIds: null,
    faceitKdRatio: null,
    faceitWinStreak: null,
    faceitMatches: null,
    faceitWinRate: null,
    faceitHsRate: null,
    faceitStatsSyncedAt: null,
  };
}

const mockProfiles = mockProfileSeeds.map(seedToUserProfile);

export const mockTeamCreationCandidates = mockProfileSeeds.map((seed) => ({
  publicId: seed.publicId,
  nickname: seed.steamPersonaName,
  role: seed.role,
  elo: seed.elo,
  avatar: seed.avatar ?? DEFAULT_AVATAR,
}));

const mockTeamsByProfileId: Record<number, Team[]> = {
  1: [
    {
      id: "mock-team-bsp",
      slug: "bluestrike-prime",
      name: "BlueStrike Prime",
      tag: "BSP",
      description: null,
      logoUrl: null,
      bannerUrl: null,
      joinCode: "bsp-mock",
      captainId: "mock-profile-1",
      isRecruiting: false,
      elo: 1640,
      wins: 19,
      losses: 7,
      isActive: true,
      createdAt: "2026-02-10",
      updatedAt: "2026-02-10",
      members: mockProfileSeeds.slice(0, 5).map((seed, i) => ({
        id: `bsp-member-${i + 1}`,
        teamId: "mock-team-bsp",
        profileId: `mock-profile-${seed.publicId}`,
        inGameRole: seed.role as TeamMemberRole,
        isStarter: true,
        joinedAt: "2026-02-10",
        profile: seedToUserProfile(seed),
      })),
    },
  ],
};

const mockRecentMatchesByProfileId: Record<number, MockRecentMatchSummary[]> = {
  1: [
    {
      id: "bs-match-001",
      tournamentName: "BlueStrike Open #12",
      map: "Mirage",
      playedAt: "2026-04-13T21:00:00",
      status: "finished",
      team1: {
        name: "BlueStrike Prime",
        tag: "BSP",
        score: 16,
        elo: 1612,
      },
      team2: {
        name: "Arena Wolves",
        tag: "AWV",
        score: 13,
        elo: 1589,
      },
    },
    {
      id: "bs-match-002",
      tournamentName: "Copa Desafio Brasil",
      map: "Inferno",
      playedAt: "2026-04-09T20:30:00",
      status: "finished",
      team1: {
        name: "BlueStrike Prime",
        tag: "BSP",
        score: 11,
        elo: 1604,
      },
      team2: {
        name: "Nova Tática",
        tag: "NVT",
        score: 16,
        elo: 1630,
      },
    },
    {
      id: "bs-match-003",
      tournamentName: "Liga Radar",
      map: "Anubis",
      playedAt: "2026-04-06T19:40:00",
      status: "finished",
      team1: {
        name: "BlueStrike Prime",
        tag: "BSP",
        score: 16,
        elo: 1594,
      },
      team2: {
        name: "Delta Force",
        tag: "DLT",
        score: 8,
        elo: 1510,
      },
    },
  ],
};

const mockMatchDetails: MockMatchDetail[] = [
  {
    id: "bs-match-001",
    tournamentName: "BlueStrike Open #12",
    scheduledAt: "2026-04-13T21:00:00",
    map: "Mirage",
    status: "finished",
    team1: {
      name: "BlueStrike Prime",
      tag: "BSP",
      score: 16,
      elo: 1612,
      players: [
        { publicId: 1, nickname: "IsacChupeta", avatar: DEFAULT_AVATAR, elo: 1675, kills: 24, deaths: 16, assists: 8, hsRate: 45 },
        { publicId: 2, nickname: "RafaAWP", avatar: DEFAULT_AVATAR, elo: 1710, kills: 21, deaths: 14, assists: 5, hsRate: 33 },
        { publicId: 3, nickname: "vntz", avatar: DEFAULT_AVATAR, elo: 1620, kills: 19, deaths: 18, assists: 6, hsRate: 58 },
        { publicId: 4, nickname: "lucax", avatar: DEFAULT_AVATAR, elo: 1590, kills: 17, deaths: 17, assists: 4, hsRate: 49 },
        { publicId: 5, nickname: "naka", avatar: DEFAULT_AVATAR, elo: 1555, kills: 13, deaths: 19, assists: 9, hsRate: 38 },
      ],
    },
    team2: {
      name: "Arena Wolves",
      tag: "AWV",
      score: 13,
      elo: 1589,
      players: [
        { publicId: 6, nickname: "M4theus", avatar: DEFAULT_AVATAR, elo: 1640, kills: 22, deaths: 18, assists: 7, hsRate: 41 },
        { publicId: 7, nickname: "caioz", avatar: DEFAULT_AVATAR, elo: 1605, kills: 20, deaths: 17, assists: 3, hsRate: 29 },
        { publicId: 8, nickname: "brn", avatar: DEFAULT_AVATAR, elo: 1580, kills: 18, deaths: 20, assists: 6, hsRate: 54 },
        { publicId: 9, nickname: "dzz", avatar: DEFAULT_AVATAR, elo: 1545, kills: 15, deaths: 18, assists: 5, hsRate: 47 },
        { publicId: 10, nickname: "pedrin", avatar: DEFAULT_AVATAR, elo: 1520, kills: 11, deaths: 21, assists: 10, hsRate: 36 },
      ],
    },
  },
];

export function getMockProfileByPublicId(publicId: number) {
  return mockProfiles.find((profile) => profile.publicId === publicId) ?? null;
}

export function getMockProfileStats(publicId: number) {
  return mockProfileSeeds.find((seed) => seed.publicId === publicId)?.stats ?? null;
}

export function getMockTeamsForProfile(publicId: number) {
  return mockTeamsByProfileId[publicId] ?? [];
}

export function getMockRecentMatchesForProfile(publicId: number) {
  return mockRecentMatchesByProfileId[publicId] ?? [];
}

export function getMockMatchDetail(matchId: string) {
  return mockMatchDetails.find((match) => match.id === matchId) ?? null;
}

export function getFallbackProfileStats(profile: Pick<UserProfile, "elo">) {
  const ratingDelta = Math.max(profile.elo - INITIAL_ELO, 0);

  return {
    winRate: 50 + Math.min(Math.round(ratingDelta / 25), 24),
    kdRatio: Number((1 + ratingDelta / 2500).toFixed(2)),
    hsRate: 40 + Math.min(Math.round(ratingDelta / 40), 18),
  };
}
