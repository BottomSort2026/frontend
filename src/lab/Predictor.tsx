import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { modelInfoQuery, predictionQuery } from "../api/queries";
import type { ModelInfo, ModelInput, PredictRequest } from "../api/types";
import { formatNumber, humanize } from "../lib/labels";
import { Readout } from "../ui/Readout";
import { FilterTag, Tag } from "../ui/Tag";
import { ParamSlider } from "./ParamSlider";
import "./predictor.css";

// The simulator proper: Gateway -> ML /ml/predict, deterministic, no LLM (ARCHITECTURE.md §5).
// The prediction target is still OPEN, so nothing here knows the model's fields: the controls
// are built from GET /ml/model-info and the outputs are rendered by their type.

function defaults(info: ModelInfo): PredictRequest {
  const req: PredictRequest = {};
  for (const [key, input] of Object.entries(info.inputs)) {
    req[key] =
      input.type === "enum"
        ? (input.default ?? input.values[0] ?? "")
        : (input.default ?? input.min);
  }
  return req;
}

function stepFor(input: Extract<ModelInput, { type: "float" }>): { step: number; digits: number } {
  const span = input.max - input.min;
  if (span <= 1) return { step: 0.01, digits: 2 };
  if (span <= 10) return { step: 0.05, digits: 2 };
  return { step: 1, digits: 0 };
}

function useDebounced<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setSettled(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return settled;
}

function isProbabilities(v: unknown): v is Record<string, number> {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    Object.values(v).every((x) => typeof x === "number")
  );
}

function Output({ name, value }: { name: string; value: unknown }) {
  const { label, unit } = humanize(name);
  if (isProbabilities(value)) {
    return (
      <div className="ff-probs" role="group" aria-label={label}>
        <span className="ff-eyebrow">{label}</span>
        {Object.entries(value).map(([k, p]) => (
          <div className="ff-probs__row" key={k}>
            <span>{humanize(k).label}</span>
            <div className="ff-probs__bar">
              <i style={{ "--v": Math.max(0, Math.min(1, p)) }} />
            </div>
            <b>{Math.round(p * 100)} %</b>
          </div>
        ))}
      </div>
    );
  }
  if (typeof value === "number")
    return <Readout label={label} value={formatNumber(value)} unit={unit} />;
  if (typeof value === "string")
    return <Readout label={label} value={humanize(value).label} variant="text" />;
  return (
    <Readout label={label} value="n/a" unit={unit} note="Not predicted for these conditions" />
  );
}

/** Predictions from the ML service for conditions the user sets, bounded to the ranges PSI actually tested. */
export function Predictor() {
  const info = useQuery(modelInfoQuery);
  const [edited, setEdited] = useState<PredictRequest>({});
  const inputs = useMemo(
    () => (info.data ? { ...defaults(info.data), ...edited } : null),
    [info.data, edited],
  );
  const prediction = useQuery(predictionQuery(useDebounced(inputs, 200)));
  const set = (key: string, value: string | number) => setEdited((r) => ({ ...r, [key]: value }));

  if (info.isPending)
    return <p className="ff-predict__empty">Asking the model what it can predict…</p>;
  if (info.isError || !info.data || !inputs) {
    return (
      <p className="ff-predict__empty" role="alert">
        The prediction service is not answering. The explainer above still works; predictions return
        when the service does.
      </p>
    );
  }

  const model = info.data;
  const result = prediction.data;
  const outOfRange = result?.in_tested_range === false;

  return (
    <div className="ff-predict">
      <div className="ff-predict__inputs">
        {Object.entries(model.inputs).map(([key, input]) => {
          const { label, unit } = humanize(key);
          const name = input.label ?? label;
          if (input.type === "enum") {
            return (
              <div className="ff-predict__enum" key={key} role="group" aria-label={name}>
                <span className="ff-eyebrow">{name}</span>
                <div className="ff-predict__choices">
                  {input.values.map((v) => (
                    <FilterTag key={v} pressed={inputs[key] === v} onPress={() => set(key, v)}>
                      {v}
                    </FilterTag>
                  ))}
                </div>
              </div>
            );
          }
          const { step, digits } = stepFor(input);
          return (
            <ParamSlider
              key={key}
              id={`predict-${key}`}
              label={name}
              unit={input.unit ?? unit ?? ""}
              digits={digits}
              min={input.min}
              max={input.max}
              step={step}
              value={Number(inputs[key])}
              onChange={(v) => set(key, v)}
              onJump={(v) => set(key, v)}
              ticks={[
                {
                  value: input.min,
                  label: "Min tested",
                  hint: formatNumber(input.min),
                  align: "after",
                },
                {
                  value: input.max,
                  label: "Max tested",
                  hint: formatNumber(input.max),
                  align: "before",
                },
              ]}
            />
          );
        })}
      </div>

      <div className="ff-predict__out" aria-live="polite">
        <div className="ff-predict__flags">
          {model.sample ? (
            <Tag variant="gap">Sample output</Tag>
          ) : (
            <Tag variant="accent">{model.model_version}</Tag>
          )}
          {outOfRange ? <Tag variant="ember">Outside the tested range</Tag> : null}
          {result?.out_of_range_fields?.map((f) => (
            <Tag key={f} variant="ember">
              {humanize(f).label}
            </Tag>
          ))}
        </div>
        {prediction.isError ? (
          <p className="ff-predict__empty" role="alert">
            The model could not predict these conditions. Change a value to try again.
          </p>
        ) : result ? (
          <div className="ff-predict__grid">
            {model.outputs.map((name) => (
              <Output key={name} name={name} value={result[name]} />
            ))}
          </div>
        ) : (
          <p className="ff-predict__empty">Predicting…</p>
        )}
        <p className="ff-predict__source">
          {model.sample
            ? "Placeholder values with the right shape, shown until the ML service is connected. Do not interpret them."
            : `Trained on ${result?.training_source ?? model.training_source}. Valid only within the conditions tested in PSI.`}
        </p>
      </div>
    </div>
  );
}
