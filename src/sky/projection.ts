import { PLAIN_STARS, STARS, type SectionId } from "./stars";

export interface Point {
  x: number;
  y: number;
}

export interface SkyGeometry {
  width: number;
  height: number;
  /** Labels go under the stars and the cross is centred. */
  stack: boolean;
  /** Pixels per degree of sky. */
  unit: number;
  centre: Point;
  stars: Record<SectionId, Point>;
  plain: (Point & { visible: boolean })[];
  /** Axis of the Milky Way, which runs through the Cross. */
  band: Point & { angle: number };
  /** The Coalsack dark nebula, beside Acrux. */
  coalsack: Point & { rx: number; ry: number };
}

/** The Cross is drawn leaning 14° rather than upright, as it sits while it climbs. */
export const TILT = (-14 * Math.PI) / 180;

function place(dx: number, dy: number, centre: Point, unit: number): Point {
  const c = Math.cos(TILT);
  const s = Math.sin(TILT);
  return { x: centre.x + (dx * c - dy * s) * unit, y: centre.y + (dx * s + dy * c) * unit };
}

/** Where everything in the sky sits for a viewport of the given size. */
export function layoutSky(width: number, height: number): SkyGeometry {
  const stack = width < 760;
  const unit = stack
    ? Math.min(height * 0.082, width * 0.13)
    : Math.min(height * 0.088, width * 0.075);
  const centre = { x: width * (stack ? 0.5 : 0.58), y: height * (stack ? 0.45 : 0.4) };
  const stars = Object.fromEntries(
    STARS.map((s) => [s.id, place(s.dx, s.dy, centre, unit)]),
  ) as Record<SectionId, Point>;
  const plain = PLAIN_STARS.map((s) => {
    const p = place(s.dx, s.dy, centre, unit);
    return { ...p, visible: p.x > 24 };
  });
  const acrux = stars.mission;
  const coal = place(-2.7, 2.2, centre, unit);
  return {
    width,
    height,
    stack,
    unit,
    centre,
    stars,
    plain,
    band: {
      x: (acrux.x + centre.x) / 2,
      y: (acrux.y + centre.y) / 2 + 0.3 * unit,
      angle: TILT + 0.136,
    },
    coalsack: { x: coal.x, y: coal.y, rx: 2.5 * unit, ry: 1.8 * unit },
  };
}

/** Distance from a point to the farthest corner: how far the arrival burst must reach. */
export function reach(p: Point, width: number, height: number): number {
  return Math.max(
    Math.hypot(p.x, p.y),
    Math.hypot(width - p.x, p.y),
    Math.hypot(p.x, height - p.y),
    Math.hypot(width - p.x, height - p.y),
  );
}
