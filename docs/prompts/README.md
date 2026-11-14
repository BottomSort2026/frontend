# Prompts for Claude Code

Each file is one prompt for a Claude Code session opened in `frontend/`. Send them in order; each one stands alone and ends with how to verify it.

```bash
claude "$(cat docs/prompts/00-bootstrap.md)"
```

| #   | Prompt                                                | Needs from the team first                            |
| --- | ----------------------------------------------------- | ---------------------------------------------------- |
| 00  | Bootstrap and verify the scaffold                     | nothing                                              |
| 01  | Docker image and compose wiring                       | where the gateway listens                            |
| 02  | Information view on real profiles: detail and compare | a first `profiles.json`                              |
| 03  | Simulator on the real ML service                      | the prediction target decided, `/ml/model-info` live |
| 04  | Chatbot on the real agent                             | the `/chat` request and response agreed              |
| 05  | Motion review                                         | nothing                                              |
| 06  | Accessibility, small screens and smoke tests          | nothing                                              |
| 07  | Demo polish                                           | nothing                                              |

00, 05, 06 and 07 can run today on sample data. 02, 03 and 04 are written so that the session first compares the live service with `src/api/types.ts` and reports differences before changing code.

Every prompt assumes the rules in `CLAUDE.md` (no git, stay in `frontend/`, tokens only) and `DESIGN.md`.
