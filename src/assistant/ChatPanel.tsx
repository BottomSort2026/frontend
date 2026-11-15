import { useEffect, useRef, useState, type FormEvent } from "react";
import Markdown from "react-markdown";
import type { Citation } from "../api/types";
import { Button } from "../ui/Button";
import { ArrowUp, Close } from "../ui/icons";
import { AssistantFace, type FaceCue } from "./AssistantFace";
import { citationHref, formatCitation } from "./citation";
import type { AssistantStatus, ChatMessage } from "./useChat";

interface ChatPanelProps {
  messages: ChatMessage[];
  pending: boolean;
  status: AssistantStatus;
  cue: FaceCue | null;
  /** Up to three opening questions; they go away after the first one is asked. */
  suggestions: readonly string[];
  onSend: (text: string) => void;
  onClose: () => void;
  /** The person started typing: the face looks down at the input. */
  onTyping: () => void;
}

/**
 * A source under an answer, on one row: the pill (acronym or accession, then the page) and the
 * document title and year. The whole row links to the PSI investigation page (never a file URL).
 */
function CitationRow({ citation: c }: { citation: Citation }) {
  const href = citationHref(c);
  const label = formatCitation(c);
  const name = c.acronym || c.accession;
  const page = c.page != null ? `p. ${c.page}` : null;
  const visible = (
    <>
      {name || page ? (
        <span className="ff-src">
          {name ? <b>{name}</b> : null}
          {page}
        </span>
      ) : null}
      <span className="ff-cite__doc">
        {c.doc_title}
        {c.year != null ? ` (${c.year})` : null}
      </span>
    </>
  );
  return href ? (
    <a
      className="ff-cite ff-cite--link"
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
    >
      {visible}
    </a>
  ) : (
    <span className="ff-cite" title={label}>
      <span aria-hidden="true" className="ff-cite__visible">
        {visible}
      </span>
      <span className="ff-cite__sr">{label}</span>
    </span>
  );
}

/** Assistant answers arrive as markdown; user text and errors stay plain. */
function MessageBody({ role, error, text }: { role: string; error?: boolean; text: string }) {
  if (role === "user" || error) return <p>{text}</p>;
  return (
    <div className="ff-md">
      <Markdown>{text}</Markdown>
    </div>
  );
}

/** The conversation with the assistant. Every answer with facts carries its citations. */
export function ChatPanel({
  messages,
  pending,
  status,
  cue,
  suggestions,
  onSend,
  onClose,
  onTyping,
}: ChatPanelProps) {
  const [draft, setDraft] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const el = log.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, pending]);

  const submit = (ev: FormEvent) => {
    ev.preventDefault();
    onSend(draft);
    setDraft("");
  };

  return (
    <section className="ff-chat" aria-label="Flame assistant">
      <header className="ff-chat__head">
        <span className="ff-chat__avatar">
          <AssistantFace size={36} status={status} cue={cue} interactive />
        </span>
        <div className="ff-chat__id">
          <span className="ff-chat__name">Flame assistant</span>
          <span className="ff-chat__sub">Answers cite NASA PSI records</span>
        </div>
        <Button variant="ghost" size="sm" icon aria-label="Close chat" onClick={onClose}>
          <Close />
        </Button>
      </header>

      <div
        className="ff-chat__log"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
        tabIndex={0}
        ref={log}
      >
        <div className="ff-msg">
          <p>
            Ask me about any microgravity combustion experiment. I answer from the PSI library and
            show where each fact comes from.
          </p>
        </div>
        {messages.length === 0 ? (
          <div className="ff-chat__ideas">
            {suggestions.slice(0, 3).map((q) => (
              <button key={q} type="button" className="ff-tag" onClick={() => onSend(q)}>
                {q}
              </button>
            ))}
          </div>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`ff-msg${m.role === "user" ? " ff-msg--user" : ""}${m.error ? " ff-msg--error" : ""}`}
          >
            <MessageBody role={m.role} error={m.error} text={m.text} />
            {m.citations && m.citations.length > 0 ? (
              <div className="ff-msg__src">
                {m.citations.map((c, i) => (
                  <CitationRow key={`${c.doc_title}-${i}`} citation={c} />
                ))}
              </div>
            ) : null}
          </div>
        ))}
        {pending ? (
          <div className="ff-msg">
            <span className="ff-typing" role="status" aria-label="Looking through PSI">
              <i />
              <i />
              <i />
            </span>
          </div>
        ) : null}
      </div>

      <form className="ff-chat__form" onSubmit={submit}>
        <input
          ref={input}
          className="ff-chat__input"
          type="text"
          placeholder="Ask about fire in space"
          aria-label="Your question"
          autoComplete="off"
          value={draft}
          onChange={(ev) => {
            if (draft.length === 0 && ev.target.value.length > 0) onTyping();
            setDraft(ev.target.value);
          }}
        />
        <Button
          variant="primary"
          icon
          type="submit"
          aria-label="Send"
          disabled={pending || draft.trim().length === 0}
        >
          <ArrowUp />
        </Button>
      </form>
    </section>
  );
}
