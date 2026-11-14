# 02 · Information view on real profiles: detail and compare

## Context

The challenge asks to "summarize, rank and interpret" investigations and to show similarities and differences between them. Today `/library` ranks sample profiles by habitat and filters by fuel. `ARCHITECTURE.md` §6 defines the profile schema (illustrative) and says every field must carry a citation. Where `profiles.json` is hosted is still OPEN.

## Before you write code

Fetch the real `GET /profiles` (ask for the URL if `GATEWAY_URL` is not set). Compare its shape with `InvestigationProfile` in `src/api/types.ts` and report the differences. If there is no real file yet, continue on the sample data and keep every new field optional.

## Task

1. **Detail page** at `/library/$accession`: a file route with a loader that reads from the cached profiles query. Show objectives or key findings, fuels and sample geometry, test conditions (O₂, pressure, airflow ranges as `Readout`s), variables against constants, sensors, hardware, the relevance for each of the four habitats, and the citations. Link to the PSI investigation page. A missing field is simply not rendered; a missing accession shows the not-found page.
2. The card title in the library goes to the detail page; the external PSI link moves into the detail page.
3. **Compare**: let the user pick two or three investigations in the library (a toggle on each card, state in the URL as `?compare=PSI-25,PSI-69`) and open `/library/compare` showing them side by side, one row per attribute, with differing values easy to spot without relying on colour alone.
4. Keep the travel model: these are pages inside the Library star. "Back to sky" still returns to the sky from any of them, and the star's eyebrow stays "δ Crucis · Library".

## Constraints

- Reuse `Section`, `SectionBlock`, `Tag`, `Readout`, `InvestigationCard`. New CSS uses tokens only.
- No table library. A CSS grid is enough for three columns.
- Keep "Sample ranking" visible while `sample` is true.

## Done when

`pnpm check` and `pnpm test` pass; a unit test covers parsing the `compare` search param and ranking with missing relevance values; you have looked at the detail and compare pages at 1280 px and 390 px.
