import { motion, useReducedMotion, type Variants } from "motion/react";
import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { motionTokens } from "../lib/motion";
import { starById, type SectionId } from "../sky/stars";
import { useTravel } from "../sky/TravelContext";
import "./section.css";

interface SectionProps {
  id: SectionId;
  title: string;
  lead: string;
  /** Each child is wrapped in a <SectionBlock> so it joins the staggered entrance. */
  children: ReactNode;
}

function useVariants(): { container: Variants; block: Variants } {
  const reduce = useReducedMotion() ?? false;
  return useMemo(() => {
    const t = motionTokens();
    return {
      container: {
        hidden: { opacity: 0, transition: { duration: 0.2, ease: "linear" } },
        shown: {
          opacity: 1,
          transition: { duration: t.slow, ease: t.out, staggerChildren: 0.07, delayChildren: 0.06 },
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

/** What you find inside a star: the heading with the star's designation, then the content blocks. */
export function Section({ id, title, lead, children }: SectionProps) {
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
        {children}
      </article>
    </motion.main>
  );
}
