import { useNavigate, useRouterState } from "@tanstack/react-router";
import {
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
  type MotionValue,
} from "motion/react";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motionTokens } from "../lib/motion";
import type { Bezier } from "../lib/tokens";
import { starById, starForPath, type SectionId, type StarDef } from "./stars";

// The trip between the sky and a section. One progress value `e` (0 = sky, 1 = inside the
// star) drives every layer, so a trip can be reversed at any moment. The URL is the source of
// truth for where you are; this context only adds the animation between places.

/** sky: at rest. in: flying to a star. section: arrived. out: flying back. */
export type TravelPhase = "sky" | "in" | "section" | "out";

interface Travel {
  e: MotionValue<number>;
  phase: TravelPhase;
  /** The star being visited, or the last one visited (the return trip starts from it). */
  current: StarDef | null;
  go: (star: StarDef) => void;
  leave: () => void;
  /** Jump to another section without returning to the sky. */
  jump: (id: SectionId) => void;
}

const TravelContext = createContext<Travel | null>(null);

export function useTravel(): Travel {
  const travel = use(TravelContext);
  if (!travel) throw new Error("useTravel must be used inside <TravelProvider>");
  return travel;
}

export function TravelProvider({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const reduce = useReducedMotion() ?? false;
  const landed = starForPath(pathname);

  // A deep link starts inside the star: no trip.
  const e = useMotionValue(landed ? 1 : 0);
  const [phase, setPhaseState] = useState<TravelPhase>(landed ? "section" : "sky");
  const [current, setCurrent] = useState<StarDef | null>(landed);
  const phaseRef = useRef<TravelPhase>(phase);
  const anim = useRef<AnimationPlaybackControls | null>(null);
  const timer = useRef(0);

  const setPhase = useCallback((next: TravelPhase) => {
    phaseRef.current = next;
    setPhaseState(next);
  }, []);

  const run = useCallback(
    (to: number, duration: number, ease: Bezier, done: () => void) => {
      anim.current?.stop();
      if (reduce) {
        e.set(to);
        done();
        return;
      }
      // Animating the same value again starts from wherever it is: that is what makes trips reversible.
      anim.current = animate(e, to, { duration, ease, onComplete: done });
    },
    [e, reduce],
  );

  const go = useCallback(
    (star: StarDef) => {
      if (phaseRef.current !== "sky") return;
      const t = motionTokens();
      setCurrent(star);
      setPhase("in");
      run(1, t.travel, t.travelEase, () => {
        setPhase("section");
        void navigate({ to: star.path });
      });
    },
    [navigate, run, setPhase],
  );

  const leave = useCallback(() => {
    const t = motionTokens();
    if (phaseRef.current === "in") {
      // Escape mid-flight: turn around from where we are.
      setPhase("out");
      run(0, 0.52, t.out, () => setPhase("sky"));
      return;
    }
    if (phaseRef.current !== "section") return;
    setPhase("out"); // the section fades first, then the camera pulls back
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(
      () => {
        void navigate({ to: "/" });
        run(0, t.travelBack, t.out, () => setPhase("sky"));
      },
      reduce ? 0 : 200,
    );
  }, [navigate, reduce, run, setPhase]);

  const jump = useCallback(
    (id: SectionId) => {
      if (phaseRef.current !== "section") return;
      void navigate({ to: starById(id).path });
    },
    [navigate],
  );

  // Browser back and forward, and links between sections, change the URL without calling go/leave.
  useEffect(() => {
    const star = starForPath(pathname);
    if (star) {
      setCurrent(star);
      if (phaseRef.current === "sky" || phaseRef.current === "out") {
        window.clearTimeout(timer.current);
        anim.current?.stop();
        e.set(1);
        setPhase("section");
      }
    } else if (phaseRef.current === "section") {
      setPhase("out");
      run(0, motionTokens().travelBack, motionTokens().out, () => setPhase("sky"));
    }
  }, [pathname, e, run, setPhase]);

  useEffect(
    () => () => {
      window.clearTimeout(timer.current);
      anim.current?.stop();
    },
    [],
  );

  const value = useMemo<Travel>(
    () => ({ e, phase, current, go, leave, jump }),
    [e, phase, current, go, leave, jump],
  );
  return <TravelContext value={value}>{children}</TravelContext>;
}
