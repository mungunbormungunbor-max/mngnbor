# Stage 3 — Server Build (Minimal Footprint, Solo Project)

This is the key stage. Once the frontend code, SQL, and development document (`docs/plan.md`) are all in place, build the server with **minimal changes**.

## Guidelines to Give the AI Assistant

- Make only the minimal changes needed to implement server functionality.
- Avoid naming that could be confused with other features' names.
- Keep changes clean and merge-friendly.
- Build **one** feature's server at a time. Never touch the code or prompts of other features.

## Order of Operations

1. Pick a feature (the AI asks: "Which feature's server should I build?").
2. The AI reads the frontend, the SQL, and `docs/plan.md`.
3. Build the server with minimal changes.
4. Test that it works, then commit.
5. Move on to the next feature.

## Daily Routine (Repeat)

Update `docs/plan.md` → create a branch → check your `CLAUDE.md` → start working.
