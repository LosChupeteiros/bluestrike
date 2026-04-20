export interface MapPresentation {
  name: string;
  splashArtUrl: string;
  sourceUrl: string;
}

export const CS2_MAP_POOL: MapPresentation[] = [
  {
    name: "Mirage",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_mirage.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Inferno",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_inferno.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Ancient",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_ancient.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Anubis",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_anubis.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Dust2",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_dust2.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Nuke",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_nuke.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
  {
    name: "Vertigo",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/csgo_react//maps/lg/de_vertigo.jpg",
    sourceUrl: "https://www.counter-strike.net/news",
  },
];

export const CS2_MAP_NAMES = CS2_MAP_POOL.map((m) => m.name);

const MAP_PRESENTATIONS: Record<string, MapPresentation> = Object.fromEntries(
  CS2_MAP_POOL.map((m) => [m.name, m])
);

export function getMapPresentation(mapName: string): MapPresentation | null {
  return MAP_PRESENTATIONS[mapName] ?? null;
}

// BO1: 6 alternating bans, 1 map remains → played
// BO3: ban ban pick pick ban ban, 1 decider
// Returns an array of action slots: { turn: 'team1'|'team2', action: 'ban'|'pick' }
export type VetoSlot = { turn: "team1" | "team2"; action: "ban" | "pick" };

export function getVetoSequence(boType: 1 | 3 | 5): VetoSlot[] {
  if (boType === 1) {
    // 6 bans (3+3 alternating), last map played automatically
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
    // ban ban pick pick ban ban, decider is last remaining
    return [
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
      { turn: "team1", action: "pick" },
      { turn: "team2", action: "pick" },
      { turn: "team1", action: "ban" },
      { turn: "team2", action: "ban" },
    ];
  }
  // BO5: all 7 maps with 1 remaining (pick pick pick pick ban ban 1 remaining)
  return [
    { turn: "team1", action: "ban" },
    { turn: "team2", action: "ban" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
    { turn: "team1", action: "pick" },
    { turn: "team2", action: "pick" },
  ];
}
