import { useId } from "react";
import {
  investigationUrl,
  type ExtinctionBlock,
  type LabInputs,
  type LabModelInfo,
  type LabPredictResponse,
  type OutcomeClass,
  type Support as SupportFields,
} from "../api/types";
import { humanize, OUTCOME_ROW, OUTCOME_VERDICT, testEndLabel } from "../lib/labels";
import { Button } from "../ui/Button";
import { Alert, ArrowUpRight, Check } from "../ui/icons";
import { Readout } from "../ui/Readout";
import { Tag } from "../ui/Tag";
import {
  confidenceWording,
  nearestTests,
  rangeWording,
  sourceLine,
  supportSentence,
  testConditions,
  type TagTone,
} from "./lab";

const CLASSES: readonly OutcomeClass[] = ["extinction", "no_extinction"];
const D0_FIELD = "droplet_d0_mm";
const FLEX = "PSI-69";

const pct = (v: number) => Math.round(v * 100);
const mm = (v: number) => v.toFixed(2);

function StateTag({ text, tone }: { text: string; tone: TagTone }) {
  return (
    <Tag variant={tone === "neutral" ? "neutral" : tone}>
      {tone === "nominal" ? <Check /> : tone === "ember" ? <Alert /> : null}
      {text}
    </Tag>
  );
}

/** The k-NN behind one block (§6.3): how many real tests back it and how far it reaches. */
function Support({ block }: { block: SupportFields | undefined }) {
  if (!block) return null;
  const confidence = confidenceWording(block.confidence);
  const range = rangeWording(block.in_tested_range);
  const sentence = supportSentence(block.support_n);
  const fields = block.out_of_range_fields ?? [];
  if (!confidence && !range && !sentence && !fields.length) return null;
  return (
    <div className="ff-support">
      <div className="ff-support__tags">
        {confidence ? <StateTag {...confidence} /> : null}
        {range ? <StateTag {...range} /> : null}
        {fields.map((f) => (
          <Tag key={f} variant="ember">
            <span className="ff-visually-hidden">Outside its range: </span>
            {humanize(f).label}
          </Tag>
        ))}
      </div>
      {sentence ? <p className="ff-support__n">{sentence}</p> : null}
    </div>
  );
}

function Outcome({
  block,
  onReadExplanation,
}: {
  block: LabPredictResponse["prediction"]["outcome"];
  onReadExplanation?: () => void;
}) {
  const id = useId();
  const { label } = block.prediction;
  const probs = block.prediction.probabilities ?? {};
  return (
    <section className="ff-lab-panel" aria-labelledby={`${id}-h`}>
      <p className="ff-eyebrow" id={`${id}-h`}>
        Outcome
      </p>
      <div className="ff-lab-verdict-row">
        <p className="ff-lab-verdict">{OUTCOME_VERDICT[label] ?? humanize(label).label}</p>
        {onReadExplanation ? (
          <Button variant="secondary" onClick={onReadExplanation}>
            Read the explanation
          </Button>
        ) : null}
      </div>
      <div className="ff-meters">
        {CLASSES.map((cls) => {
          const p = probs[cls];
          if (typeof p !== "number") return null;
          const v = pct(p);
          return (
            <div className="ff-meter" key={cls} data-predicted={cls === label}>
              <span id={`${id}-${cls}`}>{OUTCOME_ROW[cls]}</span>
              <div
                className="ff-meter__bar"
                role="meter"
                aria-labelledby={`${id}-${cls}`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={v}
                aria-valuetext={`${v} %`}
              >
                <i style={{ "--v": Math.min(1, Math.max(0, p)) }} />
              </div>
              <b>{v} %</b>
            </div>
          );
        })}
      </div>
      <Support block={block.support} />
    </section>
  );
}

/** Two circles to scale: the fuel droplet at ignition and when the flame went out. Not a flame. */
function DropletDrawing({ d0, dExt, maxD0 }: { d0: number; dExt: number; maxD0: number }) {
  const size = 160;
  const pxPerMm = (size - 12) / maxD0; // one fixed scale: a bigger droplet draws bigger
  const c = size / 2;
  const bar = pxPerMm;
  return (
    <svg
      className="ff-droplet__svg"
      viewBox={`0 0 ${size} ${size + 40}`}
      role="img"
      aria-label={`Fuel droplet to scale: ${mm(d0)} mm across at ignition, ${mm(dExt)} mm when the flame goes out.`}
    >
      <circle className="ff-droplet__d0" cx={c} cy={c} r={(d0 * pxPerMm) / 2} />
      <circle className="ff-droplet__dext" cx={c} cy={c} r={(dExt * pxPerMm) / 2} />
      <path
        className="ff-droplet__scale"
        d={`M${c - bar / 2} ${size + 10}v6M${c - bar / 2} ${size + 13}h${bar}M${c + bar / 2} ${size + 10}v6`}
      />
      <text className="ff-droplet__label" x={c} y={size + 34} textAnchor="middle">
        1 mm
      </text>
    </svg>
  );
}

function Droplet({
  block,
  d0,
  maxD0,
  sample,
}: {
  block: ExtinctionBlock;
  d0: number | undefined;
  maxD0: number | undefined;
  sample: boolean;
}) {
  const id = useId();
  const dExt = block.prediction?.extinction_diameter_mm;
  const burned = block.prediction?.fuel_burned_fraction;
  const canDraw = typeof d0 === "number" && typeof dExt === "number" && d0 > 0;
  return (
    <section className="ff-lab-panel" aria-labelledby={id}>
      <p className="ff-eyebrow" id={id}>
        Droplet at extinction
      </p>
      <div className="ff-droplet">
        {canDraw ? (
          <DropletDrawing d0={d0} dExt={dExt} maxD0={Math.max(maxD0 ?? 0, d0, dExt)} />
        ) : null}
        <div className="ff-droplet__readouts">
          {typeof d0 === "number" ? (
            <Readout
              label="Diameter at ignition, D₀"
              value={mm(d0)}
              unit="mm"
              note={sample ? "The reference case" : "Your input"}
            />
          ) : null}
          {typeof dExt === "number" ? (
            <Readout label="Diameter at extinction" value={mm(dExt)} unit="mm" />
          ) : null}
          {typeof burned === "number" ? (
            <Readout label="Fuel burned before extinction" value={String(pct(burned))} unit="%" />
          ) : null}
        </div>
      </div>
      <Support block={block.support} />
    </section>
  );
}

function Nearest({ prediction }: { prediction: LabPredictResponse["prediction"] }) {
  const id = useId();
  const tests = nearestTests(prediction);
  if (!tests.length) return null;
  return (
    <section className="ff-lab-panel" aria-labelledby={id}>
      <p className="ff-eyebrow" id={id}>
        Closest real tests
      </p>
      <ol className="ff-nearest">
        {tests.map((t, i) => {
          const conditions = testConditions(t);
          return (
            <li key={t.testsheet_id ?? t.cir_id ?? i}>
              <span className="ff-nearest__id">{t.testsheet_id ?? "No TestSheet"}</span>
              {t.cir_id ? <span className="ff-nearest__cir">{t.cir_id}</span> : null}
              <span className="ff-nearest__end">{testEndLabel(t.test_end)}</span>
              {conditions ? <span className="ff-nearest__conditions">{conditions}</span> : null}
            </li>
          );
        })}
      </ol>
      <a className="ff-lab-link" href={investigationUrl(FLEX)} target="_blank" rel="noreferrer">
        FLEX on PSI ({FLEX})
        <ArrowUpRight />
      </a>
    </section>
  );
}

/** What the models answered, top to bottom as docs/frontend_flame_lab.md §6 orders it. */
export function LabResult({
  model,
  response,
  inputs,
  stale,
  onReadExplanation,
}: {
  model: LabModelInfo;
  response: LabPredictResponse;
  inputs: LabInputs;
  stale: boolean;
  /** Set when the result has an explanation: opens the dock on its message. */
  onReadExplanation?: () => void;
}) {
  const { prediction } = response;
  const sample = response.sample !== undefined;
  const d0Raw = (response.sample?.inputs ?? inputs)[D0_FIELD];
  const d0 = typeof d0Raw === "number" ? d0Raw : undefined;
  const d0Input = model.inputs[D0_FIELD];
  const maxD0 = d0Input?.type === "float" ? d0Input.max : undefined;
  const extinct = prediction.outcome.prediction.label === "extinction";
  return (
    <div className={`ff-lab-result${stale ? " ff-lab-result--stale" : ""}`}>
      <Outcome block={prediction.outcome} onReadExplanation={onReadExplanation} />
      {extinct && prediction.extinction ? (
        <Droplet block={prediction.extinction} d0={d0} maxD0={maxD0} sample={sample} />
      ) : !extinct ? (
        <p className="ff-lab-result__line">
          No extinction predicted: the droplet burns out or breaks apart before the flame goes out.
        </p>
      ) : null}
      <Nearest prediction={prediction} />
      <p className="ff-predict__source">{sourceLine(prediction, response.sample)}</p>
    </div>
  );
}
