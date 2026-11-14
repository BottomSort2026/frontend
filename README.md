# Flame in Freefall: frontend

The web dashboard for _Flame in Freefall_ (NASA Space Apps 2026, team BottomSort). The home screen is the night sky of the Valle del Elqui: each star of the Southern Cross is a section, and choosing one flies the camera into it.

| Star                        | Route          | View in `ARCHITECTURE.md` | Backend                                  |
| --------------------------- | -------------- | ------------------------- | ---------------------------------------- |
| Acrux, "Mission"            | `/mission`     | Information               | none (static)                            |
| Mimosa, "Fire safety"       | `/fire-safety` | Information               | none (static)                            |
| Imai, "Library"             | `/library`     | Information               | `GET /profiles`                          |
| Gacrux, "Flame lab"         | `/flame-lab`   | Simulator                 | `GET /ml/model-info`, `POST /ml/predict` |
| the assistant, bottom right | (panel)        | Chatbot                   | `POST /chat`                             |

It runs with no backend: with `VITE_API_URL` empty, every call is answered from sample data, and the interface labels it as sample.

## Run it

Needs Node 22.18 or newer and pnpm (the pinned version downloads itself).

```bash
pnpm install
pnpm dev          # http://localhost:5173, sample data
pnpm check        # format, lint and type-check in one pass
pnpm test         # unit tests
pnpm build        # production build in dist/
```

Use pnpm, not npm: npm 10 fails to install Vite+.

Against the real services, point the app at the gateway (the `api-gateway` repository). It listens on port 3000 when run locally with `pnpm start:dev`, and on 8080 when the Compose stack publishes it. Copy `.env.example` to `.env.local` and set one of these:

**Through the dev proxy (recommended, same origin):**

```bash
VITE_API_URL=/
GATEWAY_URL=http://localhost:3000   # 8080 under Compose
```

The dev server forwards `/profiles`, `/chat` and `/ml` to the gateway, so the browser stays same-origin as it is in production.

**Direct (cross-origin):**

```bash
VITE_API_URL=http://localhost:3000
```

The browser calls the gateway from `localhost:5173`, so the gateway must allow that origin through CORS. Its default allows any `http://localhost:<port>`.

## Stack

- **Vite+** (`vp`): dev server, build, tests (Vitest), lint (Oxlint) and format (Oxfmt) from one `vite.config.ts`.
- **React 19 + TypeScript**, plain CSS driven by design tokens (`src/styles/tokens.css`).
- **TanStack Router**, file-based (`src/routes`), with search params for the library filters. **TanStack Query** for everything from the gateway.
- **Motion** for interface transitions and the travel value, **anime.js** for the load choreography, two hand-written **Canvas 2D** modules for the stars and the flame, **BoopFace** for the assistant's face.

## Layout

```text
src/
  routes/       one file per URL; __root.tsx holds the sky, the back control and the assistant
  sky/          SkyMap, NavStar, the star catalogue, layout math, the canvas, the travel state
  sections/     the shell every section shares (heading, staggered entrance)
  lab/          FlameSim (illustrative explainer), Predictor (ML service), ParamSlider
  library/      InvestigationCard and ranking
  safety/       SafetyPillar
  assistant/    BotLauncher, ChatPanel, AssistantFace, useChat
  api/          types (the contract), client, queries, mock (sample data)
  ui/           Button, Tag, Readout, icons
  lib/          token and label helpers
  styles/       tokens.css (generated from design/tokens.json) and base.css
design/         tokens.json, the source of the tokens
docs/prompts/   ready-to-send prompts for the next pieces of work
```

## Two things that are easy to get wrong

**The flame picture is an explainer, not a model.** `FlameSim` runs locally on gravity, oxygen and airflow and is labelled "Illustrative model". Predictions from PSI data are a separate component, `Predictor`, which builds its controls from `GET /ml/model-info` and knows no field names, because the prediction target is still open.

**Sample data must say it is sample.** `api/mock.ts` flags its profiles and its model as `sample`, and the interface shows "Sample ranking" and "Sample output". Keep that when you add data.

## Docker

`Dockerfile` builds the app and serves it with nginx (`nginx.conf`: single-page fallback and `GET /health`). It has not been built yet: run `docker build .` once before wiring it into the root `compose.yaml`.

## Credits

Data: NASA Physical Sciences Informatics. Assistant face: [BoopFace](https://github.com/CX-ArtLab/BoopFace) by CX ArtLab (MIT; the character stays theirs). Type: Instrument Serif, IBM Plex Sans and IBM Plex Mono (SIL Open Font License).
