// Errors from the gateway, kept with their body so the interface can show the service's message.

export class ApiError extends Error {
  readonly status: number;
  /** The parsed response body, e.g. the gateway's { error, detail } or a FastAPI { detail }. */
  readonly body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

/**
 * A readable message from an error body: a string `detail` (gateway, FastAPI), a FastAPI list of
 * validation errors, or `message` / `error`. Null when the body says nothing a person can read.
 */
export function errorDetail(body: unknown): string | null {
  if (typeof body === "string") return body.trim() || null;
  if (typeof body !== "object" || body === null) return null;
  const b = body as Record<string, unknown>;
  if (typeof b.detail === "string" && b.detail.trim()) return b.detail.trim();
  if (Array.isArray(b.detail)) {
    const msgs = b.detail
      .map((d) => (typeof d === "object" && d !== null ? (d as { msg?: unknown }).msg : d))
      .filter((m): m is string => typeof m === "string" && m.trim().length > 0);
    if (msgs.length) return msgs.join("; ");
  }
  for (const key of ["message", "error"] as const) {
    if (typeof b[key] === "string" && (b[key] as string).trim()) return (b[key] as string).trim();
  }
  return null;
}
