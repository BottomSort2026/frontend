# 07 · Demo polish

## Context

The jury sees this once, probably projected, probably on a slow network. The audience includes professors, graduate students, researchers and curious students (`ARCHITECTURE.md` §1).

## Task

1. **First ten seconds**: the wordmark and the sky must be on screen before any font or chunk finishes loading. Measure the cold load on a throttled connection and report it. Preload what the first paint needs and nothing else.
2. **Loading and failure everywhere**: every query has a pending and an error state written in the product's voice. Stop the backend and walk the whole app: nothing shows a blank area or a raw error.
3. **Content pass** against `ARCHITECTURE.md` §1 and §3: every fact in Mission and Fire safety is in that document or in the challenge brief. List any sentence you cannot trace, and verify the four years on the Mission page (1967, 1970, 1997, 2026) against the NASA pages linked in §6.
4. **Earth applications**: the challenge's optional objective. Add a short block to Fire safety on what this research gave fire safety on Earth, with the NASA Spinoff links from §6.
5. **Credits**: a small credits view reachable from the sky (the fifth star of the Cross, Ginan, is free and currently decorative): NASA PSI and its CC0 licence, BoopFace by CX ArtLab, the type families, the team.
6. **Sharing**: page titles per route, a description, and an Open Graph image of the sky.
7. Remove anything left over from scaffolding that the app does not use.

## Constraints

- No new animation. No analytics. No external requests other than the gateway.
- The honest labels stay wherever the data is still sample.

## Done when

`pnpm check`, `pnpm test` and `pnpm build` pass, and your final message has the measured load time, the untraceable sentences if any, and the list of removed files.
