# Prediction flow: Flame Lab → MCP → engine

Context document for the Flame Lab predictions. It can be read on its own, with no other context. Written
2026-11-15.

> **Status.** The team **decided** this flow. It replaces the rule in `ARCHITECTURE.md` §5 that says *"the
> simulator calls engine directly, no LLM"*. `ARCHITECTURE.md` has **not** been updated yet, so if the two
> documents disagree on the simulator path, **this document wins**. Names marked *(proposed)* (routes, field
> names) are suggestions that the service owners can change, as long as every side changes together.

---

## 1. What the user gets

In the Flame Lab view, the user sets the conditions of a FLEX droplet test and presses **Predict**. The view
then shows:

1. **The prediction (numbers from the models):**
   - The probability that the flame **goes out on its own** (extinction) or not.
   - If it goes out: the **droplet diameter at extinction** and the **share of the fuel that burned** first.
2. **How well real tests back the prediction (k-NN):** whether the conditions were tested on the ISS, how many
   real tests are close, a confidence level, and the closest real tests with their actual outcome.
3. **An explanation in plain language**, written by the LLM, in a panel in the lower-right corner. It explains
   what the user is seeing and what the k-NN found, and cites the real tests.

The numbers always come from engine. The LLM only explains them and never writes or changes a number.

## 2. Background (minimum needed)

- **FLEX** (PSI-69) burned **single fuel droplets** on the ISS, in microgravity: 274 tests. Each test sets a
  fuel, a pressure, an oxygen fraction, an optional suppressant gas and an initial droplet size, and records how
  the flame ended.
- **Suppressant:** a gas added to the atmosphere to put the flame out. FLEX tested **CO₂** and **helium (He)**,
  one at a time, never together. The rest of the mixture is N₂.
- **D₀ / D_ext:** the diameter of the **droplet** (not the flame) at ignition / when the flame went out.
- **Gravity is not a variable.** Every FLEX test is in microgravity; PSI has no partial-gravity data. Nothing in
  this flow takes gravity, airflow or oxygen above 34 %.

## 3. The models (trained offline in the `train` repo)

Two predictive models, each with its own k-NN. All four are trained and exported by `train`
(`python main.py train export --config configs/training/<model>.toml`). Each artifact is a folder
`artifacts/models/<model>-<version>/` with `model.joblib`, `support.joblib`, `support_reference.csv` and
`model_info.json`. engine loads both folders.

| Artifact | Algorithm | Question it answers | Output | Trained on |
|---|---|---|---|---|
| `flex-outcome` (`model.joblib`) | Logistic regression (classifier) | Does the flame go out on its own before the fuel is used up? | `outcome` (`extinction` / `no_extinction`, threshold 0.5) and `probabilities` | 251 tests |
| `flex-outcome` (`support.joblib`) | k-NN, one per fuel | How many real tests resemble this query? | Support fields (§5.3) | the same 251 |
| `flex-extinction` (`model.joblib`) | Gradient boosting regression | If the flame goes out, at what droplet size? | `extinction_diameter_ratio` = D_ext/D₀ (0–1) and `extinction_diameter_mm` | 156 tests that ended in extinction with a measured D_ext |
| `flex-extinction` (`support.joblib`) | k-NN, one per fuel | Same, among those 156 tests | Support fields (§5.3) | the same 156 |

Meaning of the classes:
- `extinction`: the flame went out on its own, with fuel still left in the droplet.
- `no_extinction`: the droplet burned completely, **or** it broke apart (disruption) before the flame went out.

`flex-extinction` is **conditional on extinction**: its value only makes sense when the flame goes out. It is
always computed, but it is shown only when `outcome.prediction.label == "extinction"` (§5.4).

The k-NN does **not** predict anything about the fire. It finds the real tests closest to the query (same fuel,
standardized pressure, O₂, CO₂, He, D₀) to say how much data backs the prediction. Each model has its own k-NN
because the two were trained on different tests, so their support can differ.

## 4. Sequence

```
User sets 6 inputs, presses [Predict]       (no request while the sliders move)
  │
  ▼
Frontend ── POST /lab/predict ──► Gateway ──► MCP /lab/predict
                                                   │ 1. validate the body shape
                                                   │ 2. POST ${ENGINE_URL}/predict ──► engine
                                                   │        runs flex-outcome + its k-NN
                                                   │        runs flex-extinction + its k-NN
                                                   │        computes fuel_burned_fraction
                                                   │    ◄── prediction JSON (§5.3)
                                                   │ 3. read the TestSheets of the nearest tests
                                                   │    from corpus.db (lookup by ID, §6)
                                                   │ 4. one LLM call: prediction + TestSheets → explanation
                                                   ▼
Frontend ◄── { prediction (engine JSON, verbatim), explanation, cited_tests } ──
  │
  ▼
Lab renders the numbers, the droplet drawing and the support panel from `prediction`;
the lower-right panel renders `explanation`.
```

- **One request per press of Predict.** The button is what limits the LLM load. The frontend disables the
  button while a request is running.
- The **controls** are built from the models' own description, so the frontend never hard-codes ranges:
  `GET /lab/model-info`, which the gateway sends to the MCP and the MCP forwards to engine `GET /model-info`.
  No LLM is involved.
- engine stays **internal** (Compose network). The gateway only exposes the MCP routes.
- The chatbot can use the same engine `/predict` through its `predict` tool. The contract is the same.

## 5. Contracts

### 5.1 Inputs (the same for both models)

| Field | Type | Tested range (from `model_info.json`) | Meaning |
|---|---|---|---|
| `fuel` | enum | `heptane`, `methanol` | Fuel of the droplet |
| `pressure_atm` | float | 0.69 – 1.02 atm | Chamber pressure. Only **two levels** were tested (≈ 0.7 and ≈ 1.0); values between them are flagged by the k-NN |
| `o2` | float | 0.12 – 0.34 (outcome model); 0.12 – 0.30 (extinction model) | Oxygen mole fraction |
| `suppressant` | enum | `none`, `co2`, `he` | Which suppressant gas is added |
| `suppressant_fraction` | float | `none`: 0; `co2`: 0.05 – 0.50; `he`: 0.05 – 0.45 | Mole fraction of that gas. **The range depends on `suppressant`** (`by_selector` in `model_info.json`) |
| `droplet_d0_mm` | float | ≈ 1.1 – 4.7 mm | Initial droplet diameter |

The exact limits are the ones `GET /model-info` returns. The numbers above are rounded and only illustrative.

Rules (engine enforces them):
- `suppressant = "none"` requires `suppressant_fraction = 0`.
- `o2 + suppressant_fraction ≤ 1` (N₂ is the rest).
- A value **outside its tested range is not an error.** The prediction is still returned, the field is listed in
  `out_of_range_fields`, and `confidence` becomes `low`.
- A missing or unknown field, an unknown enum value, or a broken rule above is an error (422).
- The droplet is always free-floating. The models also use `fiber`, but it is fixed to `false` and not exposed.

### 5.2 MCP route *(implemented in `mcp/`: `src/lab.ts`; the full contract is in `mcp/README.md`)*

`POST /lab/predict`, the same path through the gateway (public) and on the MCP (internal).

```json
{ "inputs": { "fuel": "methanol", "pressure_atm": 1.0, "o2": 0.21,
              "suppressant": "none", "suppressant_fraction": 0.0, "droplet_d0_mm": 3.0 },
  "language": "es" }
```

`language` is the browser language (`navigator.language`, falling back to `en`; decided 2026-11-15). The Lab has
no free-text message, so the LLM cannot infer the language from one.

Response:

```json
{ "prediction":  { "...": "engine /predict response, unchanged (§5.3)" },
  "explanation": "Texto en el idioma pedido …",
  "cited_tests": [ { "testsheet_id": "FLEX-046", "cir_id": "205R001", "test_end": "disruption",
                     "label": "\"FLEX-046_TestSheet\". FLEX (PSI-69), folder Raw Data.",
                     "investigation_url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-69" } ] }
```

`cited_tests` are the closest tests the explanation names (all of them when it names none). `explanation` is
`null` when the LLM failed. `GET /lab/model-info` returns engine's `GET /model-info` unchanged.

### 5.3 engine `POST /predict` *(implemented in `engine/`; the source of truth is engine's OpenAPI)*

One call runs both models. engine takes what `train`'s reference inference (`flame.training.inference.
reference_predict`, copied verbatim into engine) returns for each model and splits it into three parts:
**`prediction`** (what the model predicts), **`support`** (its k-NN, plus the threshold it used) and **`model`**
(which model answered, to cite it). It adds one derived field, `fuel_burned_fraction`.

```json
{
  "outcome": {
    "prediction": {
      "label": "extinction",
      "probabilities": { "extinction": 0.587, "no_extinction": 0.413 }
    },
    "support": {
      "in_tested_range": true,
      "out_of_range_fields": [],
      "support_n": 10,
      "threshold": 0.830,
      "confidence": "medium",
      "nearest_tests": [
        { "cir_id": "205R001", "testsheet_id": "FLEX-046", "test_end": "disruption",
          "conditions": { "fuel": "methanol", "pressure_atm": 1.0125, "o2": 0.21, "co2": 0.0, "he": 0.0, "d0_mm": 2.78 },
          "distance": 0.361 },
        "… 4 more, closest first"
      ]
    },
    "model": {
      "model_version": "flex-outcome-0.2",
      "training_source": { "dataset": "flex_tests", "accession": "PSI-69", "sha256": "…", "rows": 251 }
    }
  },
  "extinction": {
    "prediction": {
      "extinction_diameter_ratio": 0.445,
      "extinction_diameter_mm": 1.336,
      "fuel_burned_fraction": 0.912
    },
    "support": { "in_tested_range": true, "out_of_range_fields": [], "support_n": 11, "threshold": 1.016,
                 "confidence": "high", "nearest_tests": [ "… same shape …" ] },
    "model": {
      "model_version": "flex-extinction-0.2",
      "training_source": { "dataset": "flex_tests", "accession": "PSI-69", "sha256": "…", "rows": 156 }
    }
  }
}
```

The values are the `iss_like_air` reference query (methanol, 1.0 atm, O₂ 0.21, no suppressant, D₀ 3.0 mm) of
the `flex-outcome-0.2` and `flex-extinction-0.2` model cards, rounded; the API returns full floats. The nearest
test shown is the real closest one, recomputed from `support_reference.csv`.

`support` fields (the k-NN), the same in both blocks. Each model has its own k-NN, over the training tests of
the queried fuel only:

| Field | Meaning |
|---|---|
| `in_tested_range` | `true` only if every input is inside its own tested range **and** the closest real test is within `threshold`. It catches combinations that were never tested even when each value is in range |
| `out_of_range_fields` | Inputs outside their own tested min/max |
| `support_n` | Number of real tests of the same fuel within `threshold` |
| `threshold` | The "near" distance of this model and fuel: the 95th percentile of the distance from each training test to its nearest other test (outcome: methanol 0.830, heptane 0.724; extinction: methanol 1.016, heptane 1.324). A query is near when it is as close to a real test as the real tests are to each other |
| `confidence` | `low` if out of range or `support_n < 3`; `high` if in range, `support_n ≥ 5` and, for the classifier, the predicted label has probability ≥ 0.7; otherwise `medium`. The rule lives in the training config |
| `nearest_tests` | The 5 closest real tests, closest first: `cir_id` (CIR test number), `testsheet_id` (e.g. `FLEX-007`, the key to its TestSheet), `test_end` (the real outcome: `extinction` / `disruption` / `completion`), `conditions` (the fuel, `pressure_atm`, `o2`, `co2`, `he` and `d0_mm` of that real test), `distance` |
| `distance` | Euclidean distance over pressure, O₂, CO₂, He and D₀, each divided by its standard deviation in that fuel's training tests. For methanol (outcome model), 1 unit ≈ 0.15 atm, 0.05 of O₂, 0.15 of CO₂, 0.12 of He or 0.63 mm of D₀. 0 = identical. Distances of the two blocks are not comparable |

Derived field, computed by engine (not by the LLM, not by the frontend):
- `fuel_burned_fraction = 1 − (extinction_diameter_ratio)³`: the share of the droplet's volume that burned
  before the flame went out. The cube is used because volume scales with D³.

### 5.4 Presentation rules shared by every consumer

- The extinction block is shown **only when `outcome.prediction.label == "extinction"`**. Otherwise the droplet burned
  out or broke apart, and a diameter at extinction has no meaning.
- The support of each block belongs to that block: classifier support next to the probabilities, extinction
  model support next to the diameter.
- `burning_rate_mm2_s` is **not** predicted by any model and must not appear.

## 6. How the MCP gets the real tests

The corpus (`corpus.db`, built by `train`, read-only in the MCP) contains the **original TestSheet of every FLEX
test** (272 documents, `doc_type = 'testsheet'`). Each one holds the conditions (pressure, O₂, N₂, CO₂, He,
temperature), the fuel, D₀, the burning rate, D_ext or how the test ended, and the investigator's comments.

The TestSheet of `nearest_tests[].testsheet_id` `FLEX-046` is the document titled **`FLEX-046_TestSheet`** (the
file name without `.txt`; checked on the 272 TestSheets of the current `corpus.db`). The lookup is exact and needs
no search; the MCP also accepts the bare id as a title, in case a later corpus build changes it:

```sql
SELECT d.title, d.psi_folder, c.text
FROM documents d JOIN chunks c USING (doc_id)
WHERE d.accession = 'PSI-69' AND d.doc_type = 'testsheet'
  AND d.title IN ('FLEX-046_TestSheet', 'FLEX-046', …)
ORDER BY d.title, c.chunk_index;
```

Each TestSheet is a single fragment of 550–1320 characters, so the explanation gets them whole.

A `testsheet_id` can be null for a test without a published TestSheet. Such a test is cited by `cir_id` only,
without TestSheet text.

Citation format for a test: the TestSheet name plus the PSI investigation page, never a file URL:
*FLEX-007 TestSheet, FLEX (PSI-69), folder Raw Data. <https://psi.nasa.gov/physci/repo/data/investigations/PSI-69>*

## 7. What the LLM explanation must contain

Input to the LLM: the engine JSON, the TestSheets of the nearest tests (deduplicated across the two blocks) and
`language`. One call, no tools needed.

The explanation must:
1. **Say what the prediction is:** the extinction probability, and, only when the outcome is extinction, the
   diameter at extinction and the share of fuel burned, in simple words.
2. **Say what the k-NN found:** whether the conditions are inside the tested range, how many real tests are
   close (`support_n`), and the confidence level. If `in_tested_range` is false, it must say so clearly and name
   the out-of-range inputs.
3. **Point to real tests:** the closest ones, their real outcome (`test_end`), and how their conditions compare,
   using the TestSheet text. For example: *"the closest real test, FLEX-0NN (methanol, 1 atm, 21 % O₂), also
   ended in extinction"*.
4. **Stay grounded:** use only the numbers in the engine JSON and the TestSheets, and never compute, round
   differently or invent values. When the closest tests disagree with the prediction (for example, a predicted
   extinction whose nearest tests mostly ended in disruption), it must say so.
5. Be written in `language`, keep technical terms and units exact (CO₂, He, D₀, atm), and cite the tests (§6).
6. Not give safety advice beyond the data. Predictions are valid only inside the conditions FLEX tested.

## 8. Failures

| Failure | Behavior |
|---|---|
| Invalid inputs (422 from engine) | MCP returns 422 `{ "error": "invalid_inputs", "detail": "<engine message>" }`; no LLM call. The frontend shows the message next to the controls |
| engine down | MCP returns 502 `predict_unavailable` (`model_info_unavailable` for `/lab/model-info`); nothing to show |
| TestSheet lookup fails | Continue: the LLM explains with the engine JSON only and cites the tests by ID |
| LLM fails or times out | Return the `prediction` with `explanation: null`. The frontend shows the numbers and a short "explanation unavailable" note |

## 9. Work per repo

| Repo | Work |
|---|---|
| `train` | Export both models with their k-NN (`flex-outcome-0.2`, `flex-extinction-0.2`). `model_info.json` describes inputs, ranges and the library versions engine must match. Done: each nearest test carries its `conditions` |
| `engine` | Load both artifact folders. `POST /predict` runs both models and returns §5.3. `GET /model-info` returns the inputs (including `by_selector` ranges) and outputs of both models. Compute `fuel_burned_fraction`. Use the scikit-learn version recorded in `model_info.json`. Replace the template `/predict`. **Implemented** (not run yet): `engine/app/flex.py`, `app/inference.py` (verbatim copy from train), `models/`, `tests/test_predict.py` |
| `mcp` | `POST /lab/predict` and `GET /lab/model-info`: call engine, look up the TestSheets (§6), build the explanation prompt (§7), handle failures (§8). **Implemented and tested** against mocked engine and LLM and the real `corpus.db` (`src/lab.ts`, `src/engine.ts`, `src/testsheets.ts`, `test/lab.test.ts`) |
| `gateway` | Route `/lab/*` to the MCP, with the `/chat` timeout for `/lab/predict` (it waits for the LLM). **Implemented and tested** (`api-gateway/src/lab/lab.controller.ts`). The old `/ml/*` routes are gone: no route reaches the engine |
| `frontend` | Described in a separate document: what the Lab must show, given what the models predict |

## 10. Open points

- ~~How the artifacts reach engine.~~ Decided: both folders are committed in `engine/models/` and baked into the image (no volumes).
- The final names of the routes and fields marked *(proposed)*.
- Whether the explanation is streamed. Not needed for the first tests.
- `ARCHITECTURE.md` still describes the old simulator path (§5) and the draft `/predict` schema. It should be
  updated when the team decides to.
