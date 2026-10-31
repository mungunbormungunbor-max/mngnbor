# CLAUDE.md — Daily Plan (working name)

Read `docs/plan.md` at the start of every session. It is the source of truth for features, pages, and stages.
Stage guides: `stage-1-frontend-solo-en.md`, `stage-2-review-sql-solo-en.md`, `stage-3-server-solo-en.md`.

## Tech stack
- Next.js (frontend), Supabase (auth + database). Mobile-first PWA.

## Features (name = directory name under `features/`)
| Feature | Directory |
|---|---|
| auth (base project, do not rebuild) | — |
| today-view | `features/today-view` |
| plan-editor | `features/plan-editor` |
| plan-calendar | `features/plan-calendar` |
| app-settings | `features/app-settings` |

Build order: today-view → plan-editor → plan-calendar → app-settings.

## Current stage: **Stage 1 — Frontend only**

## Development rules
1. **Frontend only in Stage 1.** No server code, no Supabase code, no SQL.
2. **Naming:** the page/directory name must exactly match the feature name
   (feature `today-view` → `features/today-view`, route `/today-view`).
3. **Location:** all frontend files for a feature live under `features/<feature-name>/`.
   Route files in `app/` only import from that feature directory; keep them thin.
4. **One feature at a time.** Do not touch anything outside the feature being built.
5. **Avoid confusing names:** no file, component, or identifier names that could be mistaken
   for another feature's name (e.g. don't call something `PlanCalendar` inside `plan-editor`).
6. **Branches:** never work on `main`. Use `feature/<feature-name>` for each feature.
7. **Before starting**, ask: "Which feature am I building?", read `docs/plan.md`, and confirm
   the scope. Generate code only after the owner confirms.
8. When a feature is done, commit it on its branch and move to the next one.

## Stage 2 rules (Review & SQL) — for later
- Merge feature branches into `main`, review and fix everything.
- SQL only, saved as `sql/<feature-name>.sql`. No server functionality, no extra features.

## Stage 3 rules (Server) — for later
- One feature's server at a time, minimal changes, never touch other features' code or prompts.
- Read the feature's frontend, its SQL, and `docs/plan.md` before building. Test, then commit.
- Daily routine: update `docs/plan.md` → create a branch → check `CLAUDE.md` → start working.
