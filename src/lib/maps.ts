export interface MapPresentation {
  name: string;
  localImage: string;
}

export const CS2_MAP_POOL: MapPresentation[] = [
  { name: "Mirage",   localImage: "/assets/maps/mirage.jpg" },
  { name: "Inferno",  localImage: "/assets/maps/inferno.jpg" },
  { name: "Ancient",  localImage: "/assets/maps/ancient.jpg" },
  { name: "Anubis",   localImage: "/assets/maps/anubis.jpg" },
  { name: "Dust2",    localImage: "/assets/maps/dust2.jpg" },
  { name: "Nuke",     localImage: "/assets/maps/nuke.jpg" },
  { name: "Overpass", localImage: "/assets/maps/overpass.webp" },
];

export const CS2_MAP_NAMES = CS2_MAP_POOL.map((m) => m.name);

const MAP_BY_NAME = Object.fromEntries(CS2_MAP_POOL.map((m) => [m.name, m]));

export function getMapPresentation(mapName: string): MapPresentation | null {
  return MAP_BY_NAME[mapName] ?? null;
}

// Veto sequences — returns ordered slots with whose turn it is and the action type.
export type VetoSlot = { turn: "team1" | "team2"; action: "ban" | "pick" };

export function getVetoSequence(boType: 1 | 3 | 5): VetoSlot[] {
  if (boType === 1) {
    // 6 alternating vetoes, last map remaining is played
    return [
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
    ];
  }
  if (boType === 3) {
    // ban ban pick pick ban ban → decider is remaining
    return [
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "pick" },
      { turn: "team2", action: "pick" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
    ];
  }
  // BO5: pick pick pick pick, ban ban → last is decider
  return [
    { turn: "team1", action: "ban" },
    { turn: "team2", action: "ban" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
  ];
}
