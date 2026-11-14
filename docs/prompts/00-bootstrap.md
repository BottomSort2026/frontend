# 00 · Bootstrap and verify the scaffold

## Context

You are in `frontend/` of the Flame in Freefall monorepo. The scaffold was written outside this repository and has just been copied in. Read `CLAUDE.md`, `README.md` and `DESIGN.md` here, and `ARCHITECTURE.md` in the repository root, before doing anything.

## Task

1. Run `pnpm install`, `pnpm check`, `pnpm test` and `pnpm build`. Report the result of each. If one fails, fix the cause, not the symptom, and say what it was.
2. Start `pnpm dev` and confirm the app answers on its port. Open it if you have a browser tool and walk through: home sky, click each of the four stars, "Back to sky", `Escape`, browser back, the assistant in the bottom right, a direct load of `/library?habitat=moon_base&fuel=solid`.
3. Compare the scaffold with `ARCHITECTURE.md`. List every place where they disagree (paths, field names, repository layout, anything marked DECIDED). Do not resolve disagreements: list them.
4. Install the agent skills the team uses, project-scoped, and confirm each is listed afterwards:
   - `pnpm dlx skills@latest add emilkowalski/skills`
   - `pnpm dlx skills@latest add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`
   - `pnpm dlx skills@latest add akillness/jeo-skills --skill ponytail`
   - TanStack ships skills with its packages: run `pnpm approve` and report what it offers before accepting.

   Use `pnpm dlx`, not `npx`: `package.json` requires pnpm through `devEngines`, and npm refuses to run `npx` here.

## Constraints

- Do not change application code in this session unless a command fails.
- Do not commit. Skills that write files into the repository are fine; list the files they added.

## Done when

All four commands pass, the walkthrough is reported step by step (or you say plainly that you could not open a browser), and the list of disagreements with `ARCHITECTURE.md` is in your final message.
