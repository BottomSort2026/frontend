# 03 · Simulator on the real ML service

## Context

`ARCHITECTURE.md` §5: the simulator calls `POST /ml/predict` directly (deterministic, no LLM) and should build its controls from `GET /ml/model-info`, so limits are not hard-coded. The prediction target is OPEN, which is why `src/lab/Predictor.tsx` knows no field names: it renders enums as choices, floats as sliders and outputs by their type.

Do not confuse it with `src/lab/FlameSim.tsx`, the illustrative explainer of gravity, oxygen and airflow. That one never calls the backend, because PSI has no partial-gravity data and the model has no gravity input.

## Before you write code

Call the live `/ml/model-info` and one `/ml/predict`. Compare both with `ModelInfo` and `PredictResponse` in `src/api/types.ts` and report the differences. Check specifically: are the outputs top-level fields of the response, as the scaffold assumes? Does the response carry `in_tested_range`, the out-of-range fields, `model_version`, `training_source`, and nearest tested experiments?

## Task

1. Adapt `types.ts`, `client.ts` and `mock.ts` together to what the service really returns. Keep the predictor generic: no `if (key === "o2")`.
2. Out of range: when `in_tested_range` is false, name the fields that left the range next to their sliders, not only in the tag row.
3. If the response lists nearest tested experiments, show them under the outputs as links to their PSI investigation pages.
4. If the model declares composition inputs that must sum to at most 1 (for example O₂, CO₂ and He as mole fractions), make the interface respect it and show the remaining balance as N₂. Only do this if `model-info` gives you enough to know; otherwise leave the sliders independent and say so.
5. Loading and failure: the previous prediction stays visible while the next one loads; a failed prediction explains itself and the explainer above keeps working.

## Optional, only if the target is flame extinction

Add one sentence under the outputs connecting the prediction to the explainer in plain words ("At these conditions the model expects the droplet flame to go out"). Do not drive the illustrative picture from the prediction: the picture would then look like data.

## Done when

`pnpm check` and `pnpm test` pass, sample mode still works with `VITE_API_URL` empty, and you have exercised the predictor against the live service, including an out-of-range request.
