// =============================================================================
// BlueStrike — tipos centrais
// Mantidos em sync com supabase/migrations/20260414_teams_tournaments_matches.sql
// =============================================================================

export type TournamentStatus = "upcoming" | "open" | "ongoing" | "finished";
export type TournamentFormat =
  | "single_elimination"
  | "double_elimination"
  | "round_robin"
  | "swiss";
export type MatchStatus = "pending" | "veto" | "live" | "finished" | "cancelled" | "walkover";
export type RegistrationStatus = "pending" | "confirmed" | "eliminated" | "champion" | "withdrawn";
export type TeamMemberRole = "awper" | "igl" | "entry-fragger" | "rifler" | "lurker" | "support" | "coach";
export type NotificationType = "match_start" | "checkin_reminder" | "result" | "system" | "team_invite";

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface Team {
  id: string;
  slug: string;
  name: string;
  tag: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  joinCode: string;
  /** undefined em leituras públicas — nunca exposto ao cliente */
  passwordHash?: string;
  captainId: string;
  isRecruiting: boolean;
  elo: number;
  wins: number;
  losses: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Carregado via join quando necessário */
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  teamId: string;
  profileId: string;
  inGameRole: TeamMemberRole | null;
  isStarter: boolean;
  joinedAt: string;
  /** Carregado via join quando necessário */
  profile?: import("@/lib/profile").UserProfile;
}

// ---------------------------------------------------------------------------
// Tournament
// ---------------------------------------------------------------------------

export interface PrizeBreakdownEntry {
  place: string;
  amount: number; // centavos BRL
}

export interface Tournament {
  id: string;
  name: string;
  description: string | null;
  rules: string[];
  prizeTotal: number;       // centavos BRL
  prizeBreakdown: PrizeBreakdownEntry[];
  bannerUrl: string | null;
  entryFee?: number;
  status: TournamentStatus;
  format: TournamentFormat;
  maxTeams: number;
  minElo: number | null;
  maxElo: number | null;
  checkInRequired: boolean;
  checkInWindowMins: number;
  region: string;
  organizerId: string | null;
  organizerName: string;
  featured: boolean;
  tags: string[];
  registrationStarts: string | null;
  registrationEnds: string | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Carregado via join quando necessário */
  registrations?: TournamentRegistration[];
  registeredTeamsCount?: number;
}

export interface TournamentRegistration {
  id: string;
  tournamentId: string;
  teamId: string;
  status: RegistrationStatus;
  checkedIn: boolean;
  checkedInAt: string | null;
  registeredAt: string;
  paymentStatus?: "pending" | "paid" | "failed" | "refunded";
  paymentAmount?: number;
  paymentReference?: string | null;
  paymentMethod?: string | null;
  /** Carregado via join quando necessário */
  team?: Team;
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export interface Match {
  id: string;
  tournamentId: string | null;
  team1Id: string | null;
  team2Id: string | null;
  round: number;
  matchIndex: number;
  boType: 1 | 3 | 5;
  status: MatchStatus;
  winnerId: string | null;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  /** Carregado via join quando necessário */
  team1?: Team;
  team2?: Team;
  maps?: MatchMap[];
  server?: DathostServer;
}

export interface MatchMap {
  id: string;
  matchId: string;
  mapName: string;
  mapOrder: number;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  status: "pending" | "live" | "finished";
  playedAt: string | null;
  /** Carregado via join quando necessário */
  playerStats?: MatchPlayerStats[];
}

export interface MatchPlayerStats {
  id: string;
  matchMapId: string;
  profileId: string;
  teamId: string;
  kills: number;
  deaths: number;
  assists: number;
  hsCount: number;
  adr: number | null;
  rating: number | null;
}

export interface MapVeto {
  id: string;
  matchId: string;
  teamId: string;
  action: "ban" | "pick";
  mapName: string;
  vetoOrder: number;
  pickedSide: "ct" | "t" | null;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Dathost
// ---------------------------------------------------------------------------

export interface DathostServer {
  id: string;
  matchId: string;
  dathostId: string;
  ip: string;
  port: number;
  gotvPort: number | null;
  /** Nunca exposto ao cliente — apenas no servidor */
  rconPassword?: string;
  connectString: string | null;
  gotvString: string | null;
  demoUrl: string | null;
  status: "provisioning" | "ready" | "live" | "finished" | "terminated";
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  profileId: string;
  type: NotificationType;
  title: string;
  message: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Badges
// ---------------------------------------------------------------------------

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  createdAt: string;
}

export interface PlayerBadge {
  id: string;
  profileId: string;
  badgeId: string;
  earnedAt: string;
  badge?: Badge;
}

// ---------------------------------------------------------------------------
// ELO
// ---------------------------------------------------------------------------

export interface EloHistoryEntry {
  id: string;
  profileId: string;
  matchId: string | null;
  eloBefore: number;
  eloAfter: number;
  delta: number;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Ranking
// ---------------------------------------------------------------------------

export interface RankingEntry {
  position: number;
  profileId: string;
  nickname: string;
  avatarUrl: string | null;
  elo: number;
  wins: number;
  losses: number;
  winRate: number;
  kdRatio: number;
  hsRate: number;
  eloChange: number; // delta da última semana
  tournamentsPlayed: number;
}

// ---------------------------------------------------------------------------
// Bracket
// ---------------------------------------------------------------------------

export interface BracketNode {
  id: string;
  round: number;
  position: number;
  match?: Match;
  team1?: Team;
  team2?: Team;
  winnerId?: string;
}
