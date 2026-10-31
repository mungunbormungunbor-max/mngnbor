# Stage 2 — Review & SQL (Solo Project)

There is no team to merge, so instead you bring all your feature branches into `main` and review everything in one go.

## Steps

1. **Bring all features into `main`.** Merge your feature branches into `main`. If conflicts appear, resolve them with the AI's help.
2. **Full review.** Tell the AI:
   > *"Review everything and fix anything that needs fixing."*

   Then check the result yourself: does the app run, are there errors, are there any naming conflicts?
3. **Build the SQL.** Tell the AI:
   > *"Now build the SQL."*

## Rules

- At this stage, **do not build server functionality.** Touch SQL only.
- Do not propose or add extra features beyond what's needed.
- Save SQL files in the `sql/` directory (e.g., `sql/<feature-name>.sql`).

## Installing the SQL

- Run the finished SQL in **your own Supabase dashboard** (SQL Editor).
- Verify that the tables were created.
- No need to distribute or pull it to anyone else.
