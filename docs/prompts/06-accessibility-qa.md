# 06 · Accessibility, small screens and smoke tests

## Task

1. **Keyboard only**, from a cold load: reach each star, enter a section, use every control in the Flame lab and the library filters, open the assistant, send a question, close it, return to the sky. Report every place where focus is lost, trapped, invisible or lands somewhere surprising, then fix them.
2. **Screen reader semantics**: the stars are a `nav` of buttons; each section has one `h2` and focus moves to it on arrival; the chat log is a polite live region; sliders announce label, value and unit; the flame canvas has a text alternative that changes with the reading ("Spherical, faint blue, diffusion"). Fix what is missing.
3. **Small screens**: check 360 × 640 and 390 × 844. Nothing overflows sideways; star labels do not collide with each other or with the wordmark; the chat panel fits above the on-screen keyboard; targets are at least 40 px.
4. **Hostile content** (use the `break-ui` skill if installed): a profile with a 60-character acronym, no pillars, no relevance, twelve hardware entries; a library of zero and of sixty profiles; an assistant answer of two thousand words with eight citations; a model with one input and with twelve.
5. **Smoke tests**: add browser tests with Vitest browser mode (Vite+ ships it; Playwright is the provider) for: the four routes render their headline on a direct load; clicking a star lands on its route; `Escape` returns to `/`; the library filter writes the URL. Keep them under a minute in total.

## Constraints

- Fix in place with tokens; no new dependencies beyond the browser-test provider.
- Colour contrast: text at least 4.5:1, meaningful borders and icons at least 3:1.

## Done when

`pnpm check` and `pnpm test` pass including the new browser tests, and your final message lists what you found, what you fixed and what you left with a reason.
