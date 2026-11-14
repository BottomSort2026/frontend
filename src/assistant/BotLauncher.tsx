import type { Ref } from "react";
import { AssistantFace, type FaceCue } from "./AssistantFace";
import type { AssistantStatus } from "./useChat";

interface BotLauncherProps {
  open: boolean;
  onToggle: () => void;
  status: AssistantStatus;
  cue: FaceCue | null;
  /** An answer arrived while the panel was closed. */
  unread: boolean;
  ref?: Ref<HTMLButtonElement>;
}

/** The assistant, always reachable in the bottom-right corner. Opens and closes the chat. */
export function BotLauncher({ open, onToggle, status, cue, unread, ref }: BotLauncherProps) {
  const label = open
    ? "Close the flame assistant"
    : unread
      ? "Open the flame assistant, new answer"
      : "Open the flame assistant";
  return (
    <button
      ref={ref}
      type="button"
      className="ff-bot"
      aria-label={label}
      aria-expanded={open}
      onClick={onToggle}
    >
      <span className="ff-bot__face">
        <AssistantFace size={52} status={status} cue={cue} />
      </span>
      {unread && !open ? <span className="ff-bot__dot" /> : null}
      <span className="ff-bot__hint">Ask about fire in space</span>
    </button>
  );
}
