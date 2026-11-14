# Frontend: working rules

The project context is in the repository root (`ARCHITECTURE.md`, root `CLAUDE.md`). This file adds what is specific to `frontend/`. Read `README.md` for the layout and `DESIGN.md` before touching anything visual.

## Commands

```bash
pnpm install       # never npm: npm 10 cannot install Vite+
pnpm dev           # dev server on sample data
pnpm check         # format + lint + type-check; must pass before you call a task done
pnpm test          # unit tests; must pass
pnpm build         # production build
pnpm exec vp fmt   # format
```

Import from `vite-plus` and `vite-plus/test`, not from `vite` or `vitest` (a lint rule enforces it).

## Rules

- **Git is the developer's.** Do not commit, push, create branches or open pull requests. Leave the changes in the working tree and say what changed.
- **Stay in `frontend/`.** If a task needs a change in `gateway/`, `compose.yaml` or `shared/`, stop and say which change and why.
- **The contract lives in `src/api/types.ts`.** It follows `ARCHITECTURE.md` §5 and §6. Items that document marks OPEN (prediction target, `profiles.json` hosting) and the `/chat` schema it does not define are not to be assumed: keep the code tolerant of missing fields, and change `types.ts` and `mock.ts` together when the team decides.
- **Only `src/api/client.ts` calls `fetch`.** Components read data through the query definitions in `src/api/queries.ts`. API paths are relative; the base comes from `VITE_API_URL`.
- **No hand-written design values.** Colours, spacing, radii, durations and easings come from the tokens: `var(--token)` in CSS, `src/lib/tokens.ts` and `src/lib/motion.ts` in TypeScript. `src/styles/tokens.css` is generated; change `design/tokens.json` and regenerate, never edit the CSS.
- **No new dependencies** for animation, components or state without asking. Motion, anime.js, TanStack Router and TanStack Query cover the current scope.
- **Honest labels stay.** "Illustrative model", "Sample ranking", "Sample output" and "Interpolated" are part of the product. Do not remove one unless the thing it describes became real.
- **Interface text is English**, sentence case, verb first on buttons, units with a space (`30 %`, `10.2 psi`). The assistant answers in the user's language; that is the backend's job.
- **Citations link to the PSI investigation page**, never to a file URL (pre-signed links expire).

## How the navigation works

The URL is the source of truth. `sky/TravelContext.tsx` adds the animation between places with one progress value `e` (0 = sky, 1 = inside the star) that every layer reads. Do not animate the layers separately, and do not add a second source of truth for "where am I". `SkyMap` stays mounted under every section.

## Verifying visual work

Type-checks do not prove an animation works. After a visual change, run the dev server and look: at 1280 px and 390 px wide, with the keyboard only, and with `prefers-reduced-motion: reduce`. If you cannot look, say so instead of claiming it works.
