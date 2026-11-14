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
}

/** Where the assistant is in the life of a request. The face acts it out. */
export type AssistantStatus = "idle" | "waiting" | "answered" | "unsourced" | "failed";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<AssistantStatus>("idle");
  const nextId = useRef(1);
  const { mutate, isPending } = useMutation({ mutationFn: (req: ChatRequest) => api.chat(req) });

  const send = useCallback(
    (raw: string) => {
      const text = raw.trim();
      if (!text || isPending) return;
      const history = messages
        .filter((m) => !m.error)
        .map((m) => ({ role: m.role, content: m.text }));
      setMessages((list) => [...list, { id: nextId.current++, role: "user", text }]);
      setStatus("waiting");
      mutate(
        { message: text, history },
        {
          onSuccess: (reply) => {
            setMessages((list) => [
              ...list,
              {
                id: nextId.current++,
                role: "assistant",
                text: reply.answer,
                citations: reply.citations,
              },
            ]);
            setStatus(reply.citations.length > 0 ? "answered" : "unsourced");
          },
          onError: () => {
            setMessages((list) => [
              ...list,
              {
                id: nextId.current++,
                role: "assistant",
                text: "I could not reach the assistant service. Try again in a moment.",
                error: true,
              },
            ]);
            setStatus("failed");
          },
        },
      );
    },
    [isPending, messages, mutate],
  );

  return { messages, status, pending: isPending, send };
}
