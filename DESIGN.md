# Design rules

The full system (tokens, eleven components with live previews, motion guide) is the "Flame in Freefall" design system: https://claude.ai/artifact/EF6zEYswUqyivSAmbzPxcX. This file is the short version an agent needs. It overrides any default palette, font pairing or layout a design skill would otherwise propose.

## Principles

1. **The sky is the navigation.** No navbar. Four stars of Crux are the four destinations: Acrux → Mission, Mimosa → Fire safety, Imai → Library, Gacrux → Flame lab. Everything else lives in the corners.
2. **Blue in free fall, amber for caution.** `flame-blue` means microgravity and is the primary accent. `ember` means caution, for example a request outside the tested conditions.
3. **Say what is not measured.** Anything that is not PSI data carries a label: "Sample ranking", "Sample output". The Flame Lab says where its data comes from: "Microgravity (ISS) data only".
4. **One long animation.** The trip to a star (900 ms) is the only movement over 420 ms.

## Colour

One dark theme. Page `sky-900`, raised surfaces `sky-800`, hover and inputs `sky-700`, silhouettes `sky-950`. Text `ink`, secondary `ink-muted`, captions and units `ink-faint`. Decorative lines `sky-600`; any border that carries meaning `line-strong`. Text on an accent fill is `on-accent`, never white. States: `nominal`, `ember`, `hazard`, always with a word or icon. `soot`, `flame-core` and `milkyway` are canvas colours only.

## Type

`--font-display` (Instrument Serif): wordmark, section headlines, star labels (italic). Never for paragraphs or under 20 px. `--font-sans` (IBM Plex Sans): reading text and buttons. `--font-mono` (IBM Plex Mono): every number, unit, label and coordinate. Labels are 12 px mono, uppercase, tracked.

## Shape

Buttons, cards and chat bubbles `radius-md`; the chat panel and the simulation viewport `radius-lg`; tags, the launcher and slider thumbs `radius-pill`. Cards inside a section use a `sky-600` hairline, no shadow; `shadow-panel` is only for things floating over the sky. No cards with a coloured side border, no blue-to-purple gradients, no emoji.

## Motion

| Token         | Value  | Use                                                           |
| ------------- | ------ | ------------------------------------------------------------- |
| `dur-instant` | 120 ms | press feedback (`scale(0.97)`)                                |
| `dur-fast`    | 180 ms | hover, focus, every exit                                      |
| `dur-base`    | 260 ms | chat open, messages, slider jumping to a preset               |
| `dur-slow`    | 420 ms | section content after arrival                                 |
| `dur-travel`  | 900 ms | the trip to a star; 800 ms back, same easing played backwards |

The trip has one light, not a cut. It blooms out of the star in the star's colour, peaks as the sky disappears, and thins out into a faint glow that stays behind the section (12 % strength, where the star sits on screen). The section starts to enter while the light is still settling; on the way back the content fades while the same light swells and then falls into the star. A section has no background of its own.

`ease-out` for anything entering or responding; `ease-in-out` for something already on screen moving from A to B; `ease-travel` for the camera. Never `ease-in` for an entrance, never `transition: all`. Animate `transform` and `opacity` only. Nothing animates on scroll, numbers do not count up, filtering the library does not animate. With `prefers-reduced-motion: reduce`: no zoom, no streaks, no twinkle, no slide; opacity fades stay.

## Accessibility

`ring-focus` on every interactive element via `:focus-visible`. Targets at least 40 px. Hover styles inside `@media (hover: hover)`. Stars are real buttons in a `<nav>`, in tab order Mission, Fire safety, Library, Flame lab. `Escape` closes the chat if open, otherwise returns to the sky. Focus goes to the section headline on arrival and back to the star on return.

## The assistant

The face is the BoopFace web component in `flame-blue`, inside the launcher at the bottom right of every view. Its expressions follow the request: waiting, answered (`success`), answered without sources (`inspect`), failed (`failure`). Do not recolour it by state and do not redraw it.
