# Flame Lab: what the frontend must show

Context document for the frontend developer and their agent. Written 2026-11-15. Read it together with
`prediction_flow.md`, which explains the request flow and the full contracts. This document only covers the
frontend.

> **Rule behind every change: the frontend adapts to what the models predict, not the other way round.** If
> something on screen is not produced by a model, by its k-NN or by a calculation from them, it does not belong
> in the Flame Lab.
>
> **Status.** The team **decided** this flow. Where `frontend/docs/ARCHITECTURE.md` (§5) or `src/api/types.ts`
> disagree with this document on the Flame Lab, this document wins. The prediction target is no longer OPEN for
> the Lab: it is the two FLEX models below. Route and field names marked _(proposed)_ must be confirmed with the
> MCP and gateway owners.

---

## 1. What the models predict (the only things the Lab can show)

All the data comes from **FLEX** (PSI-69): 274 tests on the ISS that burned **single fuel droplets in
microgravity**. Two models were trained on it, and each one has a **k-NN** that compares the request with the
real tests.

| Component                         | Question it answers                                           | What it gives the Lab                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Outcome model** (classifier)    | Does the flame go out on its own before the fuel is used up?  | The probability of `extinction` and of `no_extinction`, and the predicted class                                                                              |
| **Extinction model** (regression) | If the flame goes out, how big is the droplet at that moment? | `extinction_diameter_mm` (D_ext), `extinction_diameter_ratio` (D_ext/D₀) and `fuel_burned_fraction`                                                          |
| **k-NN of each model**            | How many real ISS tests look like this request?               | Whether the request is inside the tested conditions, how many real tests are close, a confidence level, and the 5 closest real tests with their real outcome |
| **LLM** (through the MCP)         | What does the user see, in plain words?                       | An explanation of the prediction and of what the k-NN found, citing the real tests                                                                           |

Words the interface needs:

- **Extinction:** the flame goes out on its own, with fuel still left in the droplet.
- **No extinction:** the droplet burns completely, **or** it breaks apart before the flame goes out. The model
  does not separate these two cases.
- **D₀:** the droplet's diameter at ignition, an input. **D_ext:** the droplet's diameter when the flame goes
  out. These are diameters of the **fuel droplet, not of the flame**.
- **Suppressant:** a gas added to the atmosphere to put the flame out. FLEX tested CO₂ and helium, one at a time,
  never both together. The rest of the gas is N₂.

What the models **cannot** say, so the Lab must not show it:

- **Gravity.** Every test is in microgravity. Gravity is not a variable anywhere in the Lab.
- **Airflow**, flame shape, flame colour, and oxygen above 34 %.
- **Burning rate** (`burning_rate_mm2_s`). No model predicts it.
- **Three outcome classes** (extinction / completion / disruption). The model has two.

## 2. Summary of changes

| Area                                                             | Action                                                                               |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `FlameSim` (flame illustration with gravity, oxygen and airflow) | **Remove** (§3)                                                                      |
| `Predictor`                                                      | **Rework**: controls from model-info, a **Predict** button, specific outputs (§4–§6) |
| Explanation                                                      | **New**: shown in the assistant dock, bottom right (§7)                              |
| API layer (`types.ts`, `client.ts`, `queries.ts`, `mock.ts`)     | **Update** to the new routes and shapes (§8)                                         |
| Section copy in `routes/flame-lab.tsx`                           | **Rewrite** without gravity (§3)                                                     |

## 3. Remove the flame illustration

`FlameSim` is an illustrative model of gravity, oxygen (10–100 %) and airflow (0–40 cm/s). No model predicts
any of that, so it goes.

- Delete `src/lab/FlameSim.tsx`, `src/lab/flameModel.ts`, `src/lab/flameModel.test.ts`, `src/lab/flameCanvas.ts`
  and `src/lab/lab.css`. Check with a search that nothing else imports them.
- In `src/lab/ParamSlider.tsx`, remove what only FlameSim used (the `gravity` variant and the `gap` band), unless
  something else uses it.
- `routes/flame-lab.tsx`: drop the `<FlameSim />` block and rewrite the section copy. The current title
  (_"Change gravity. Watch the flame change."_) and lead talk about gravity and a breeze. Suggested copy (change
  it freely, without bringing gravity back):
  - Title: _"Set a test. See if the flame goes out."_
  - Lead: _"Choose the fuel, the atmosphere and the droplet size of an ISS droplet test. The models trained on
    274 FLEX tests predict the outcome and show which real tests back it."_
- The "Illustrative model" and "Interpolated" labels go away with FlameSim, because what they described no
  longer exists. That is consistent with the honest-labels rule in `frontend/CLAUDE.md`.
- Add a visible tag **"Microgravity (ISS) data only"** to the Lab. It uses the `flame-blue` accent, per the
  "blue in free fall" rule in `DESIGN.md`.

## 4. Layout

Suggested layout at desktop width. On a phone (390 px) the columns stack: inputs, Predict button, results.

```
┌──────────────────────────── Flame Lab ─────────────────────────────┐
│ Set a test. See if the flame goes out.        [Microgravity (ISS)] │
├──────────────────────────┬─────────────────────────────────────────┤
│ INPUTS                   │ OUTCOME                                 │
│ Fuel   [heptane][methanol]│ Flame goes out on its own   ████░  59 %│
│ Pressure  ──●──── atm    │ Burns out or breaks apart   ██░░░  41 %│
│ Oxygen    ───●─── O₂     │ Support: medium · 10 real tests close   │
│ Suppressant [none][CO₂][He]│                                        │
│ Amount    ──●──── (by gas)│ DROPLET  (only if extinction)          │
│ Droplet D₀ ──●─── mm     │   ◯ D₀ 3.0 mm  ◉ D_ext 1.34 mm          │
│                          │   91 % of the fuel burned first         │
│ [ Predict ]              │   Support: high · 11 real tests close   │
│                          │                                         │
│                          │ CLOSEST REAL TESTS                      │
│                          │   FLEX-0NN · 205R001 · went out         │
│                          │   …                                     │
│                          │ flex-outcome-0.1 · flex-extinction-0.2  │
│                          │ Trained on FLEX (PSI-69), 251/156 tests │
└──────────────────────────┴─────────────────────────────────────────┘
                                         explanation → assistant dock ↘
```

## 5. Inputs and the Predict button

### Controls come from model-info

The Predictor keeps its current principle: **controls are built from `GET /mcp/lab/model-info`** _(proposed)_,
so no range is hard-coded. The six inputs:

| Input                  | Control                                           | Notes                                                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `fuel`                 | Choice: `heptane` / `methanol`                    |                                                                                                                                                                                                               |
| `pressure_atm`         | Slider, min/max from model-info (≈ 0.69–1.02 atm) | Only two pressure levels were tested (≈ 0.7 and ≈ 1.0 atm). Values between them get `in_tested_range: false` from the k-NN; that is expected, not a bug                                                       |
| `o2`                   | Slider (≈ 0.12–0.34 mole fraction)                | Showing it as a percentage is fine (`21 %`), but send the mole fraction                                                                                                                                       |
| `suppressant`          | Choice: `none` / `CO₂` / `He`                     | Replaces the two old CO₂ and He sliders                                                                                                                                                                       |
| `suppressant_fraction` | Slider whose **range depends on `suppressant`**   | Read it from `inputs.suppressant_fraction.by_selector[<suppressant>]` (≈ CO₂ 0.05–0.50, He 0.05–0.45). With `none`, hide or disable it and send `0`. When the gas changes, clamp the value into the new range |
| `droplet_d0_mm`        | Slider (≈ 1.1–4.7 mm)                             |                                                                                                                                                                                                               |

`ModelInput` in `types.ts` needs a `by_selector` field for this (§8). All the ranges above are rounded and
illustrative: use the ones model-info returns.

Rules the backend enforces. The UI can prevent them, but it must also show the backend error if they happen:

- `o2 + suppressant_fraction ≤ 1`.
- `suppressant = none` requires `suppressant_fraction = 0`.

### The button

- **No automatic predictions.** Remove the debounced query: a request goes out only when the user presses
  **Predict**. Each press costs an LLM call.
- Disable the button while a request is running, and show a waiting state on it.
- If the user changes an input after a result, keep the result on screen but mark it **"Conditions changed:
  press Predict to update"**, so it is never read as the result of the new conditions.
- Use a mutation (TanStack `useMutation`), not a query keyed on the inputs.

## 6. Outputs

The response has two blocks, `prediction.outcome` and `prediction.extinction`, plus `explanation` and
`cited_tests` (full shape in `prediction_flow.md` §5). Every number shown comes from `prediction`. Never take a
number from the explanation text.

### 6.1 Outcome (always shown)

- Two probability bars from `prediction.outcome.probabilities`:
  - `extinction` → **"Flame goes out on its own"**
  - `no_extinction` → **"Burns out or breaks apart"**
- A short verdict line from `prediction.outcome.outcome`, e.g. _"Predicted: the flame goes out on its own"_.
- The support of this block next to it (§6.3).

### 6.2 Droplet at extinction (only when `prediction.outcome.outcome == "extinction"`)

- **Drawing:** two concentric circles **to scale**: D₀ (the input) outline, D_ext filled. The ratio
  `extinction_diameter_ratio` is the scale between them. This is the visual replacement for the flame. It is
  static and needs no animation (`DESIGN.md`: numbers do not count up).
- **Readouts:** `D₀` (mm, the input), `D_ext` (`extinction_diameter_mm`), and **fuel burned before extinction**
  = `fuel_burned_fraction` as a percentage. engine computes it; the frontend does not.
- The support of the extinction block next to it (§6.3).
- When the outcome is `no_extinction`, **do not show a diameter.** Show one line instead: _"No extinction
  predicted: the droplet burns out or breaks apart before the flame goes out."_ The extinction model only
  applies when the flame goes out.

### 6.3 Support from real tests (k-NN), one per block

Each block (`outcome`, `extinction`) carries its own support fields. Show them per block, because the two models
were trained on different tests.

| Field                 | Show as                                                                                                                                                    |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `confidence`          | Tag: `high` → "High confidence" (`nominal`), `medium` → "Medium confidence", `low` → "Low confidence" (`ember`). Always with the word, not only the colour |
| `in_tested_range`     | `true` → "Inside the tested conditions". `false` → **"Outside the tested conditions"** (`ember` tag)                                                       |
| `out_of_range_fields` | One tag per input, with the humanized name (e.g. "O₂")                                                                                                     |
| `support_n`           | _"10 real tests close to these conditions"_; with 0: _"No real test close to these conditions"_                                                            |
| `nearest_tests`       | A list of the closest real tests (below)                                                                                                                   |

Closest real tests: deduplicate the two blocks' `nearest_tests` by `testsheet_id` (or by `cir_id` when it is
null), keep the k-NN order, and show at most 5. For each one:

- `testsheet_id` (e.g. `FLEX-007`) and `cir_id` (e.g. `205R001`) in mono type.
- The real outcome, `test_end`: `extinction` → "went out", `completion` → "burned out", `disruption` → "broke
  apart".
- A link to the PSI investigation page `https://psi.nasa.gov/physci/repo/data/investigations/PSI-69` (use the
  existing `investigationUrl`). Never a file URL.
- `distance` is internal: do not show it, or show it only as the order.

### 6.4 Source line

Under the results: both `model_version` values and the training data from `training_source` (now an **object**:
`dataset`, `accession`, `rows`). For example: _"flex-outcome-0.1 · flex-extinction-0.2 · trained on FLEX
(PSI-69), 251 and 156 tests. Valid only within the conditions tested on the ISS."_ Do not print the object
directly (it would render as `[object Object]`), and do not show `sha256`.

## 7. The explanation (assistant dock, bottom right)

The bottom-right corner is the assistant (`AssistantDock`, present in every view). The Lab's explanation is
delivered there, as an assistant message, so the user can ask follow-up questions about it in the chat.

- When a Lab request starts, the face shows the waiting state. When it returns, add an assistant message with
  `explanation` and, as its citations, `cited_tests` (TestSheet name + PSI-69 investigation page; adapt them to
  the existing `Citation` type).
- If the dock is closed, use the existing unread indicator. Whether to open it automatically on the first
  prediction is a design choice.
- Mark the message as coming from the Lab (e.g. an eyebrow "Flame Lab prediction"), and add it to the chat
  history, so a follow-up question has the context.
- `explanation: null` (the LLM failed): the results still show. The message says _"The explanation is not
  available right now; the numbers above come straight from the models."_, and the face shows the failed state.
- The explanation text is already in the user's language (the backend's job). Send `language` with the request
  (§8).
- Implementation hint: the chat state lives inside `AssistantDock` (`useChat`). The Lab needs a way to add a
  message, for example by lifting `useChat` into a context provided in `routes/__root.tsx`. Choose the way
  that fits the codebase.

## 8. API layer

The Lab no longer talks to `/ml/*`. Everything goes through the MCP. Route names _(proposed)_; confirm them with
the gateway owner (`api-gateway/`):

| Old                                     | New                                                  |
| --------------------------------------- | ---------------------------------------------------- |
| `GET /ml/model-info`                    | `GET /mcp/lab/model-info`                            |
| `POST /ml/predict` (body = flat inputs) | `POST /mcp/lab/predict`, body `{ inputs, language }` |

`types.ts`, draft types (adapt the names; keep them tolerant of missing fields until the backend is live):

```ts
type Confidence = "low" | "medium" | "high";

interface NearestTest {
  cir_id: string | null;
  testsheet_id: string | null; // e.g. "FLEX-007"
  test_end: "extinction" | "completion" | "disruption" | string | null;
  distance: number;
}

interface Support {
  in_tested_range: boolean;
  out_of_range_fields: string[];
  support_n: number;
  nearest_tests: NearestTest[];
  confidence: Confidence;
  model_version: string;
  training_source: { dataset: string; accession: string; sha256: string; rows: number };
}

interface OutcomeBlock extends Support {
  outcome: "extinction" | "no_extinction";
  probabilities: { extinction: number; no_extinction: number };
}

interface ExtinctionBlock extends Support {
  extinction_diameter_ratio: number; // D_ext / D0, 0..1
  extinction_diameter_mm: number;
  fuel_burned_fraction: number; // 1 - ratio^3, computed by engine
}

interface LabPredictRequest {
  inputs: {
    fuel: string;
    pressure_atm: number;
    o2: number;
    suppressant: "none" | "co2" | "he";
    suppressant_fraction: number;
    droplet_d0_mm: number;
  };
  language: string; // UI language, e.g. "en", "es"
}

interface LabPredictResponse {
  prediction: { outcome: OutcomeBlock; extinction: ExtinctionBlock };
  explanation: string | null;
  cited_tests: { testsheet_id: string | null; cir_id?: string | null; investigation_url: string }[];
}

// ModelInput gains a per-choice range for suppressant_fraction:
type FloatInput = {
  type: "float";
  min: number;
  max: number;
  unit?: string;
  label?: string;
  default?: number;
  by_selector?: Record<string, { min: number; max: number }>;
};
```

Model-info: the controls use the **outcome model's** inputs, which have the wider ranges. The extinction model
was trained on fewer tests (O₂ up to ≈ 0.30). When a request is outside its range, the extinction block's own
support says so, so the frontend does not need a second set of controls.

- `client.ts` stays the only place that calls `fetch`. A 422 means invalid inputs: show the message next to the
  controls. A 502 means the service is down: keep the current "service is not answering" message.
- `queries.ts`: keep `modelInfoQuery`; replace `predictionQuery` with a mutation.
- `mock.ts`: update `MODEL_INFO` and the sample prediction to the new shape, and keep the **"Sample output"**
  label until the backend is connected. Realistic sample values (model card reference query `iss_like_air`:
  methanol, 1.0 atm, O₂ 0.21, no suppressant, D₀ 3.0 mm):
  - outcome `extinction`, probabilities 0.587 / 0.413, confidence `medium`, `support_n` 10;
  - D_ext/D₀ 0.445, D_ext 1.336 mm, fuel burned 0.912, confidence `high`, `support_n` 11.

  Placeholder test IDs must look like placeholders (`FLEX-0NN`).

- `labels.ts`: add `suppressant_fraction` → "Amount", and the class and `test_end` wordings from §6.

## 9. Checklist

- [ ] No gravity, airflow, flame shape or flame colour anywhere in the Lab.
- [ ] No burning rate and no three-class outcome.
- [ ] Predictions only on **Predict**; button disabled while waiting; stale result marked after an edit.
- [ ] Suppressant as a choice + amount slider whose range follows the chosen gas.
- [ ] Two probability bars; the droplet drawing and D_ext only when the outcome is extinction.
- [ ] Support shown per block: confidence, in/out of tested conditions, out-of-range inputs, `support_n`.
- [ ] Closest real tests listed with their real outcome and a link to the PSI-69 page.
- [ ] Explanation appears in the assistant dock and is added to the chat history; `null` handled.
- [ ] `training_source` rendered from the object; no `[object Object]`.
- [ ] Every number on screen comes from the engine response, none from the explanation text.
- [ ] `pnpm check` and `pnpm test` pass; checked at 1280 px and 390 px, keyboard only, and with reduced motion.
