// The Flame Lab's logic, kept out of the components so it can be tested. Nothing here computes
// anything about the physics: ranges come from model-info and every number shown comes from the
// engine response (docs/frontend_flame_lab.md §6).

import type {
  Confidence,
  FloatInput,
  LabInputs,
  LabModelInfo,
  LabPredictResponse,
  NearestTest,
} from "../api/types";
import { formatNumber } from "../lib/labels";

export const MAX_NEAREST = 5;

/** Decided by the unit, never by the field name. */
export function isMoleFraction(input: FloatInput): boolean {
  return /mole\s*fraction/i.test(input.unit ?? "");
}

export interface DisplaySpec {
  /** Display value = sent value × scale. */
  scale: number;
  unit: string;
  step: number;
  digits: number;
}

/** How a float is shown: a mole fraction reads as a percentage (0.21 → 21 %) and is sent as 0.21. */
export function displaySpec(input: FloatInput, fallbackUnit = ""): DisplaySpec {
  if (isMoleFraction(input)) return { scale: 100, unit: "%", step: 1, digits: 0 };
  const span = input.max - input.min;
  const unit = input.unit ?? fallbackUnit;
  if (span <= 1) return { scale: 1, unit, step: 0.01, digits: 2 };
  if (span <= 10) return { scale: 1, unit, step: 0.05, digits: 2 };
  return { scale: 1, unit, step: 1, digits: 0 };
}

/** The choice a float's `by_selector` is keyed on: named, or the one whose values cover its keys. */
export function selectorOf(info: LabModelInfo, input: FloatInput): string | undefined {
  if (!input.by_selector) return undefined;
  if (input.selector && info.inputs[input.selector]?.type === "enum") return input.selector;
  const keys = Object.keys(input.by_selector);
  return Object.entries(info.inputs).find(
    ([, other]) => other.type === "enum" && keys.every((k) => other.values.includes(k)),
  )?.[0];
}

export interface FloatRange {
  min: number;
  max: number;
  /** The chosen value of the selector does not use this input: it is sent as 0. */
  disabled: boolean;
}

/** The range of a float right now. With a selector, the range of the chosen value. */
export function rangeOf(info: LabModelInfo, input: FloatInput, values: LabInputs): FloatRange {
  const selector = selectorOf(info, input);
  if (!selector || !input.by_selector) return { min: input.min, max: input.max, disabled: false };
  const r = input.by_selector[String(values[selector])];
  if (!r || !(r.max > r.min)) return { min: input.min, max: input.max, disabled: true };
  return { min: r.min, max: r.max, disabled: false };
}

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v));

/** The model's defaults, or the first value / the minimum when it gives none. */
export function defaultValues(info: LabModelInfo): LabInputs {
  const values: LabInputs = {};
  for (const [key, input] of Object.entries(info.inputs))
    values[key] =
      input.type === "enum"
        ? (input.default ?? input.values[0] ?? "")
        : (input.default ?? input.min);
  return normalizeValues(info, values);
}

/** Sum of every mole fraction except `except`: the rest of the gas is N₂, so it must stay ≤ 1. */
function otherFractions(info: LabModelInfo, values: LabInputs, except: string): number {
  let sum = 0;
  for (const [key, input] of Object.entries(info.inputs))
    if (key !== except && input.type === "float" && isMoleFraction(input))
      sum += Number(values[key]) || 0;
  return sum;
}

/**
 * Keeps the values sendable: a float with a selector is clamped into the chosen value's range
 * (0 when that value does not use it), and the mole fraction just moved (`changed`) is capped so
 * the mole fractions never add up to more than 1.
 */
export function normalizeValues(
  info: LabModelInfo,
  values: LabInputs,
  changed?: string,
): LabInputs {
  const next = { ...values };
  for (const [key, input] of Object.entries(info.inputs)) {
    if (input.type !== "float" || !input.by_selector) continue;
    const r = rangeOf(info, input, next);
    next[key] = r.disabled ? 0 : clamp(Number(next[key]) || 0, r.min, r.max);
  }
  const moved = changed ? info.inputs[changed] : undefined;
  if (changed && moved?.type === "float" && isMoleFraction(moved)) {
    const room = Math.max(0, 1 - otherFractions(info, next, changed));
    next[changed] = Math.min(Number(next[changed]) || 0, roundFraction(room));
  }
  return next;
}

/** Display units back to the sent value without float noise (21 % → 0.21, not 0.21000000000000002). */
export function fromDisplay(v: number, spec: DisplaySpec): number {
  return spec.scale === 1 ? v : roundFraction(v / spec.scale);
}

function roundFraction(v: number): number {
  return Math.round(v * 1e6) / 1e6;
}

/** The request body's inputs: exactly the fields model-info declares; an unused float is 0. */
export function buildInputs(info: LabModelInfo, values: LabInputs): LabInputs {
  const out: LabInputs = {};
  for (const [key, input] of Object.entries(info.inputs)) {
    const v = values[key];
    if (input.type === "enum") out[key] = String(v ?? "");
    else out[key] = rangeOf(info, input, values).disabled ? 0 : Number(v);
  }
  return out;
}

export function sameInputs(a: LabInputs | undefined, b: LabInputs | undefined): boolean {
  if (!a || !b) return false;
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
}

/**
 * The closest real tests of both blocks, each test once, in k-NN order (outcome model first),
 * at most five. The extinction model's neighbours count only when its block is shown.
 */
export function nearestTests(prediction: LabPredictResponse["prediction"]): NearestTest[] {
  const lists = [prediction.outcome.nearest_tests ?? []];
  if (prediction.outcome.outcome === "extinction" && prediction.extinction)
    lists.push(prediction.extinction.nearest_tests ?? []);
  const seen = new Set<string>();
  const out: NearestTest[] = [];
  for (const t of lists.flat()) {
    const id = t.testsheet_id ?? t.cir_id;
    if (id) {
      if (seen.has(id)) continue;
      seen.add(id);
    }
    out.push(t);
    if (out.length === MAX_NEAREST) break;
  }
  return out;
}

const ACRONYM: Record<string, string> = { "PSI-69": "FLEX" };

/**
 * "flex-outcome-0.1 · flex-extinction-0.2 · trained on FLEX (PSI-69), 251 and 156 tests. …"
 * Built from the training_source objects: never prints an object, never the sha256.
 */
export function sourceLine(
  prediction: LabPredictResponse["prediction"],
  sample?: LabPredictResponse["sample"],
): string {
  if (sample)
    return sample.reference
      ? "Sample output: the reference case of the model cards, not computed from your inputs. The models are not connected yet."
      : "Sample output: a hand-made variant of the reference case to show this state, not computed from your inputs. The models are not connected yet.";
  const blocks = [prediction.outcome, prediction.extinction].filter((b) => b !== undefined);
  const parts = blocks.map((b) => b.model_version).filter((v): v is string => !!v);
  const accessions = [...new Set(blocks.map((b) => b.training_source?.accession).filter(Boolean))];
  const rows = blocks
    .map((b) => b.training_source?.rows)
    .filter((r): r is number => typeof r === "number");
  if (accessions.length || rows.length) {
    const data = accessions.map((a) => (ACRONYM[a!] ? `${ACRONYM[a!]} (${a})` : a)).join(", ");
    const count = rows.length ? `${rows.map(formatNumber).join(" and ")} tests` : "";
    parts.push(`trained on ${[data, count].filter(Boolean).join(", ")}`);
  }
  const lead = parts.join(" · ");
  const valid = "Valid only within the conditions tested on the ISS.";
  return lead ? `${lead}. ${valid}` : valid;
}

export type TagTone = "nominal" | "neutral" | "ember";

export function confidenceWording(
  c: Confidence | undefined,
): { text: string; tone: TagTone } | null {
  if (c === "high") return { text: "High confidence", tone: "nominal" };
  if (c === "medium") return { text: "Medium confidence", tone: "neutral" };
  if (c === "low") return { text: "Low confidence", tone: "ember" };
  return null;
}

export function rangeWording(inRange: boolean | undefined): { text: string; tone: TagTone } | null {
  if (inRange === true) return { text: "Inside the tested conditions", tone: "neutral" };
  if (inRange === false) return { text: "Outside the tested conditions", tone: "ember" };
  return null;
}

export function supportSentence(n: number | undefined): string | null {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n <= 0) return "No real test close to these conditions";
  return `${n} real ${n === 1 ? "test" : "tests"} close to these conditions`;
}
