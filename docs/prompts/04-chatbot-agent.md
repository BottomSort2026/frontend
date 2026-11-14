# 04 · Chatbot on the real agent

## Context

`ARCHITECTURE.md` §5: the chatbot goes Gateway → `/chat` (agent) → MCP tools. The agent searches in English and answers in the user's language. Every technical claim cites the specific document and page and links to the PSI investigation page, never to a file URL. The document does not define the `/chat` request or response yet, so `ChatRequest`, `ChatReply` and `Citation` in `src/api/types.ts` are a proposal.

## Before you write code

Ask for, or read from the `mcp/` service, the actual `/chat` schema. Report how it differs from the proposal. If it streams (SSE or chunked), say so: that changes the task below.

## Task

1. Align `types.ts`, `client.ts`, `mock.ts` and `assistant/useChat.ts` with the real schema.
2. If the agent streams: render the answer as it arrives, keep the face in its waiting state until the first token, then `success` at the end. Citations appear when the answer completes. The user can stop a running answer.
3. Citations: show the document title and page; the pill links to `investigation_url` for PSI documents or `public_url` for NASA pages. If an answer makes technical claims and arrives with no citations, show it with a visible "No source found" note and play `inspect`.
4. Render answers as safe rich text: paragraphs, lists, inline code and links only. No raw HTML from the model.
5. Failure states: network error, timeout (say after how long), and a rate limit, each with a message that tells the user what to do next. The face plays `failure` once.
6. The opening suggestions come from one place and can later be replaced by questions per section (for example, different suggestions while the user is in the Flame lab).

## Constraints

- The interface stays in English; do not translate the agent's answers and do not force its language.
- Conversation history lives in memory for the session. No local storage.
- No Markdown library heavier than a few kilobytes without asking.

## Done when

`pnpm check` and `pnpm test` pass; a unit test covers the citation link choice and the no-citation case; you have had a real conversation against the agent in English and in Spanish and report what came back.
