// The sky's catalogue. Offsets are degrees from the centre of Crux (x: west is right,
// y: south is down), taken from the stars' catalogue positions.

export type SectionId = "mission" | "safety" | "library" | "lab";
export type SectionPath = "/mission" | "/fire-safety" | "/library" | "/flame-lab";

export interface StarDef {
  id: SectionId;
  path: SectionPath;
  /** Section name shown beside the star. */
  name: string;
  greek: string;
  star: string;
  dx: number;
  dy: number;
  /** Scale of the core, from the star's real brightness. */
  mag: number;
  side: "left" | "right";
  /** Gacrux is a red giant: the one warm star. */
  warm?: boolean;
}

export interface PlainStar {
  name: string;
  dx: number;
  dy: number;
  mag: number;
}

/** In tab order: Mission, Fire safety, Library, Flame lab. */
export const STARS: readonly StarDef[] = [
  {
    id: "mission",
    path: "/mission",
    name: "Mission",
    greek: "α",
    star: "Acrux",
    dx: 0.43,
    dy: 3.1,
    mag: 1.3,
    side: "right",
  },
  {
    id: "safety",
    path: "/fire-safety",
    name: "Fire safety",
    greek: "β",
    star: "Mimosa",
    dx: -2.21,
    dy: -0.31,
    mag: 1.2,
    side: "left",
  },
  {
    id: "library",
    path: "/library",
    name: "Library",
    greek: "δ",
    star: "Imai",
    dx: 1.86,
    dy: -1.25,
    mag: 0.95,
    side: "right",
  },
  {
    id: "lab",
    path: "/flame-lab",
    name: "Flame lab",
    greek: "γ",
    star: "Gacrux",
    dx: -0.15,
    dy: -2.89,
    mag: 1.15,
    side: "right",
    warm: true,
  },
];

/** Stars that are not destinations: Ginan, and the two Pointers when the viewport is wide enough. */
export const PLAIN_STARS: readonly PlainStar[] = [
  { name: "", dx: 1.07, dy: 0.4, mag: 0.55 },
  { name: "Hadar", dx: -11.7, dy: 0.37, mag: 0.85 },
  { name: "Rigil Kentaurus", dx: -16.2, dy: 0.83, mag: 1 },
];

/** The two bars of the cross. */
export const LINES: readonly (readonly [SectionId, SectionId])[] = [
  ["lab", "mission"],
  ["safety", "library"],
];

export function starById(id: SectionId): StarDef {
  return STARS.find((s) => s.id === id)!;
}

export function starForPath(pathname: string): StarDef | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return STARS.find((s) => s.path === clean) ?? null;
}
