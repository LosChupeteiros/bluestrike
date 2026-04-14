export type TournamentStatus = "open" | "ongoing" | "finished" | "upcoming";
export type TournamentFormat = "single_elimination" | "double_elimination" | "round_robin" | "swiss";

export interface Tournament {
  id: string;
  name: string;
  description: string;
  prize: number;
  prizeBreakdown?: { place: string; amount: number }[];
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxTeams: number;
  registeredTeams: number;
  status: TournamentStatus;
  format: TournamentFormat;
  game: string;
  banner: string;
  rules: string[];
  featured: boolean;
  checkInRequired: boolean;
  checkInStart?: string;
  organizer: string;
  region: string;
  platform: string;
  tags: string[];
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  logo?: string;
  captain: string;
  members: Player[];
  rank?: number;
  wins: number;
  losses: number;
  createdAt: string;
}

export interface Player {
  id: string;
  steamId?: string;
  googleId?: string;
  nickname: string;
  avatar?: string;
  email: string;
  rank?: number;
  elo: number;
  wins: number;
  losses: number;
  kills: number;
  deaths: number;
  assists: number;
  headshots: number;
  mapsPlayed: number;
  bio?: string;
  country: string;
  createdAt: string;
  badges?: Badge[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  earnedAt: string;
}

export interface Match {
  id: string;
  tournamentId: string;
  round: number;
  team1: Team;
  team2: Team;
  score1?: number;
  score2?: number;
  winner?: string;
  scheduledAt: string;
  playedAt?: string;
  map?: string;
  status: "pending" | "live" | "finished";
}

export interface BracketNode {
  id: string;
  round: number;
  position: number;
  match?: Match;
  team1?: Team;
  team2?: Team;
}

export interface Notification {
  id: string;
  userId: string;
  type: "match_start" | "checkin_reminder" | "result" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface Registration {
  id: string;
  tournamentId: string;
  teamId: string;
  team: Team;
  tournament: Tournament;
  status: "pending" | "confirmed" | "eliminated" | "champion";
  registeredAt: string;
  checkedIn: boolean;
}

export interface RankingEntry {
  position: number;
  player: Player;
  points: number;
  change: number;
  tournaments: number;
}
