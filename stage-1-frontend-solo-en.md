# Stage 1 — Frontend-Only Development (Solo Project)

## Before You Start

- First, write a **development document** (spec/plan) and save it as `docs/plan.md`.
  - Contents: app name, what it does, the list of features, and a short description of each page.
  - You can use AI to help draft it, but you make the final decisions.
- Create a `CLAUDE.md` file and write the rules below into it (the AI reads this file every session).
- Have the AI generate a `.gitignore` (exclude `node_modules`, `.env`, `.next`, etc.).
- The base project (Next.js, login/signup pages, Supabase connection) must already be set up.
- Working on branches is safer: don't work directly on `main`; create a `feature/<name>` branch for each feature.

## Rules

1. **Frontend only.** Do not touch server code, Supabase code, or SQL.
2. **Naming:** the page/directory name must exactly match the feature name (e.g., the `todo-list` feature gets a `todo-list` directory). Write this rule explicitly in `CLAUDE.md`.
3. **Location:** all frontend files for a feature live under the `features/` directory.
4. **One feature at a time.** Don't touch anything outside the feature you're currently building.
5. **Avoid confusing names:** don't use names that could be mistaken for another feature's name.

## Working With the AI Assistant

1. Before starting, the AI (Claude Code) should first ask: **"Which feature am I building?"**
2. The AI reads `docs/plan.md` and confirms the scope of that feature.
3. Only after you confirm **"I built this feature"** is the frontend for that feature generated.
4. At this stage, **no SQL** and no server code is generated.
5. When a feature is done, commit it and move on to the next one.

## Note: If You Built Your Own Login/Signup

- **Option A:** Discard your version and use the shared base version (simplest).
- **Option B:** Keep the base as-is and integrate your custom code on top of it.
