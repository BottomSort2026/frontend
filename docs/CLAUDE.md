# Flame in Freefall: NASA Space Apps 2026

The full project context (problem, data, architecture, and the decided vs. open items) lives in
`ARCHITECTURE.md` and is loaded below. Read its §0 first.

@ARCHITECTURE.md

## Working rules for every Claude session

- Items marked **DECIDED** in `ARCHITECTURE.md` §0 are constraints. Do not redesign them without the team's
  approval. Items marked **OPEN** must not be assumed; ask, or keep the code flexible.
- If code and `ARCHITECTURE.md` disagree, point it out instead of silently following one of them.
- When a team decision changes, update `ARCHITECTURE.md` (the §0 status table and the relevant section) in
  the same change, so every session stays aligned.
- Stay inside your service's folder (`gateway/`, `frontend/`, `mcp/`, `ml/`, `data_provider/`) unless the
  task requires otherwise. Cross-service contracts live in `shared/`.
- REST + JSON between services. Service URLs come from environment variables (`ML_URL`, `MCP_URL`,
  `DATA_PROVIDER_URL`, `CORPUS_PATH`); never hard-code them.
- Chatbot behavior: search the corpus **in English**, answer **in the user's language**. Cite the specific
  document and page plus the PSI investigation page URL. Never cite a pre-signed S3 file URL.
- Never bulk-download PSI investigations (several are 0.5–2.2 TB). Use `psi_client.py` and select files
  deliberately.

## Useful commands

```bash
python3 psi_client.py search combustion              # list the PSI investigations
python3 psi_client.py files PSI-69 --ext .csv        # list an investigation's files
python3 psi_client.py get PSI-69 "<file_name>" -o data   # download one file
docker compose up                                    # start the whole system
docker compose up ml                                 # start one service
```
