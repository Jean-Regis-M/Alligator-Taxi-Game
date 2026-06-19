import { BLOCK_SIZE, ROAD_WIDTH, getBlockCenters } from "./constants";

export type BuildingType =
  | "fastfood"
  | "hotel"
  | "mall"
  | "gas_station"
  | "arcade"
  | "office"
  | "apartment"
  | "skyscraper"
  | "diner"
  | "church"
  | "industrial";

export interface BuildingData {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
  type: BuildingType;
}

const PALETTES: Record<BuildingType, string[]> = {
  fastfood:    ["#D4C4A4","#CABBA0","#DDD0B0","#C8BC9A"],  // warm cream stucco
  hotel:       ["#E4DDD2","#DDD6CA","#E8E2D8","#E0D8CC"],  // pale off-white
  mall:        ["#C8C2B8","#C0BAB0","#D0CABC","#C4BEB4"],  // weathered concrete
  gas_station:  ["#DEDAD4","#D8D4CE","#E2DED8","#D4D0CA"],  // light stucco
  industrial:   ["#888888"],
  arcade:      ["#CEC0A0","#C4B898","#D8CBA8","#C8BC9C"],  // sandy sandstone
  office:      ["#B4B8B4","#A8ACAA","#BCBCB8","#AEAEAD"],  // neutral concrete grey
  apartment:   ["#C89C7A","#BE9070","#D0A882","#C49878"],  // warm terracotta
  skyscraper:  ["#3A4252","#323A4A","#404858","#38404E"],  // dark charcoal — glass tower body
  diner:       ["#D8D4C8","#D0CCC0","#DEDAD0","#D4D0C8"],  // warm off-white
  church:      ["#E0DCD4","#D8D4CC","#E4E0D8","#DCDAD2"],  // cream
};

function pickFrom<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generateBuildings(): BuildingData[] {
  const centers = getBlockCenters();
  const buildings: BuildingData[] = [];

  let s = 42;
  const rand = () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };

  const types: BuildingType[] = [
    "fastfood", "hotel", "mall", "gas_station", "arcade",
    "office", "apartment", "skyscraper", "diner", "church",
  ];

  for (const [cx, cz] of centers) {
    const usableSize = BLOCK_SIZE - ROAD_WIDTH - 4;
    const type = pickFrom(types, rand);
    rand(); rand(); // consume same random slots for determinism

    const w = Math.min(usableSize * (0.60 + rand() * 0.30), usableSize - 2);
    const d = Math.min(usableSize * (0.60 + rand() * 0.30), usableSize - 2);

    const h =
      type === "skyscraper" ? 45 + rand() * 40 :
      type === "office"     ? 22 + rand() * 30 :
      type === "hotel"      ? 18 + rand() * 28 :
      type === "apartment"  ? 12 + rand() * 14 :
      type === "mall"       ?  8 + rand() *  6 :
      type === "church"     ? 14 + rand() * 10 :
      type === "diner"      ?  4 + rand() *  4 :
      type === "fastfood"   ?  4 + rand() *  3 :
      type === "gas_station"?  3 + rand() *  2 :
      /* arcade */            5 + rand() *  6;

    const maxNudge = Math.max(0, (usableSize - w) * 0.4);
    const ox = (rand() - 0.5) * maxNudge;
    const oz = (rand() - 0.5) * maxNudge;

    buildings.push({
      x: cx + ox,
      z: cz + oz,
      w,
      d,
      h,
      color: pickFrom(PALETTES[type], rand),
      type,
    });
  }
  return buildings;
}

let _cache: BuildingData[] | null = null;
export function getBuildings(): BuildingData[] {
  if (!_cache) _cache = generateBuildings();
  return _cache;
}
