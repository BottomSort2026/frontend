import { createFileRoute } from "@tanstack/react-router";

// The sky itself lives in the root layout, so the home route adds nothing on top of it.
export const Route = createFileRoute("/")({ component: () => null });
