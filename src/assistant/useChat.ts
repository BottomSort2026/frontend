import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { api } from "../api/client";
import type { ChatRequest, Citation } from "../api/types";

export interface ChatMessage {
  id: number;
  role: "user" | "assistant";
  text: string;
  citations?: Citation[];
  error?: boolean;
  /** A Flame Lab prediction delivered as an assistant message. */
  lab?: {
    /** The conditions it was computed for, e.g. "methanol · 1.00 atm · 21 % O₂ · …". */
    conditions: string;
  };
  /** What goes into the history of the next /chat request, when it differs from `text`. */
  history?: string;
}

/** Where the assistant is in the life of a request. The face acts it out. */
export type AssistantStatus = "idle" | "waiting" | "answered" | "unsourced" | "failed";

/**
 * The conversation, held in memory for the session. Used once, by AssistantProvider: every
 * view talks to the same assistant.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** How the last request ended. "waiting" is derived by the provider from what is running. */
  const [outcome, setOutcome] = useState<AssistantStatus>("idle");
  const nextId = useRef(1);
  const { mutate, isPending } = useMutation({ mutationFn: (req: ChatRequest) => api.chat(req) });

  /** Appends a message and returns its id. */
  const add = useCallback((message: Omit<ChatMessage, "id">): number => {
    const id = nextId.current++;
    setMessages((list) => [...list, { ...message, id }]);
    return id;
  }, []);

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || isPending) return;
      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.history ?? m.text }));
      add({ role: "user", text });
      mutate(
        { message: text, history },
        {
          onSuccess: (reply) => {
            add({ role: "assistant", text: reply.answer, citations: reply.citations });
            setOutcome(reply.citations.length > 0 ? "answered" : "unsourced");
          },
          onError: () => {
            add({
              role: "assistant",
              text: "I could not reach the assistant service. Try again in a moment.",
              error: true,
            });
            setOutcome("failed");
          },
        },
      );
    },
    [add, isPending, messages, mutate],
  );

  return { messages, outcome, setOutcome, pending: isPending, send, add };
}
