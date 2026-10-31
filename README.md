# Daily Plan

Your plan for today, one tap from your phone's home screen. Next.js + Supabase, mobile-first PWA.

See `docs/plan.md` for the development plan and `CLAUDE.md` for working rules.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Supabase URL + publishable/anon key
npm run dev                  # http://localhost:3000
```

Until `.env.local` is filled in, auth redirects are disabled so the frontend can be built (Stage 1).
