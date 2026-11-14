import type { BoopFaceAction } from "boopface";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "../api/mock";
import { motionTokens } from "../lib/motion";
import type { FaceCue } from "./AssistantFace";
import { BotLauncher } from "./BotLauncher";
import { ChatPanel } from "./ChatPanel";
import { useChat } from "./useChat";
import "./assistant.css";

interface AssistantDockProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** The launcher and the chat panel that grows out of it, fixed to the bottom-right corner. */
export function AssistantDock({ open, onOpenChange }: AssistantDockProps) {
  const chat = useChat();
  const reduce = useReducedMotion() ?? false;
  const launcher = useRef<HTMLButtonElement>(null);
  const [cue, setCue] = useState<FaceCue | null>(null);
  const [seen, setSeen] = useState(0);
  const play = (action: BoopFaceAction) => setCue((c) => ({ action, n: (c?.n ?? 0) + 1 }));

  const answers = chat.messages.filter((m) => m.role === "assistant").length;
  if (open && seen !== answers) setSeen(answers);

  const wasOpen = useRef(open);
  useEffect(() => {
    if (open && !wasOpen.current) play("affirm");
    if (!open && wasOpen.current) launcher.current?.focus({ preventScroll: true });
    wasOpen.current = open;
  }, [open]);

  const t = motionTokens();
  return (
    <div className="ff-dock">
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
              pending={chat.pending}
              status={chat.status}
              cue={cue}
              suggestions={SUGGESTIONS}
              onSend={chat.send}
              onClose={() => onOpenChange(false)}
              onTyping={() => play("input")}
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
