import "boopface/lite";
import type { BoopFace, BoopFaceAction } from "boopface";
import { useEffect, useMemo, useRef } from "react";
import { tok } from "../lib/tokens";
import type { AssistantStatus } from "./useChat";

/** A one-off expression, e.g. a nod when the chat opens. Change `n` to play it again. */
export interface FaceCue {
  action: BoopFaceAction;
  n: number;
}

interface AssistantFaceProps {
  size: number;
  status: AssistantStatus;
  cue?: FaceCue | null;
  /** Lets people squeeze the face and tug its antenna. Off inside the launcher button. */
  interactive?: boolean;
}

/** The assistant's animated face (the BoopFace web component), in flame-blue. Its expressions follow the request. */
export function AssistantFace({ size, status, cue, interactive = false }: AssistantFaceProps) {
  const ref = useRef<BoopFace>(null);
  const color = useMemo(() => tok("--flame-blue") || "#5ec2ff", []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.startWaiting !== "function") return;
    if (status === "waiting") {
      void el.startWaiting({ variant: "wave" });
      return () => {
        el.stopWaiting();
      };
    }
    if (status === "answered") void el.play("success");
    else if (status === "unsourced") void el.play("inspect");
    else if (status === "failed") void el.play("failure");
  }, [status]);

  useEffect(() => {
    const el = ref.current;
    if (cue && el && typeof el.play === "function") void el.play(cue.action);
  }, [cue]);

  return (
    <boop-face
      ref={ref}
      size={String(size)}
      color={color}
      auto-sleep="60000"
      press-squeeze={interactive ? "true" : "false"}
      antenna-drag={interactive ? "true" : "false"}
      aria-hidden="true"
    />
  );
}
