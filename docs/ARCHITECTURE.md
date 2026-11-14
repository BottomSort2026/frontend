# Flame in Freefall — Architecture, Problem & Data Overview

NASA Space Apps Challenge 2026 · Challenge: *Flame in Freefall*

---

## 0. Purpose of this document (read first)

This document is the **shared context base for every agent and team member** working on the project. Its job
is to keep everyone aligned on the problem, the data and the architecture.

Rules for agents:
- Treat **DECIDED** items as constraints. Do not redesign them without the team's approval.
- Treat **OPEN** items as undecided. Do not assume a choice. Ask, or keep the implementation flexible.
- Values marked *illustrative* or *draft* are examples, not real data or final contracts.
- When the code and this document disagree, flag it. Do not silently follow either one.

### Decision status

| Topic | Status | Summary | Section |
|---|---|---|---|
| Product | DECIDED | AI-powered web dashboard with three views: Information, Chatbot, Simulator | §1, §5 |
| Services | DECIDED | Frontend, API Gateway, MCP (includes the agent `/chat`), ML, DATA_PROVIDER | §5 |
| Deployment | DECIDED | **Docker Compose**: one Dockerfile per service, one root `compose.yaml`. **No Kubernetes** | §5 |
| Protocol | DECIDED | REST + JSON between services; no gRPC | §5 |
| Corpus | DECIDED | Static corpus, built offline, in a read-only SQLite file inside MCP | §5, §6 |
| Language | DECIDED | The LLM **searches in English** and **answers in the user's language** | §5 |
| Citations | DECIDED | Cite the specific document and page, plus the PSI investigation page link (never a file URL) | §5 |
| ML contract | DECIDED | One `/predict` endpoint, shared by the simulator (via the gateway) and MCP (internal) | §5 |
| Prediction target | **OPEN** | Being defined by the data team; FLEX (option A) is feasible now | §5 |
| DATA_PROVIDER role | **OPEN** | A runtime service, or offline build scripts only | §7 |
| Embedding model | **OPEN** | English-only is enough under the language policy | §5 |
| `profiles.json` hosting | **OPEN** | A static file behind the gateway, or a route in MCP | §7 |

### Glossary

| Term | Meaning |
|---|---|
| PSI | NASA Physical Sciences Informatics data repository |
| Accession | Investigation ID in PSI, e.g. `PSI-69` |
| μg | Microgravity |
| LOI | Limiting oxygen index: the minimum O₂ that sustains a flame |
| CIR / MDCA / MSG | ISS hardware: Combustion Integrated Rack / Multi-user Droplet Combustion Apparatus / Microgravity Science Glovebox |
| D₀ / Dext | Initial droplet diameter / droplet diameter at flame extinction |

---

## 1. Problem context

### Why fire safety in space matters

Fire is one of the most serious hazards in crewed spaceflight:
- **Apollo 1 (1967):** the crew died in a pre-launch fire in an oxygen-filled cabin.
- **Apollo 13:** an oxygen tank exploded on the way to the Moon.
- **Mir:** a crew survived a fire caused by an oxygen generator failure.
- **Artemis II:** a smoke alarm went off during the mission.

### How flames behave in free fall

In microgravity there is **no buoyancy**, so hot gases do not rise. A candle flame stops being a flickering
teardrop and becomes a dim blue sphere that gets its oxygen only by diffusion. Without buoyancy, **airflow
(ventilation) becomes a controlling variable**:
- In quiescent air, a flame can starve itself of oxygen.
- At low flow speeds, typical of cabin ventilation, some materials burn at lower oxygen concentrations than
  in 1 g, as observed in BASS.

This is why ground-based (1 g) flammability tests do not always represent behavior in space.

### NASA's fire safety pillars, and the PSI investigations behind them

| Pillar | Approach | Key PSI investigations |
|---|---|---|
| **Prevention** | Control ignition sources; select materials using flammability limits | BASS, BASS-II, Saffire-I/II/III (solids: fabrics, plastics); ACME-BRE (material flammability in still air) |
| **Detection** | Smoke and aerosol sensing in microgravity | SAME, SAME-R (smoke); DAFT, DAFT-2 (dust, same instrument) |
| **Suppression** | Extinguish flames, e.g. by diluting the atmosphere | FLEX (CO₂ and He dilution); FLEX-2 |

### Exploration atmospheres

- Spacesuits use **100 % O₂ at 4.3 psi**.
- To shorten oxygen pre-breathing before excursions, the **Moon Base and pressurized rovers** are expected to
  run at an intermediate atmosphere: **≥ 30 % O₂ at ≤ 10.2 psi (≈ 0.69 atm)**. That is more than a 40 % increase
  in oxygen concentration over Earth's air, which makes materials much more flammable.
- The highest-oxygen microgravity tests in PSI are in ACME CFI-G (an oxidizer of up to 85 % O₂ flowing from a
  spherical burner).

### Known data gaps (from the challenge)

- **No partial-gravity (lunar or Martian) combustion data in PSI yet.** Future sources include LUCI (Lunar-g
  Combustion Investigation) and FM2 (Flammability of Materials on the Moon).
- Microgravity and normal-gravity results can **bound** intermediate gravity levels.
- ACME E-FIELD Flames mimics partial gravity by applying an electric field to the ions in the flame.
- **Out of scope:** rocket and propellant fire safety. Combustion in rocket engines is effectively independent
  of gravity.

### The challenge

> Build an **AI-powered, web-based dashboard** that **summarizes, ranks, and interprets** combustion science
> investigations to deliver critical foundational insights for fire safety.

PSI makes ISS combustion results public, but the data is overwhelming: **hard to find, harder to compare,
harder yet to interpret.** It holds terabytes of heterogeneous files, legacy formats, and knowledge spread
across papers and reports.

### Objectives

| # | Objective | Where it is solved |
|---|-----------|--------------------|
| 1 | Identify investigations most relevant to the fire-safety needs of habitable crew environments (spacecraft, stations, lunar/Martian bases, pressurized rovers) | **MCP** (LLM + RAG over the corpus + investigation metadata) and dashboard ranking views |
| 2 | Extract data that supports predictive modeling of flammability and fire scenarios | **Data extraction pipeline + ML service**, exposed to the LLM via MCP. The exact prediction target is being defined by the data team (see §5) |
| 3 | Highlight research that informs next-generation fire safety controls and equipment | **MCP** (RAG over papers, reports and engineering documents) |
| + | *(Optional)* Applications of PSI data to fire safety on Earth (e.g. fine-water-mist extinguishers, smoke detection, firefighter gear) | MCP / RAG |

### Attributes the dashboard should summarize and compare

Suggested by the challenge, per investigation:
- Experimental objectives.
- Fuels, including the shape and size of the samples or burners.
- Test conditions (oxygen concentration, pressure, airflow speed).
- Variables: what changed between tests of the same investigation, and what stayed the same.
- Sensors and types of measurement.
- Similarities and differences **across** investigations.

The investigations group naturally by **shared hardware**, which is a good axis for comparison:

| Hardware | Fuel type | Investigations |
|---|---|---|
| ACME modules in the Combustion Integrated Rack (CIR) | Gaseous flames | Six ACME experiments, incl. BRE, E-FIELD, CFI-G |
| Multi-user Droplet Combustion Apparatus (MDCA) in the CIR | Liquid droplets | FLEX, FLEX-2, CFI |
| SPICE flow duct in the Microgravity Science Glovebox (MSG) | Solids and gases | BASS, BASS-II, SPICE, SLICE |

### Target users

The system serves both expert and non-expert users, so answers must work at both levels:
- **Researchers and engineers** (aerospace researchers and engineers, professors, graduate students):
  specific, technical, cited answers, e.g. *"What extinction diameters did FLEX measure for heptane in
  CO₂-diluted atmospheres?"*
- **Students and curious members of the public:** clear explanations of basic concepts, e.g. *"What is the
  difference between a flame in microgravity and a flame on Earth?"*

### Scope limits

- The system **supports**, but does not replace, material certification or engineering judgment.
- Predictions are valid only within the conditions tested in PSI.
- Lunar and Martian gravity are not directly covered by the data.

---

## 2. Data source: NASA PSI Data Repository

- Web UI: <https://psi.nasa.gov/physci/repo/search?q=combustion&data_source=psi&data_type=investigation>
- The UI is an Angular single-page app, so the HTML itself has no data. All data comes from a **public JSON
  API** (no authentication needed for public data):

| Purpose | Endpoint (`https://psi.nasa.gov/geode-py/ws/...`) |
|---|---|
| Search | `repo/search?term=combustion&source=psi&type=investigation&from=0&size=100` (Elasticsearch-style response) |
| Investigation metadata | `repo/investigations/{PSI-ID}` |
| File list (per version) | `repo/investigations/{PSI-ID}/versions` (apply `added` / `modified` / `removed` across versions to get the current set) |
| Download a file | `studies/{PSI-ID}/download?file={file_name}&redirect=false` → returns a **pre-signed S3 URL** (text) |

Notes:
- The `remote_url` values pointing to `psi.ndc.nasa.gov` are legacy and unreachable; always use the download endpoint.
- Datasets are licensed **CC0 1.0** and have DOIs (e.g. FLEX: `10.60555/mbq8-0451`).
- A minimal client lives in [`psi_client.py`](psi_client.py) (`search`, `files`, `get`).

### Scale

A `combustion` search returns **26 investigations**. Several are 0.5–2.2 TB each, mostly image archives
(`.zip`, ~1 GB each) and video (`.mp4`). **Bulk download is not feasible**; we select files deliberately.

### Investigation metadata (per investigation)

Title, acronym, objectives, hypothesis, approach, research impacts, experiment hardware, flight platform,
research / sub-research area, dates, investigators and affiliations, publications (with DOI when available),
experimental table, license, DOI.

### File organization

Each investigation has folders such as `Raw Data`, `Analyzed Data`, `Experimental table`, `Reports`,
`Science Documents`, `Presentations`, `Engineering Documents`, `Reference Data`, `metadata`.
The **Experimental table** (one CSV per investigation) is the best entry point: a summary of the test
campaign, one row per test or test day.

---

## 3. Relevant investigations

### Tier 1: directly about spacecraft fire safety

| ID | Acronym | Topic | Useful data |
|---|---|---|---|
| PSI-98 / 99 / 100 | SAFFIRE-I / II / III | Large-scale fire on uncrewed Cygnus vehicles | 2–3 samples each: validation at real scale, not training |
| PSI-26 / 25 | BASS / BASS-II | Burning and suppression of solids (PMMA, SIBAL, Nomex) | BASS-II: 129 tests (material, thickness, flow, O₂, CO, CO₂); outcome labels must come from papers |
| PSI-69 / 68 | FLEX / FLEX-2 | Droplet flame extinction, gaseous suppressants (CO₂, He) | **FLEX: 274 tests with inputs and outcomes, ready for ML** |
| PSI-102 / 101 | SAME / SAME-R | Smoke particle measurement for smoke detectors | Hundreds of XLS/XLSX files per material |
| PSI-47 | DAFT / DAFT-2 | Dust and aerosol measurement | Flight data XLS |
| PSI-62 | — | Concurrent flame-spread modeling (flamelet manifolds) | Model package |

### Tier 2: supporting physics

SPICE (PSI-107, smoke point, 470 rows), PSI-60 (SPICE analysis), PSI-115 (SAME-based smoke simulation),
ACME-BRE (PSI-20, burning-rate emulator for condensed fuels).

### Tier 3: fundamental combustion

Other ACME campaigns (PSI-10, 21, 22, 23, 159), CFI (PSI-39), PSI-117 (cool flames, clean analyzed CSVs),
PSI-142, SLICE (PSI-106).

### Excluded

PSI-181 (solder microstructure) and PSI-108 (surface-tension convection): returned by the search but not
fire related.

---

## 4. Key dataset: FLEX experimental table (PSI-69)

`data/PSI-69/PSI-69_Experimental table_FLEX.csv`: **274 ISS droplet-combustion tests**.

| Inputs (features) | Outputs (targets) |
|---|---|
| Fuel: methanol / heptane | **Test end**: Extinction (186), Disruption (61), Completion (27) |
| Ambient pressure: 526–2320 mmHg (~0.7–3 atm) | Visible flame extinction diameter (mm), 225 values |
| O₂ mole fraction: 0.12–0.34 | Burning rate (mm²/s) |
| Diluent: N₂ only (101), CO₂ (123), He (50) | Burn time (s) |
| Initial droplet diameter (mm) | |

Parsing notes:
- Encoding is **cp1252**, not UTF-8.
- Subscripts were lost in the headers: `O` means O₂, `N` means N₂, `CO` means **CO₂** (confirmed against the TestSheets).
- Measured input ranges:
  - Pressure 526–2320 mmHg.
  - O₂ 0.12–0.34; CO₂ 0–0.70; He 0–0.45.
  - D₀ 1.1–4.67 mm, with 12 rows missing D₀.
- Data-quality issue: test #114 (`C11M201`) has pressure `0`, which is a missing value, not vacuum. Exclude it
  or recover the value from its TestSheet.

Per-test files in `Raw Data`:
- `FLEX-0xx_TestSheet.txt`: conditions plus the investigator's comments (good RAG text).
- `FLEX-0xx_DropletData.txt`: droplet diameter and position over time (~30 Hz, tab-separated, **CR (`\r`) line endings**).
- `FLEX-0xx_LLUVData.txt` / `ColorCamData.txt`: camera-derived measurements.
- `FLEX-0xx_Summary.pdf`: mostly plots.

FLEX-2 (PSI-68) only publishes a design matrix (8 fuels, O₂ 0.17–0.30, 0.5–3 atm, flow 0.1–5 cm/s),
without per-test outcomes.

### Other formats seen (ACME, e.g. PSI-22)

- Test point IDs use the form `YYDDD<letter><n>`, for example `18078D1` (year 18, day 078, test D1).
- `<TP>_data.csv`: line 1 is the configuration; line 2 is a 36-column header (flows, ion current, E-field,
  PMTs, thermocouples, radiometers); ~120 Hz; time as `HH:MM:SS:mmm`; several channels are raw voltages.
- `<TP>_TP.txt` (timeline), `<TP>_VoltageSweep.txt` (`key:value` parameters), `<TP>_Comments.txt`,
  image ZIPs and camera metadata (`.mdipsug`, `.metadata`).

---

## 5. Architecture

### Services

| Component | Responsibility | Tech |
|---|---|---|
| **Frontend** | Web dashboard with three views (below) | Built by a dedicated team member |
| **API Gateway** | Single entry point for the frontend: routing, CORS | Traefik or nginx (configuration only) |
| **MCP** | Exposes tools to the LLM; holds the **static RAG corpus** (read-only); calls ML. Also hosts the **agent** `/chat` endpoint, because browsers cannot speak MCP | Python MCP server over Streamable HTTP + `/chat` |
| **ML** | Prediction model for the simulator (target being defined, see *Modeling approach*) | FastAPI + scikit-learn / gradient boosting |
| **DATA_PROVIDER** | Offline build of the corpus, the investigation profiles and the clean tabular datasets from PSI (see open questions) | Python scripts (`psi_client.py`, `build_corpus.py`) |

### Frontend views

| View | Purpose | Backend |
|---|---|---|
| **Information (static)** | Summaries, rankings and side-by-side comparison of investigations (objectives, fuels, sample shape and size, O₂, pressure, airflow, variables, sensors, hardware) | Static **investigation profiles**, generated offline (see §6) and served through the gateway |
| **Chatbot** | Technical and basic Q&A with citations | Gateway → `/chat` (agent) → MCP tools → corpus + ML |
| **Simulator** | User sets conditions (e.g. O₂, pressure, diluent, fuel) and sees the predicted fire behavior | Gateway → ML `/predict` (direct, deterministic, no LLM) |

```
       Frontend ─ [Information]   [Chatbot]   [Simulator]
                        │             │             │
                ┌───────┴─────────────┴─────────────┴──────┐
                │        API GATEWAY (Traefik / nginx)     │
                └───────┬─────────────┬─────────────┬──────┘
                        │ /profiles   │ /chat       │ /predict
                        ▼             ▼             ▼
                 profiles.json   ┌──────────────┐  ┌──────┐
                 (static)        │ MCP + agent  │─►│  ML  │
                                 │ corpus.db RO │  └──────┘
                                 └──────────────┘
                                        ▲
                                        │ built once, offline
   build_corpus.py: PSI API + NASA resources → text → chunks → embeddings → corpus.db
   build_profiles.py: LLM + RAG over corpus.db → profiles.json (reviewed, cited)
```

- The **simulator calls ML directly**. Its answers are deterministic and fast, and the LLM is not involved.
- The **chatbot can also call ML** through the `predict_*` MCP tool. This lets it explain a prediction with
  supporting literature.

### ML service: one contract, two consumers

The ML service exposes **a single prediction endpoint**, used by both clients with the same request and
response schema:

| Consumer | Path | Network |
|---|---|---|
| Simulator view | Frontend → Gateway → `POST /ml/predict` | Public, through the gateway |
| MCP tool `predict_*` | MCP → `POST ${ML_URL}/predict` (e.g. `http://ml:8000`) | Shared internal Docker network, **not** through the gateway |

Requirements:
- **Shared Pydantic schemas** (`shared/schemas.py`), imported by ML and MCP, so both consumers stay in sync.
- The response must be useful to both a UI and an LLM. Besides the prediction, it includes:
  - `in_tested_range: bool`, plus the out-of-range fields: the simulator can warn, and the LLM can qualify its answer.
  - `model_version` and `training_source`: the dataset and its PSI accession, so the LLM can cite it.
  - Optionally, the nearest tested experiments (the `accession` and test IDs closest to the query). The LLM
    can then point to real tests and not only to a model output.
- `GET /ml/model-info` (recommended, optional) is the model **describing its own inputs**. The simulator
  fetches it on load and builds its controls (sliders, dropdowns) from it, so the limits are not hard-coded
  in the frontend. If the model or its target changes, the simulator adapts without frontend changes.
  *Illustrative* response for option A:
  ```json
  { "model_version": "flex-gbm-0.1", "training_source": "PSI-69 FLEX (274 ISS tests)",
    "inputs": {
      "fuel":          { "type": "enum",  "values": ["methanol", "heptane"] },
      "pressure_atm":  { "type": "float", "min": 0.69, "max": 3.05, "unit": "atm" },
      "o2":            { "type": "float", "min": 0.12, "max": 0.34, "unit": "mole fraction" },
      "co2":           { "type": "float", "min": 0.0,  "max": 0.70, "unit": "mole fraction" },
      "he":            { "type": "float", "min": 0.0,  "max": 0.45, "unit": "mole fraction" },
      "droplet_d0_mm": { "type": "float", "min": 1.1,  "max": 4.67, "unit": "mm" } },
    "outputs": ["outcome", "probabilities", "burning_rate_mm2_s", "extinction_diameter_mm"] }
  ```

### Deployment: Docker Compose, one Dockerfile per service (DECIDED)

**Kubernetes is explicitly out of scope** for the hackathon. It adds setup and debugging cost, and the demo
does not need auto-scaling or high availability.

```
hackathon2026/
├── compose.yaml          ← single root file: `docker compose up` starts everything
├── gateway/              (Dockerfile + nginx.conf or traefik.yml)
├── frontend/             (Dockerfile)
├── mcp/                  (Dockerfile; MCP server + agent /chat; mounts corpus.db read-only)
├── ml/                   (Dockerfile)
├── data_provider/        (Dockerfile; offline build scripts)
└── shared/               (Pydantic schemas shared by ML and MCP)
```

1. **Each service owns its folder and its Dockerfile.** Teams work independently.
2. **One root `compose.yaml`** defines all services. Compose creates one shared network, and services reach each
   other by service name (e.g. `http://ml:8000`). No manual network setup is needed.
3. Run one service alone with `docker compose up ml`, or the whole system with `docker compose up`.
4. If a team prefers its own compose file, the root file can pull it in with `include:`. It stays on the same
   network.
5. **Never hard-code service URLs.** Read them from environment variables, so each service can also run and be
   tested alone:

   | Variable | Used by | Example |
   |---|---|---|
   | `ML_URL` | MCP, Gateway | `http://ml:8000` |
   | `MCP_URL` | Gateway | `http://mcp:8001` |
   | `DATA_PROVIDER_URL` | MCP, Gateway | `http://data-provider:8002` |
   | `CORPUS_PATH` | MCP | `/data/corpus.db` (read-only volume) |

6. Only the **gateway** publishes a port to the host. All other services are reachable only on the internal
   Compose network.
7. `corpus.db` and `profiles.json` are built offline and mounted as **read-only volumes**.

### Language policy (DECIDED)

- The LLM **always queries the corpus in English**, whatever language the user writes in, because the corpus
  is in English. It translates or reformulates the question into English search queries before calling
  `search_corpus`.
- The LLM **answers in the language of the user's question**, for example Spanish in, Spanish out.
- Technical terms, units and proper names stay exact: SIBAL, PMMA, LOI, CO₂, mm²/s, investigation acronyms.
  The terms may be explained in the user's language.
- Citations keep the original document titles (usually English).
- Consequence: the **embedding model can be English-only**, which is more accurate and smaller than a
  multilingual one.

### Design decisions

1. **The LLM orchestrates; the MCP server provides tools.** The MCP server does not decide the workflow.
   It packages calls to the corpus and the ML service as tools, and the LLM chooses which to call.
2. **REST + JSON between services, not gRPC.** The payloads are small, traffic is demo-level, LLM latency
   (seconds) dominates, REST works through the gateway and in browsers, and FastAPI gives Swagger docs for free.
   Typed contracts come from **shared Pydantic schemas**. Every service exposes `GET /health`.
3. **The corpus is static**, so ingestion is a **build step, not a service**. The index is a single
   **read-only SQLite file** (`corpus.db`) inside the MCP service:
   - **FTS5** (BM25) for exact technical terms (SIBAL, PMMA, LOI, MDCA, SAFFIRE-III).
   - **`sqlite-vec`** for semantic search.
   - Both are fused into **hybrid search**.
   - It also stores the 26 investigation metadata records and the FLEX table.
   - A `corpus_info` table records the build date, embedding model and document count, reported by `/health`.
4. **RAG is a tool, not automatic context.** The LLM calls `search_corpus` when needed, possibly several
   times. Context is not injected into every message.
5. **Text goes to RAG; numbers go to SQL or ML.** Tabular data is not embedded. Numeric questions go to
   `query_flex_table` or `predict_extinction`.
6. **Citations are mandatory.** Every technical claim cites **the specific document and page**, and links to
   the **PSI investigation page**. It never links to a file URL: file download links are pre-signed S3 URLs
   that expire. Format:

   > *Olson et al. (2015), "…title…", p. 7*. **BASS-II (PSI-25)**, folder *Raw Data*.
   > <https://psi.nasa.gov/physci/repo/data/investigations/PSI-25>

   For non-PSI resources (the NASA fact sheets, the mini-book, Spinoff pages), link the public NASA URL of
   the document itself.
7. **The embedding model is needed at runtime** to embed the search queries. It must match the model used to
   build the index. Under the language policy (queries are always in English), an **English model is enough**,
   e.g. `bge-small-en-v1.5` (~130 MB) or `bge-base-en-v1.5` (~440 MB). The final choice is OPEN.

### MCP tools (draft)

| Tool | Description |
|---|---|
| `search_corpus(query, accession?, doc_type?, k=5)` | Hybrid search over papers, reports and metadata; returns chunks with citation fields. **`query` must be in English** (see the language policy) |
| `get_investigation(accession)` | Full metadata record for one investigation |
| `rank_fire_relevance(context)` | Ranks investigations for a habitat scenario (spacecraft, lunar base, rover...) |
| `query_flex_table(filters)` | Structured query over the 274 FLEX tests |
| `predict_*(...)` | Calls the ML service. The name depends on the final prediction target |

### ML contract: example for option A (FLEX), not final

```python
class ExtinctionRequest(BaseModel):
    fuel: Literal["methanol", "heptane"]
    pressure_atm: float = Field(ge=0.5, le=3.1)   # the range FLEX actually tested
    o2: float = Field(ge=0.10, le=0.40)
    co2: float = 0.0
    he: float = 0.0
    droplet_d0_mm: float = Field(gt=0, le=6)

class ExtinctionResponse(BaseModel):
    outcome: Literal["extinction", "completion", "disruption"]
    probabilities: dict[str, float]
    burning_rate_mm2_s: float
    extinction_diameter_mm: float | None
    model_version: str
    training_source: str = "PSI-69 FLEX (274 ISS tests)"
```

The input bounds stop the model from extrapolating far outside the tested conditions.

### Modeling approach (open: being defined by the data team)

The exact prediction target is **not fixed yet**. A team member is reviewing the data. Whatever the target:
- With about 100–500 labeled examples per dataset, **tabular models (gradient boosting or physics-informed
  regression) are a better fit than deep learning**.
- Inputs should be **bounded to the tested ranges**, and the simulator should show when a query falls
  outside them.

Candidate options:

| Option | Dataset | Possible targets | Readiness | Fit with the challenge |
|---|---|---|---|---|
| **A. Droplet extinction / suppression (FLEX)**, *feasible now* | PSI-69 table, 274 tests (fuel, pressure 0.69–3.05 atm, O₂ 0.12–0.34, N₂/CO₂/He, D₀) | Outcome class (extinction / completion / disruption); burning rate; extinction diameter; **limiting O₂ vs pressure and diluent** (flammability map) | **Labels already in the table**; only cleaning needed | Suppression pillar; the pressure range reaches the Moon Base atmosphere (≈ 0.69 atm, O₂ up to 0.34) |
| B. Solid-material flammability (BASS / BASS-II) | BASS-II table, 129 tests (material, thickness, flow, O₂, CO/CO₂) | Burns or extinguishes; flame spread rate | **Labels must be extracted** from papers (LLM-assisted, manually verified) | Prevention pillar (material selection), the core of the challenge text |
| C. Smoke point / soot (SPICE) | PSI-107 table, 470 rows (fuel, nozzle, fuel and air rates) | Smoke point, flame length | Partly in the raw XLS files | Detection and prevention (soot and smoke) |
| D. Combination | A + B (+ C) | One simulator with several modes | Highest effort | Broadest coverage |

Validation idea: use SAFFIRE (2–3 large-scale samples) as an out-of-distribution check, not as training data.

---

## 6. RAG corpus plan

PSI holds **1,513 PDFs (~1.8 GB)** across the 26 combustion investigations. Most are not useful text.
For the fire-safety investigations:

| Type | Count | Include? |
|---|---|---|
| Published papers (identified by the `subcategory: "Legacy/<year> - <authors>..."` field) | 27 | **Yes, core** |
| Final reports, science documents, presentations | 33 | **Yes** |
| Engineering documents (hardware, system reviews) | 77 | Selected, for objective 3 |
| Per-test summary PDFs | 396 | No: mostly plots. Use the TestSheet `.txt` files instead |
| Image proof sheets and plots | 254 | No |
| Other raw PDFs | 119 | Review later |

### Challenge resources (non-PSI)

These are high-value and small. They make basic questions answerable in plain language:

| Resource | Content | Use |
|---|---|---|
| [Combustion Science, NASA Glenn](https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/) | Overview, plus **8 investigation fact-sheet PDFs (2025)**: ACME, BASS, DAFT, FLEX, SAME, SPICE, SAFFIRE, SLICE | **Tier 0**: plain-language summaries per investigation |
| [A Researcher's Guide to Combustion Science](https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/) | Mini-book *Combustion in Reduced Gravity* (NP-2015-10-034-JSC), by Gokoglu, Dietrich, Stocker, Ferkul, Olson and Hicks ([PDF](https://www.nasa.gov/wp-content/uploads/2016/05/np-2015-10-034-jsc_combustion_in_reduced_gravity-iss-mini-book-011116-508.pdf)). **Verified:** 56 pages, extractable text, accessible (Section 508) tagged PDF, no OCR needed | **Tier 0, included**: fundamentals, for basic questions |
| [Apollo 1](https://sma.nasa.gov/sma-disciplines/accllp/apollo-1), [Apollo 13](https://sma.nasa.gov/sma-disciplines/accllp/apollo-13), [Mir fire](https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/) | Lessons learned from historical fires; the pages link to full investigation reports | Tier 1 for the page text; the linked reports are optional |
| Spinoffs: [air tanks](https://spinoff.nasa.gov/node/9582), [fire detector](https://spinoff.nasa.gov/node/9407), [fire attire](https://spinoff.nasa.gov/node/9918) | Earth applications of NASA fire technology | Tier 1: the optional "Earth applications" objective |
| [YouTube video](https://www.youtube.com/watch?v=W1oXykoz9zg) | Video resource | Optional: transcript only, if available |
| [PSI repository](https://psi.nasa.gov/physci/repo/search?q=combustion) | Main data source (§2) | See the tiers below |

### Ingestion tiers

0. **Fundamentals and summaries:**
   - The NASA fact sheets and the *Combustion in Reduced Gravity* mini-book.
   - The 26 investigation metadata records, as text cards.
   - The FLEX TestSheets (~270 short texts).

   This tier covers basic questions and objective 1.
1. About 60 papers, reports and presentations from the Tier-1 investigations.
2. Selected engineering documents, plus open-access papers from the **NASA Technical Reports Server (NTRS)**.
   The investigations cite **179 publications (131 with DOI)**, but most are not in PSI and many are paywalled.
3. Never: plot-only PDFs, image archives, video.

Chunking:
- 500–800 tokens, split on section boundaries, with 10–15 % overlap.
- Extract text with PyMuPDF; use OCR for scanned legacy documents.

Chunk metadata:
```json
{ "chunk_id": "...",
  "accession": "PSI-25", "acronym": "BASS-II",
  "doc_type": "paper|report|engineering|metadata|testsheet|factsheet|book|web",
  "fire_tier": 1, "year": 2015,
  "doc_title": "Modeling and Analysis of Intermediate Thickness PMMA Sheets ...",
  "doc_authors": "TJ Shah, FJ Miller, S Olson, I Wichman",
  "file_name": "....pdf", "psi_folder": "Raw Data", "page": 7,
  "investigation_url": "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
  "public_url": null }
```

- `investigation_url` is always set for PSI documents.
- `public_url` is set only for non-PSI resources (fact sheets, the mini-book, web pages). For those,
  `accession` may be null, or list the investigations the resource covers.
- Paper titles and authors come from the PSI `subcategory` field (`Legacy/<year> - <authors>. "<title>"`)
  or from the `publications` metadata.

**Evaluation:** a set of 20–30 questions, each with its expected source document, measured as recall@5.
Include **both levels**: expert questions (specific values, conditions) and basic questions (concepts).

### Investigation profiles (for the Information view)

After the corpus is built, an offline step (`build_profiles.py`) uses the LLM with RAG over `corpus.db` to fill
a **fixed schema per investigation**. The output is stored as static `profiles.json` and served to the
Information view:

```json
{ "accession": "PSI-25", "acronym": "BASS-II", "pillar": ["prevention", "suppression"],
  "hardware": "MSG / SPICE flow duct", "fuel_type": "solid",
  "fuels": ["PMMA", "SIBAL", "Nomex"], "sample_geometry": "flat sheets, rods, spheres",
  "o2_range": [0.15, 0.22], "pressure_range_atm": [1.0, 1.0], "airflow_cm_s": [0, 50],
  "variables": ["material", "thickness", "flow speed", "O₂"], "constants": ["..."],
  "sensors": ["video", "radiometer", "O₂/CO/CO₂ analyzers"],
  "habitat_relevance": { "spacecraft": 3, "station": 3, "moon_base": 2, "rover": 2 },
  "key_findings": ["..."], "citations": ["PSI-25 p.7", "..."] }
```

The values above are an illustrative example, not real data.

Why generate the profiles offline instead of live:
- **Consistency:** every user sees the same summary.
- **Cost and latency:** no LLM call when a page loads.
- **Reviewability:** the team can check and correct the fields before the demo.

Every field must carry a citation. Numeric fields (ranges) should come from the experimental tables when
they exist, and only fall back to LLM extraction when they don't.

---

## 7. Open questions

- **Prediction target for the simulator:** being defined by the data team (options A–D in §5; FLEX is
  feasible now).
- **DATA_PROVIDER as a service?** With static data it becomes thin. Either keep it as the owner of the offline
  build and the structured datasets (three services), or turn it into a build script in the repo (two
  runtime services: MCP and ML).
- **Embedding model choice:** an English-only model, chosen by size and quality (see §5, decision 7).
- **Scope of extra labels:** whether to invest in extracting BASS-II outcomes from papers (option B).
- **Where `profiles.json` is served from:** a static file behind the gateway, or a route in the MCP service.

## 8. Risks

| Risk | Mitigation |
|---|---|
| PSI API is slow or times out on large investigations (`/versions` can exceed 2 MB) | Cache the inventories; build everything offline before the demo |
| Small training set | Tabular models, bounded inputs, report uncertainty |
| Scanned PDFs without a text layer | Detect pages with no text; OCR them selectively |
| LLM hallucinating fire-safety guidance | Mandatory citations; numeric answers only from tools |
| Raw sensor channels in volts without calibration | Use the experimental tables and analyzed data first; check the engineering docs |
