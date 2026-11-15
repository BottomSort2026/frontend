import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Link, Outlet } from "@tanstack/react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect } from "react";
import { AssistantProvider, useAssistant } from "../assistant/AssistantContext";
import { AssistantDock } from "../assistant/AssistantDock";
import { motionTokens } from "../lib/motion";
import { SkyMap } from "../sky/SkyMap";
import { TravelProvider, useTravel } from "../sky/TravelContext";
import { Button } from "../ui/Button";
import { ChevronLeft } from "../ui/icons";
import "../sections/section.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Root,
  notFoundComponent: NotFound,
});

function Root() {
  return (
    <TravelProvider>
      <AssistantProvider>
        <Shell />
      </AssistantProvider>
    </TravelProvider>
  );
}

/** The sky stays mounted under everything; a section is an overlay on top of it. */
function Shell() {
  const { phase, leave } = useTravel();
  const reduce = useReducedMotion() ?? false;
  const { open: chatOpen, setOpen: setChatOpen } = useAssistant();

  // Escape closes the chat if it is open; otherwise it returns to the sky.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "Escape") return;
      if (chatOpen) setChatOpen(false);
      else leave();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [chatOpen, setChatOpen, leave]);

  const t = motionTokens();
  return (
    <div className="ff-app">
      <SkyMap />
      <Outlet />
      <AnimatePresence>
        {phase === "section" ? (
          <motion.div
            key="back"
            className="ff-back"
            initial={{ opacity: 0, x: reduce ? 0 : -6 }}
            animate={{ opacity: 1, x: 0, transition: { duration: t.base, ease: t.out } }}
            exit={{ opacity: 0, transition: { duration: t.fast } }}
          >
            <Button variant="glass" onClick={leave}>
              <ChevronLeft />
              Back to sky
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
      <AssistantDock />
    </div>
  );
}

function NotFound() {
  return (
    <main className="ff-section ff-section--over">
      <article className="ff-sec">
        <header className="ff-sec__head">
          <p className="ff-eyebrow">Off the chart</p>
          <h2 className="ff-sec__title">No star here.</h2>
          <p className="ff-sec__lead">That address is not part of this sky.</p>
        </header>
        <div className="ff-sec__row">
          <Link to="/" className="ff-btn ff-btn--primary">
            Back to sky
          </Link>
        </div>
      </article>
    </main>
  );
}
