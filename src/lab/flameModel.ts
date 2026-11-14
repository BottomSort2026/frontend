// The ILLUSTRATIVE flame model: plain functions of gravity, oxygen and airflow.
// It is a visual explainer, not a combustion solver, and it never calls the ML service:
// predictions from PSI data are a separate component (lab/Predictor.tsx).

export interface FlameParams {
  /** Gravity in g, 0 to 1. */
  gravity: number;
  /** Oxygen concentration in percent, 10 to 100. */
  oxygen: number;
  /** Airflow in cm/s, 0 to 40. */
  airflow: number;
}

export type DataBasis = "microgravity" | "normal-gravity" | "interpolated";

export interface FlameDescription {
  lit: boolean;
  shape: string;
  transport: string;
  colour: string;
  basis: DataBasis;
}

/** Below this the local model shows no flame. An example value, not a measured limit. */
export const ILLUSTRATIVE_O2_LIMIT = 15;

export interface FlameState {
  lit: boolean;
  /** Intensity, 0 to 1.5. */
  intensity: number;
  /** How sooty (yellow) the flame is, 0 to 1. */
  soot: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function flameState(p: FlameParams): FlameState {
  return {
    lit: p.oxygen >= ILLUSTRATIVE_O2_LIMIT,
    intensity: clamp((p.oxygen - ILLUSTRATIVE_O2_LIMIT) / 30 + 0.25, 0, 1.5),
    soot: clamp(
      0.9 * Math.pow(p.gravity, 0.55) +
        (0.3 * (p.oxygen - 21)) / 64 -
        0.12 * Math.min(1, p.airflow / 20) * (1 - p.gravity),
      0,
      1,
    ),
  };
}

/** PSI holds microgravity and normal-gravity results only: everything between is interpolated. */
export function dataBasis(gravity: number): DataBasis {
  if (gravity < 0.005) return "microgravity";
  if (gravity > 0.995) return "normal-gravity";
  return "interpolated";
}

export const BASIS_LABEL: Record<DataBasis, string> = {
  microgravity: "Microgravity (ISS) data",
  "normal-gravity": "Normal-gravity data",
  interpolated: "Interpolated: no partial-g data in PSI yet",
};

export function describeFlame(p: FlameParams): FlameDescription {
  const s = flameState(p);
  const basis = dataBasis(p.gravity);
  if (!s.lit)
    return {
      lit: false,
      shape: "No flame",
      transport: "Below the oxygen limit",
      colour: "Extinguished",
      basis,
    };
  const g = p.gravity;
  const f = p.airflow;
  const gk = Math.min(1, g * 2.5);
  const warm = s.soot * (0.25 + 0.75 * gk * gk);
  return {
    lit: true,
    shape:
      g < 0.04
        ? f < 3
          ? "Spherical"
          : "Stretched downstream"
        : g < 0.45
          ? "Rounded teardrop"
          : "Teardrop",
    transport:
      g >= 0.3
        ? "Buoyant convection"
        : f >= 3
          ? "Forced airflow"
          : g >= 0.04
            ? "Weak buoyancy"
            : "Diffusion",
    colour:
      warm < 0.2
        ? s.intensity > 1
          ? "Bright blue-white"
          : s.intensity > 0.6
            ? "Blue"
            : "Faint blue"
        : warm < 0.6
          ? "Blue, yellow tip"
          : "Yellow, sooty",
    basis,
  };
}

export interface FlamePreset {
  label: string;
  params: FlameParams;
}

export const PRESETS: readonly FlamePreset[] = [
  { label: "ISS, still air", params: { gravity: 0, oxygen: 21, airflow: 0 } },
  { label: "ISS, ventilated", params: { gravity: 0, oxygen: 21, airflow: 20 } },
  { label: "Moon Base", params: { gravity: 0.17, oxygen: 30, airflow: 5 } },
  { label: "CFI-G, 85 % O₂", params: { gravity: 0, oxygen: 85, airflow: 0 } },
  { label: "Earth", params: { gravity: 1, oxygen: 21, airflow: 0 } },
];

export function samePreset(a: FlameParams, b: FlameParams): boolean {
  return (
    Math.abs(a.gravity - b.gravity) < 0.006 &&
    Math.abs(a.oxygen - b.oxygen) < 0.6 &&
    Math.abs(a.airflow - b.airflow) < 0.6
  );
}
