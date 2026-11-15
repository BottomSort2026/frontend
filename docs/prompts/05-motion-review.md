# 05 · Motion review

## Context

Motion rules are in `DESIGN.md` and in the Motion section of the design system. The trip between the sky and a section is driven by one progress value `e` in `src/sky/TravelContext.tsx`; the load choreography is an anime.js timeline in `src/sky/SkyMap.tsx`; panels and section content use Motion.

## Task

Use the Emil Kowalski skills if they are installed (`review-animations`, `animation-performance`, `choreograph`); otherwise apply `DESIGN.md` directly.

1. Review every animation against the rules. Produce a table: what animates, trigger, duration, easing, properties, verdict. Flag anything that animates layout properties, uses `ease-in` to enter, exceeds its token, or cannot be interrupted.
2. Test interruption for real: click a star and press `Escape` mid-flight; click "Back to sky" and immediately click another star; open and close the chat quickly. Nothing may jump, stick or end in a wrong state.
3. Performance: record the trip on a throttled CPU (4×). The sky canvas and the DOM layers must hold frame rate; if they do not, find which layer costs the time before changing anything.
4. Reduced motion: with `prefers-reduced-motion: reduce`, confirm there is no zoom, no streaks, no twinkle and no sliding, and that everything is still reachable.
5. Fix what you find, smallest change first. Do not add animations; removing one is a valid fix.

## Done when

The table and the list of fixes are in your final message, `pnpm check` passes, and you say which of the tests above you actually ran in a browser.
