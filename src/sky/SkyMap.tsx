import { createTimeline, stagger, svg } from "animejs";
import { motion, useMotionValueEvent, useReducedMotion, useTransform } from "motion/react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { clamp01, tok } from "../lib/tokens";
import { NavStar, PlainStarMark } from "./NavStar";
import { usePreloadInvestigationsWhenIdle, useSectionPreload } from "./preload";
import { layoutSky, reach, type SkyGeometry } from "./projection";
import { createSky, type Sky } from "./skyCanvas";
import { LINES, PLAIN_STARS, STARS, type SectionId } from "./stars";
import { useTravel } from "./TravelContext";
import "./sky.css";

/** How much of the arrival light stays on as the glow behind a section. */
const AMBIENT_LIGHT = 0.12;

/** Smoothstep: eases both ends of a 0 to 1 ramp. */
function smooth(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** The home screen: the Elqui night sky, with the four stars of Crux as the navigation. */
export function SkyMap() {
  const { e, phase, current, go } = useTravel();
  const reduce = useReducedMotion() ?? false;
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const field = useRef<HTMLElement>(null);
  const sky = useRef<Sky | null>(null);
  const starEls = useRef<Partial<Record<SectionId, HTMLButtonElement | null>>>({});
  const [geo, setGeo] = useState<SkyGeometry | null>(null);
  // A deep link opens inside a section, so the load choreography is skipped.
  const [intro, setIntro] = useState<"pending" | "done">(
    phase === "sky" && !reduce ? "pending" : "done",
  );

  // Lay the sky out for the viewport, and again whenever it changes size.
  useLayoutEffect(() => {
    const el = root.current!;
    const measure = () => setGeo(layoutSky(el.clientWidth, el.clientHeight));
    measure();
    let t = 0;
    const ro = new ResizeObserver(() => {
      window.clearTimeout(t);
      t = window.setTimeout(measure, 120);
    });
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const s = createSky(canvas.current!, reduce);
    sky.current = s;
    return () => {
      s.destroy();
      sky.current = null;
    };
  }, [reduce]);

  const focus = current && geo ? geo.stars[current.id] : null;

  // Rebuild the star field only when the viewport changes; re-aim the camera when the star does.
  useEffect(() => {
    if (geo) sky.current?.layout(geo);
  }, [geo, reduce]);

  useEffect(() => {
    if (!geo) return;
    const p = focus ?? geo.centre;
    sky.current?.camera(p.x, p.y, 10 ** e.get());
  }, [geo, focus, e, reduce]);

  // The sky rests while a section covers it.
  useEffect(() => {
    if (phase === "section") sky.current?.stop();
    else sky.current?.start();
  }, [phase, geo]);

  useMotionValueEvent(e, "change", (v) => {
    if (focus) sky.current?.camera(focus.x, focus.y, 10 ** v);
  });

  // Every layer is a function of the one progress value.
  const fieldScale = useTransform(e, (v) => (reduce ? 1 : 1 + 5.5 * v * v));
  const fieldOpacity = useTransform(e, (v) => 1 - clamp01((v - 0.3) / 0.35));
  const hudOpacity = useTransform(e, (v) => 1 - clamp01(v / 0.4));
  const farY = useTransform(e, (v) => (reduce ? "0%" : `${v * 45}%`));
  const nearY = useTransform(e, (v) => (reduce ? "0%" : `${v * 90}%`));
  const domeY = useTransform(e, (v) => (reduce || !geo ? 0 : v * geo.height * 0.24 * 0.45));
  // The arrival light. One continuous light for the whole trip: it blooms out of the star,
  // peaks as the sky disappears and then thins out into the section's ambient glow. Nothing is
  // cut: the section enters over the settling light, and the return trip plays it backwards.
  // The ranges are in units of `e`. The camera's easing spends 40 % of the trip between
  // e = 0.86 and 1, which is what makes the settle long and gentle.
  // It is laid out at full size and scaled down from there, so it stays sharp as it grows.
  const lightRadius = focus && geo ? reach(focus, geo.width, geo.height) * 1.05 : 0;
  const lightScale = useTransform(e, (v) => {
    if (reduce) return 1;
    const s = clamp01((v - 0.3) / 0.7);
    return Math.max(0.001, s * s);
  });
  const lightOpacity = useTransform(e, (v) =>
    reduce
      ? AMBIENT_LIGHT * clamp01(v)
      : smooth((v - 0.3) / 0.42) * (1 - (1 - AMBIENT_LIGHT) * smooth((v - 0.86) / 0.14)),
  );
  // The white-hot centre belongs to the flash only: it is gone by the time the section is read.
  const coreOpacity = useTransform(e, (v) => (reduce ? 0 : 1 - smooth((v - 0.8) / 0.2)));
  // The sky is covered before the section starts to enter (see ARRIVE_AT in TravelContext).
  const coverOpacity = useTransform(e, (v) => smooth((v - 0.4) / 0.46));

  // Load choreography, once: stars arrive one by one, then the constellation draws itself.
  useEffect(() => {
    if (intro !== "pending" || !geo || !field.current) return;
    const el = field.current;
    const parts = el.querySelectorAll<HTMLElement>(".ff-star > *");
    const lines = el.querySelectorAll<SVGLineElement>(".ff-sky__lines line");
    const linesBox = el.querySelector<SVGSVGElement>(".ff-sky__lines")!;
    linesBox.style.opacity = "1";
    const tl = createTimeline({ defaults: { ease: "outQuint" } })
      .add(parts, { opacity: [0, 1], scale: [0.7, 1], duration: 420, delay: stagger(55) }, 350)
      .add(
        svg.createDrawable(lines),
        { draw: ["0 0", "0 1"], duration: 1100, delay: stagger(250) },
        850,
      );
    void tl.then(() => {
      // Hand the elements back to CSS, so hover and press styles apply again.
      el.dataset.intro = "done";
      parts.forEach((p) => p.removeAttribute("style"));
      lines.forEach((l) => {
        l.removeAttribute("stroke-dasharray");
        l.removeAttribute("stroke-dashoffset");
        l.removeAttribute("pathLength");
        l.removeAttribute("style");
      });
      linesBox.removeAttribute("style");
      setIntro("done");
    });
    return () => {
      tl.revert();
    };
    // Runs once, when the first layout is known.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geo === null]);

  // Once the intro has played, load the Investigations report while nobody is looking: it is the
  // one download large enough to make a trip wait. Pointing at or focusing any star loads its
  // section.
  usePreloadInvestigationsWhenIdle(intro === "done");
  const preload = useSectionPreload();

  // Back in the sky after a trip: return focus to the star we left from.
  const previous = useRef(phase);
  useEffect(() => {
    // Not just "out" → "sky": with reduced motion "out" and "sky" land in the same render.
    if (previous.current !== "sky" && phase === "sky" && current)
      starEls.current[current.id]?.focus({ preventScroll: true });
    previous.current = phase;
  }, [phase, current]);

  const lines = useMemo(() => {
    if (!geo) return [];
    return LINES.map(([from, to]) => {
      const a = geo.stars[from];
      const b = geo.stars[to];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const gap = 30 / Math.hypot(dx, dy); // the bars stop short of the stars
      return {
        key: `${from}-${to}`,
        x1: a.x + dx * gap,
        y1: a.y + dy * gap,
        x2: b.x - dx * gap,
        y2: b.y - dy * gap,
      };
    });
  }, [geo]);

  const away = phase === "section";

  return (
    <div className="ff-sky" ref={root}>
      <canvas className="ff-sky__canvas" ref={canvas} aria-hidden="true" />
      <motion.svg
        className="ff-ridge ff-ridge--far"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ y: farY }}
      >
        <path d="M0 122 80 98 160 112 260 72 340 94 430 60 520 88 610 66 700 80 800 49 862 49 940 76 1040 54 1120 82 1200 62V200H0Z" />
      </motion.svg>
      <motion.svg className="ff-dome" viewBox="0 0 20 13" aria-hidden="true" style={{ y: domeY }}>
        <path d="M3 13V7a7 7 0 0 1 14 0v6Z" />
      </motion.svg>
      <motion.svg
        className="ff-ridge ff-ridge--near"
        viewBox="0 0 1200 200"
        preserveAspectRatio="none"
        aria-hidden="true"
        style={{ y: nearY }}
      >
        <path d="M0 96 120 52 220 84 330 30 450 78 560 44 680 90 790 50 900 86 1010 40 1110 80 1200 46V200H0Z" />
      </motion.svg>

      <motion.nav
        ref={field}
        className="ff-sky__field"
        aria-label="Sections"
        data-intro={intro}
        inert={away}
        style={{
          scale: fieldScale,
          opacity: fieldOpacity,
          transformOrigin: focus ? `${focus.x}px ${focus.y}px` : "50% 50%",
          visibility: away ? "hidden" : "visible",
        }}
      >
        {geo ? (
          <>
            <svg
              className="ff-sky__lines"
              viewBox={`0 0 ${geo.width} ${geo.height}`}
              aria-hidden="true"
            >
              {lines.map(({ key, ...l }) => (
                <line key={key} {...l} />
              ))}
            </svg>
            {STARS.map((star, i) => (
              <NavStar
                key={star.id}
                star={star}
                index={i}
                position={geo.stars[star.id]}
                stack={geo.stack}
                onSelect={go}
                onIntent={preload}
                ref={(el) => {
                  starEls.current[star.id] = el;
                }}
              />
            ))}
            {PLAIN_STARS.map((star, i) =>
              geo.plain[i]!.visible ? (
                <PlainStarMark key={star.name || "ginan"} star={star} position={geo.plain[i]!} />
              ) : null,
            )}
          </>
        ) : null}
      </motion.nav>

      <motion.header
        className="ff-hud ff-hud--brand"
        style={{ opacity: hudOpacity }}
        aria-hidden={away}
      >
        <h1 className="ff-hud__mark">Flame in Freefall</h1>
        <p className="ff-hud__tag">
          Fire-safety insights from NASA's microgravity combustion data. Choose a star to begin.
        </p>
      </motion.header>
      <motion.div
        className="ff-hud ff-hud--place"
        style={{ opacity: hudOpacity }}
        aria-hidden="true"
      >
        <span className="ff-eyebrow">Crux, the Southern Cross</span>
        <span className="ff-eyebrow">Valle del Elqui, Chile · 30° S</span>
      </motion.div>

      <div className="ff-arrival" aria-hidden="true">
        <motion.div className="ff-arrival__cover" style={{ opacity: coverOpacity }} />
        <motion.div
          className="ff-arrival__light"
          style={{
            left: focus?.x ?? 0,
            top: focus?.y ?? 0,
            width: lightRadius * 2,
            height: lightRadius * 2,
            marginLeft: -lightRadius,
            marginTop: -lightRadius,
            scale: lightScale,
            opacity: lightOpacity,
            "--tint": tok(current?.warm ? "--ember" : "--flame-blue"),
          }}
        >
          <motion.div className="ff-arrival__core" style={{ opacity: coreOpacity }} />
        </motion.div>
      </div>
    </div>
  );
}
