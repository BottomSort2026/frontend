# 01 · Docker image and compose wiring

## Context

`ARCHITECTURE.md` §5 decides Docker Compose with one Dockerfile per service and one root `compose.yaml`; only the gateway publishes a port. `frontend/Dockerfile` and `frontend/nginx.conf` exist but have never been built.

## Task

1. Build the image: `docker build -t fif-frontend .` Fix whatever fails. Run it and check `GET /health`, `/`, and a deep link such as `/flame-lab` (must return the app, not a 404).
2. Check the build argument `VITE_API_URL`: with the default `/` the bundle must call same-origin paths (`/profiles`, `/chat`, `/ml/...`); with an empty value it must use sample data.
3. Write down, as a proposal in your final message and NOT as edits, the exact changes needed outside `frontend/`:
   - the `frontend` service block for the root `compose.yaml`;
   - the gateway rules: `/profiles`, `/chat` and `/ml/*` go to their services, everything else goes to the frontend. Note that `/chat`, `/profiles` and `/ml` are therefore reserved and must never become page routes.

## Constraints

- Stay inside `frontend/`. The compose file and the gateway belong to other people.
- Keep the image small: static files on nginx, no Node at runtime.

## Done when

The image builds, the three URLs behave as described, and the compose and gateway proposal is ready to hand to their owners.
