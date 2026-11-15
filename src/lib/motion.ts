import { dur, ease, type Bezier } from "./tokens";

// Motion values resolved once from the tokens (see the Motion section of the design system).
// The literals are only fallbacks for environments without the stylesheet, such as tests.
export interface MotionTokens {
  instant: number;
  fast: number;
  base: number;
  slow: number;
  travel: number;
  travelBack: number;
  out: Bezier;
  inOut: Bezier;
  travelEase: Bezier;
  /** `travelEase` played backwards, so the return trip mirrors the trip out. */
  travelBackEase: Bezier;
}

let cached: MotionTokens | null = null;

export function motionTokens(): MotionTokens {
  if (!cached) {
    const travelEase = ease("--ease-travel", [0.65, 0, 0.2, 1]);
    cached = {
      instant: dur("--dur-instant", 120),
      fast: dur("--dur-fast", 180),
      base: dur("--dur-base", 260),
      slow: dur("--dur-slow", 420),
      travel: dur("--dur-travel", 900),
      travelBack: 0.8,
      out: ease("--ease-out", [0.23, 1, 0.32, 1]),
      inOut: ease("--ease-in-out", [0.77, 0, 0.175, 1]),
      travelEase,
      travelBackEase: [1 - travelEase[2], 1 - travelEase[3], 1 - travelEase[0], 1 - travelEase[1]],
    };
  }
  return cached;
}
