export interface MapPresentation {
  name: string;
  splashArtUrl: string;
  sourceUrl: string;
}

const MAP_PRESENTATIONS: Record<string, MapPresentation> = {
  Mirage: {
    name: "Mirage",
    splashArtUrl: "https://blog.counter-strike.net/wp-content/uploads//2013/06/mirage.jpg",
    sourceUrl: "https://blog.counter-strike.net/2013/06/7238/",
  },
  Inferno: {
    name: "Inferno",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/inferno/beautyshot.jpg",
    sourceUrl: "https://www.counter-strike.net/inferno/%7CNew",
  },
  Anubis: {
    name: "Anubis",
    splashArtUrl: "https://cdn.akamai.steamstatic.com/apps/csgo/images/blog/anubis_map.jpg",
    sourceUrl: "https://blog.counter-strike.net/2022/11/40368/",
  },
};

export function getMapPresentation(mapName: string) {
  return MAP_PRESENTATIONS[mapName] ?? null;
}
