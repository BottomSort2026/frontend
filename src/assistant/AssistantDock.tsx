import type { BoopFaceAction } from "boopface";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "../api/mock";
import { motionTokens } from "../lib/motion";
import { useAssistant } from "./AssistantContext";
import type { FaceCue } from "./AssistantFace";
import { BotLauncher } from "./BotLauncher";
import { ChatPanel } from "./ChatPanel";
import "./assistant.css";

/**
 * The launcher and the chat panel that grows out of it, fixed to the bottom-right corner. The
 * conversation and the open state live in AssistantProvider, so the Flame Lab can use them too.
 */
export function AssistantDock() {
  const chat = useAssistant();
  const { open, openedBy, setOpen: onOpenChange } = chat;
  const reduce = useReducedMotion() ?? false;
  const launcher = useRef<HTMLButtonElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  const [cue, setCue] = useState<FaceCue | null>(null);
  const [seen, setSeen] = useState(0);
  const play = (action: BoopFaceAction) => setCue((c) => ({ action, n: (c?.n ?? 0) + 1 }));

  const answers = chat.messages.filter((m) => m.role === "assistant").length;
  if (open && seen !== answers) setSeen(answers);

  const wasOpen = useRef(open);
  useEffect(() => {
    // An automatic open is not a greeting: the face plays the result instead.
    if (open && !wasOpen.current && openedBy !== "auto") play("affirm");
    // Closing hands focus to the launcher only if it was in the panel (or got lost with it):
    // Escape pressed in the Lab leaves focus in the Lab.
    if (!open && wasOpen.current) {
      const at = document.activeElement;
      if (!at || at === document.body || dock.current?.contains(at))
        launcher.current?.focus({ preventScroll: true });
    }
    wasOpen.current = open;
  }, [open]);

  const t = motionTokens();
  return (
    <div className="ff-dock" ref={dock}>
      <AnimatePresence>
        {open ? (
          <motion.div
            key="panel"
            className="ff-dock__panel"
            initial={{ opacity: 0, scale: reduce ? 1 : 0.92, y: reduce ? 0 : 8 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: t.base, ease: t.out } }}
            exit={{
              opacity: 0,
              scale: reduce ? 1 : 0.96,
              transition: { duration: t.fast, ease: t.out },
            }}
          >
            <ChatPanel
              messages={chat.messages}
              pending={chat.chatPending}
              status={chat.status}
              cue={cue}
              suggestions={SUGGESTIONS}
              onSend={chat.send}
              onClose={() => onOpenChange(false)}
              onTyping={() => play("input")}
              focusInput={openedBy === "user"}
              revealTarget={chat.revealTarget}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <BotLauncher
        ref={launcher}
        open={open}
        onToggle={() => onOpenChange(!open)}
        status={chat.status}
        cue={cue}
        unread={answers > seen}
      />
    </div>
  );
}
