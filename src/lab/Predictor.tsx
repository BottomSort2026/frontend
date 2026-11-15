import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ApiError, errorDetail } from "../api/client";
import type { SampleFixture } from "../api/mock";
import { modelInfoQuery, predictMutation } from "../api/queries";
import type { LabInputs, LabModelInfo, LabPredictResponse } from "../api/types";
import { useAssistant } from "../assistant/AssistantContext";
import { choiceLabel, formatNumber, humanize, OUTCOME_VERDICT } from "../lib/labels";
import { Button } from "../ui/Button";
import { Alert } from "../ui/icons";
import { FilterTag, Tag } from "../ui/Tag";
import {
  buildInputs,
  defaultValues,
  displaySpec,
  fromDisplay,
  normalizeValues,
  rangeOf,
  sameInputs,
  selectorOf,
} from "./lab";
import { LabResult } from "./LabResult";
import { ParamSlider } from "./ParamSlider";
import "./predictor.css";

// The Flame Lab (docs/frontend_flame_lab.md §4–§6): Gateway → MCP /lab/predict → engine + LLM.
// The controls are built from model-info, a request goes out only on Predict, and every number on
// screen comes from the response. The explanation is an assistant message in the dock (§7).

interface Shown {
  response: LabPredictResponse;
  /** The inputs that were sent for it. */
  inputs: LabInputs;
  /** Its message in the assistant dock, where the explanation lives. */
  messageId: number;
}

const round6 = (v: number) => Math.round(v * 1e6) / 1e6;

function Controls({
  model,
  values,
  set,
}: {
  model: LabModelInfo;
  values: LabInputs;
  set: (key: string, value: string | number) => void;
}) {
  return (
    <>
      {Object.entries(model.inputs).map(([key, input]) => {
        const { label, unit } = humanize(key);
        const name = input.label ?? label;
        if (input.type === "enum") {
          return (
            <div className="ff-predict__enum" key={key} role="group" aria-label={name}>
              <span className="ff-eyebrow">{name}</span>
              <div className="ff-predict__choices">
                {input.values.map((v) => (
                  <FilterTag key={v} pressed={values[key] === v} onPress={() => set(key, v)}>
                    {choiceLabel(v)}
                  </FilterTag>
                ))}
              </div>
            </div>
          );
        }
        const spec = displaySpec(input, unit);
        const range = rangeOf(model, input, values);
        const selector = selectorOf(model, input);
        const min = round6(range.min * spec.scale);
        const max = round6(range.max * spec.scale);
        return (
          <ParamSlider
            key={key}
            id={`predict-${key}`}
            label={name}
            unit={spec.unit}
            digits={spec.digits}
            min={min}
            max={max}
            step={spec.step}
            value={round6(Number(values[key]) * spec.scale)}
            onChange={(v) => set(key, fromDisplay(v, spec))}
            onJump={(v) => set(key, fromDisplay(v, spec))}
            disabled={range.disabled}
            helper={selector ? `No ${humanize(selector).label.toLowerCase()} added` : "Not used"}
            ticks={[
              { value: min, label: "Min tested", hint: formatNumber(min), align: "after" },
              { value: max, label: "Max tested", hint: formatNumber(max), align: "before" },
            ]}
          />
        );
      })}
    </>
  );
}

/** The whole Flame Lab under its header. `fixture` picks a sample state (`?sample=`). */
export function Predictor({ fixture }: { fixture?: SampleFixture }) {
  const info = useQuery(modelInfoQuery);
  const [values, setValues] = useState<LabInputs | null>(null);
  const [shown, setShown] = useState<Shown | null>(null);
  const assistant = useAssistant();
  // Mutation-level callbacks: they still run if the person leaves the Lab mid-request, so the
  // answer reaches the dock and the face never stays waiting.
  const predict = useMutation({
    ...predictMutation(fixture),
    onMutate: () => assistant.lab.started(),
    onSuccess: (response, inputs) => {
      const messageId = assistant.lab.answered({ response, inputs, model: info.data! });
      setShown({ response, inputs, messageId });
    },
    onError: () => assistant.lab.failed(),
  });

  if (info.isPending)
    return <p className="ff-predict__empty">Asking the models what they can predict…</p>;
  if (info.isError || !info.data) {
    return (
      <p className="ff-predict__empty" role="alert">
        The prediction service is not answering. The Lab returns when the service does.
      </p>
    );
  }

  const model = info.data;
  const current = values ?? defaultValues(model);
  const inputs = buildInputs(model, current);
  const set = (key: string, value: string | number) =>
    setValues(normalizeValues(model, { ...current, [key]: value }, key));

  const running = predict.isPending;
  const err = predict.isError ? predict.error : null;
  const invalid = err instanceof ApiError && err.status === 422;
  const down = err !== null && !invalid;
  // A 422 is about the inputs that were sent: once they change, its message no longer applies.
  const invalidMessage =
    invalid && sameInputs(predict.variables, inputs)
      ? (errorDetail(err.body) ?? "The models did not accept these conditions.")
      : null;
  // Stale means the inputs changed. A failed retry with the same inputs leaves the result valid.
  const stale = shown !== null && !sameInputs(shown.inputs, inputs);

  const onPredict = () => {
    if (!running) predict.mutate(inputs);
  };

  const status = running
    ? "Asking the models…"
    : shown && !stale
      ? `Prediction ready. ${OUTCOME_VERDICT[shown.response.prediction.outcome.prediction.label] ?? ""}`
      : "";

  return (
    <div className="ff-predict">
      <div className="ff-predict__inputs">
        <Controls model={model} values={current} set={set} />
        <div className="ff-predict__action">
          <Button
            variant="primary"
            onClick={onPredict}
            aria-disabled={running || undefined}
            aria-busy={running || undefined}
          >
            {running ? "Predicting…" : "Predict"}
          </Button>
          {invalidMessage ? (
            <p className="ff-predict__invalid" role="alert">
              <Alert />
              <span>
                <strong>Not accepted.</strong> {invalidMessage}
              </span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="ff-predict__out">
        <p className="ff-visually-hidden" role="status">
          {status}
        </p>
        {model.sample || stale ? (
          <div className="ff-predict__flags">
            {model.sample ? <Tag variant="gap">Sample output</Tag> : null}
            {stale ? <Tag variant="gap">Conditions changed: press Predict to update</Tag> : null}
          </div>
        ) : null}
        {down ? (
          <p className={shown ? "ff-predict__down" : "ff-predict__empty"} role="alert">
            The prediction service is not answering.
          </p>
        ) : null}
        {shown ? (
          <LabResult
            model={model}
            response={shown.response}
            inputs={shown.inputs}
            stale={stale}
            onReadExplanation={
              shown.response.explanation?.trim()
                ? () => assistant.reveal(shown.messageId)
                : undefined
            }
          />
        ) : down ? null : (
          <p className="ff-predict__empty">
            {running ? "Asking the models…" : "Set the conditions and press Predict."}
          </p>
        )}
      </div>
    </div>
  );
}
