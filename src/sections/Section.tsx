import { useQueryErrorResetBoundary } from "@tanstack/react-query";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Component, Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { motionTokens } from "../lib/motion";
import { starById, type SectionId } from "../sky/stars";
import { useTravel } from "../sky/TravelContext";
import { Button } from "../ui/Button";
import "./section.css";

interface SectionProps {
  id: SectionId;
  title: string;
  lead: string;
  /**
   * Each child is wrapped in a <SectionBlock> so it joins the staggered entrance. The children
   * may suspend while their data loads: the heading stays and `loading` shows in their place.
   */
  children: ReactNode;
  /** Shown while the content waits for its data. */
  loading?: string;
  /** Shown if the content cannot load. */
  failed?: string;
}

/** The pause before the first block, then between blocks: the header enters first. */
const STAGGER = 0.07;
const FIRST_DELAY = 0.06;

function useVariants(): { container: Variants; block: Variants } {
  const reduce = useReducedMotion() ?? false;
  return useMemo(() => {
    const t = motionTokens();
    return {
      container: {
        hidden: { opacity: 0, transition: { duration: 0.2, ease: "linear" } },
        shown: {
          opacity: 1,
          transition: {
            duration: t.slow,
            ease: t.out,
            staggerChildren: STAGGER,
            delayChildren: FIRST_DELAY,
          },
        },
      },
      block: {
        hidden: { opacity: 0, y: reduce ? 0 : 14, transition: { duration: t.fast, ease: t.out } },
        shown: { opacity: 1, y: 0, transition: { duration: t.slow, ease: t.out } },
      },
    };
  }, [reduce]);
}

/** A block of section content. Blocks enter one after another once the camera arrives. */
export function SectionBlock({ children, className }: { children: ReactNode; className?: string }) {
  const { block } = useVariants();
  return (
    <motion.div className={className} variants={block}>
      {children}
    </motion.div>
  );
}

/**
 * The content blocks, staggered on their own clock: they enter right after the header when the
 * data is already there, or as soon as it arrives.
 */
function SectionContent({ children }: { children: ReactNode }) {
  const { phase } = useTravel();
  return (
    <motion.div
      style={{ display: "contents" }}
      variants={{
        hidden: {},
        shown: { transition: { staggerChildren: STAGGER, delayChildren: FIRST_DELAY + STAGGER } },
      }}
      initial="hidden"
      animate={phase === "section" ? "shown" : "hidden"}
    >
      {children}
    </motion.div>
  );
}

/** Where the content would be: waiting for it, or why it is not there. */
function SectionState({ children, busy }: { children: ReactNode; busy?: boolean }) {
  return (
    <SectionBlock>
      <div className="ff-sec__state" role={busy ? "status" : "alert"} aria-busy={busy || undefined}>
        {children}
      </div>
    </SectionBlock>
  );
}

interface BoundaryProps {
  failed: string;
  onRetry: () => void;
  children: ReactNode;
}

/** Keeps a failed load inside the section: the heading and the way back stay. */
class SectionErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <SectionState>
        <p>{this.props.failed}</p>
        <Button
          size="sm"
          onClick={() => {
            this.props.onRetry();
            this.setState({ failed: false });
          }}
        >
          Try again
        </Button>
      </SectionState>
    );
  }
}

/** What you find inside a star: the heading with the star's designation, then the content blocks. */
export function Section({
  id,
  title,
  lead,
  children,
  loading = "Loading this section…",
  failed = "This section did not load.",
}: SectionProps) {
  // Lets a failed query fetch again when the content remounts after "Try again".
  const { reset } = useQueryErrorResetBoundary();
  const { phase } = useTravel();
  const { container, block } = useVariants();
  const star = starById(id);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    document.title = `${star.name} · Flame in Freefall`;
    heading.current?.focus({ preventScroll: true });
    return () => {
      document.title = "Flame in Freefall";
    };
  }, [star.name]);

  return (
    <motion.main
      className="ff-section"
      variants={container}
      initial="hidden"
      animate={phase === "section" ? "shown" : "hidden"}
    >
      <article className={`ff-sec${star.warm ? " ff-sec--warm" : ""}`}>
        <motion.header className="ff-sec__head" variants={block}>
          <p className="ff-eyebrow ff-sec__eyebrow">
            <i />
            <span>
              <span className="ff-sec__gr">{star.greek}</span> Crucis · {star.name}
            </span>
          </p>
          <h2 className="ff-sec__title" tabIndex={-1} ref={heading}>
            {title}
          </h2>
          <p className="ff-sec__lead">{lead}</p>
        </motion.header>
        <SectionErrorBoundary failed={failed} onRetry={reset}>
          <Suspense fallback={<SectionState busy>{loading}</SectionState>}>
            <SectionContent>{children}</SectionContent>
          </Suspense>
        </SectionErrorBoundary>
      </article>
    </motion.main>
  );
}
