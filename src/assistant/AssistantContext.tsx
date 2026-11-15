import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { LabInputs, LabModelInfo, LabPredictResponse } from "../api/types";
import {
  conditionsLine,
  EXPLANATION_UNAVAILABLE,
  labCitations,
  labHistoryContent,
} from "./labMessage";
import { useChat, type AssistantStatus, type ChatMessage } from "./useChat";

/** Who opened the dock. Only a person's own click moves focus into the input. */
export type OpenedBy = "user" | "auto" | "reveal";

/** Below this width an automatic open would cover the Lab's results. */
const AUTO_OPEN_QUERY = "(min-width: 520px)";

export interface LabAnswer {
  response: LabPredictResponse;
  /** The inputs that were sent. */
  inputs: LabInputs;
  model: LabModelInfo;
}

interface AssistantValue {
  messages: ChatMessage[];
  /** "waiting" while a chat or a Lab request runs; otherwise how the last one ended. */
  status: AssistantStatus;
  chatPending: boolean;
  send: (text: string) => void;
  open: boolean;
  openedBy: OpenedBy;
  /** The person opens or closes the dock. */
  setOpen: (open: boolean) => void;
  /** Opens the dock and brings one message into view (and focus). */
  reveal: (messageId: number) => void;
  revealTarget: { id: number; n: number } | null;
  lab: {
    started: () => void;
    /** Adds the Lab message and returns its id. */
    answered: (answer: LabAnswer) => number;
    failed: () => void;
  };
}

const AssistantContext = createContext<AssistantValue | null>(null);

/** One assistant for the whole app: the conversation and the dock's open state. */
export function AssistantProvider({ children }: { children: ReactNode }) {
  const chat = useChat();
  const { add, setOutcome } = chat;
  const [labRunning, setLabRunning] = useState(0);
  const [open, setOpenState] = useState(false);
  const [openedBy, setOpenedBy] = useState<OpenedBy>("user");
  const [revealTarget, setRevealTarget] = useState<{ id: number; n: number } | null>(null);
  const openRef = useRef(open);
  openRef.current = open;
  const firstPrediction = useRef(true);

  const setOpen = useCallback((next: boolean) => {
    setOpenedBy("user");
    setOpenState(next);
  }, []);

  const reveal = useCallback((id: number) => {
    if (!openRef.current) setOpenedBy("reveal");
    setOpenState(true);
    setRevealTarget((r) => ({ id, n: (r?.n ?? 0) + 1 }));
  }, []);

  const lab = useMemo(
    () => ({
      started: () => setLabRunning((n) => n + 1),
      answered: ({ response, inputs, model }: LabAnswer): number => {
        setLabRunning((n) => Math.max(0, n - 1));
        // A sample stands for the reference case, not for what was sent: say what it really is.
        const conditions = conditionsLine(model, response.sample?.inputs ?? inputs);
        const explanation = response.explanation?.trim() || null;
        const id = add({
          role: "assistant",
          text: explanation ?? EXPLANATION_UNAVAILABLE,
          citations: explanation ? labCitations(response.cited_tests) : [],
          lab: { conditions },
          history: labHistoryContent(conditions, response.prediction, explanation),
        });
        setOutcome(explanation ? "answered" : "failed");
        // The first prediction shows where the explanation lives; after that the person decides.
        if (firstPrediction.current) {
          firstPrediction.current = false;
          if (!openRef.current && window.matchMedia(AUTO_OPEN_QUERY).matches) {
            setOpenedBy("auto");
            setOpenState(true);
          }
        }
        return id;
      },
      failed: () => {
        setLabRunning((n) => Math.max(0, n - 1));
        setOutcome("failed");
      },
    }),
    [add, setOutcome],
  );

  const status: AssistantStatus = chat.pending || labRunning > 0 ? "waiting" : chat.outcome;

  const value = useMemo<AssistantValue>(
    () => ({
      messages: chat.messages,
      status,
      chatPending: chat.pending,
      send: chat.send,
      open,
      openedBy,
      setOpen,
      reveal,
      revealTarget,
      lab,
    }),
    [
      chat.messages,
      status,
      chat.pending,
      chat.send,
      open,
      openedBy,
      setOpen,
      reveal,
      revealTarget,
      lab,
    ],
  );

  return <AssistantContext.Provider value={value}>{children}</AssistantContext.Provider>;
}

export function useAssistant(): AssistantValue {
  const value = useContext(AssistantContext);
  if (!value) throw new Error("useAssistant needs an AssistantProvider (routes/__root.tsx)");
  return value;
}
