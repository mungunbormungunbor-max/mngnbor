# **Development Plan — Daily Plan Home Screen App**

> Status: draft. Items marked **(confirm)** are my proposals — the final decision is the owner's.

## **1\. App Overview**

* **App name:** Daily Plan (working name) **(confirm)**  
* **Tech stack:** Next.js (frontend), Supabase (auth \+ database). Base project with login/signup and Supabase connection is already set up.  
* **What it does:** Shows the user's plan for today directly on their phone's home screen, so they see what to do at a glance without opening and navigating an app. The goal is to save the user time.  
* **Delivery approach:** Built as a mobile-first web app (installable to the home screen as a PWA). The home-screen view is a compact, glanceable page designed to be opened in one tap. A native iOS/Android widget is a possible later step, outside this plan.

## **2\. Feature List**

Each feature name is also its directory name under `features/` (see Naming Rules).

| \# | Feature name | Summary |
| ----- | ----- | ----- |
| 1 | `auth` | Login / signup (provided by the base project; do not rebuild) |
| 2 | `today-view` | Compact "today's plan" screen meant to be the home-screen shortcut target |
| 3 | `plan-editor` | Create, edit, delete, and reorder items in a day's plan |
| 4 | `plan-calendar` | Pick another date and view or edit that day's plan |
| 5 | `app-settings` | Basic preferences (display options, account, logout) **(confirm)** |

Build order: `today-view` → `plan-editor` → `plan-calendar` → `app-settings`.

## **3\. Pages**

### **`auth` (base project)**

Login and signup pages. Already exists. Not modified during Stage 1\.

### **`today-view`**

* Shows today's date and the list of today's plan items in time order.  
* Large, readable text; minimal chrome; fits one phone screen without scrolling for a typical day.  
* Each item can be marked done with one tap.  
* Shows a friendly empty state when nothing is planned, with a link to `plan-editor`.  
* Designed so the installed home-screen icon opens directly to this page.
* Added (owner request): time-of-day greeting; progress bar ("2 of 5 done"); **Now / Next** badge on the
  current or upcoming item and amber time on missed items (refreshes every minute); haptic tap on supported phones.
* Effects: staggered fade-in, check "pop", animated strike-through, smooth progress fill, confetti +
  "All done for today!" banner when everything is checked. All motion respects the phone's reduce-motion setting.
* "Edit" button in the header opens `plan-editor` for today.
* More (owner request): "Next: <item> in 25 min" line; swipe an item right to complete it; 🔥 day streak;
  "Hide done" toggle (remembered); remaining count in the tab title and on the installed app icon badge;
  auto-scroll to the current item; time-of-day sky glow with a floating sun/moon; tap ripple; counting-up
  percent; rotating celebration messages.
* Streak points (owner request): +10 points per completed item, plus a streak bonus of 5 x streak days when
  the whole day is finished. Points are stored per day (`daily-plan:today-view-points:<date>`), so un-ticking
  takes them back. Shows total points, a rank (Starter / Planner / Achiever / Pro / Legend) and a floating "+N".

* Week tabs (owner request): a Mon–Sun strip under the header with ‹ › arrows for other weeks. A dot marks
  days with items (green when all done). Tap a day to see only that day's items (view-only); "Back to today"
  returns. Progress, points and streak always describe today. Full month view stays in `plan-calendar`.
* Bilingual (owner request, whole app): Mongolian / English, chosen from a menu (☰) in the `today-view`
  header and on the login/signup pages. Shared code lives in `lib/i18n/` (all text in `messages.ts`) and
  `components/app-menu.tsx`; the choice is saved in the `daily-plan-lang` cookie. New features must add
  their text to `messages.ts` in both languages. `plan-editor` is translated too (menu in its header). `app-settings`
  can later reuse the same language option. Smart quick-add still recognises English "at 7pm" and 24h "19:00".

* Color scheme "Twilight" (owner request, whole app): violet `brand-*` scale + pink accent on a lavender canvas (deep
  indigo in dark mode), defined once in `app/globals.css`. Gold stays for points, orange for the streak flame.
  App icons, manifest and browser theme color match.

### **`plan-editor`**

* Form to add a plan item: title, optional time, optional note.  
* List of the selected day's items with edit, delete, and reorder.  
* Defaults to today; receives the date when opened from `plan-calendar`.
* Time editing (owner request): change or clear an item's time directly in the list; items re-sort by time.
* More (owner request): smart quick-add (type "Gym at 7pm" and the time is detected); quick time chips
  (Morning / Noon / Afternoon / Evening / In 1 hour); title suggestions from recent items; "N unfinished from
  yesterday — Bring over" banner; per-item ⋯ menu (Duplicate, Move to tomorrow, Delete) with undo; same-time
  warning; "Clear done" with undo.
* Effects: list rows slide to their new position when re-sorted, form shakes on an empty submit, menu/banner
  pop-in, flash on changed rows, haptics. All motion respects the reduce-motion setting.

> Stage 1 note: until Supabase is wired in Stage 3, features share mock data through localStorage key
> `daily-plan:plan-items:YYYY-MM-DD` (named after the table, not a feature).

### **Login, signup and forgot password** (owner request)

* `/login` and `/signup` as before; both are also in the ☰ menu while signed out (Log in / Sign up buttons), and
  "My account" replaces them once signed in. The login page has a **Forgot password?** link.
* `/forgot-password`: enter your email, Supabase emails a reset link (the page always says "if an account exists...",
  so it never reveals which emails are registered). The link opens `/reset-password`, where you choose a new password
  (8+ characters, typed twice) and are taken to the app. Expired or reused links show "Request a new link".
* The proxy treats `/forgot-password` and `/reset-password` as public pages; `/reset-password` stays reachable after the
  recovery link signs you in.
* **Supabase setting needed:** Authentication -> URL Configuration -> Redirect URLs must include
  `https://mngnbor.vercel.app/reset-password` (and `http://localhost:3000/reset-password` for local testing),
  or the emailed link will be rejected. The default Supabase email sender is limited to a few emails per hour;
  use custom SMTP before launch.

### **`my-account`** (owner request, first Stage 2/3 feature)

* `/my-account` (open it from the ☰ menu): your **unique user ID** (the Supabase Auth UUID, with a Copy button),
  **profile** (view and edit display name; email shown read-only; member-since date), and **account settings**
  (change password, sign out, delete account with the email typed to confirm).
* Registration (`/signup`, now with a name field and 8+ character passwords) and login (`/login`) use Supabase Auth.
  The proxy sends signed-out visitors to `/login`. Signing in/out does a full page load so no data carries over.
* **Privacy:** `sql/my-account.sql` creates `profiles` (id = auth user id) with row level security so each user can
  only read and change their own row, creates the profile automatically at signup, and adds `delete_my_account()`.
  Until plans and money records move to the database, they stay in this browser, and every storage key is prefixed
  with the user ID (`lib/user-scope`), so two accounts on one phone never see each other's data. Signed-out (guest) data
  keeps the old unprefixed keys and is not copied into new accounts.
* **To switch it on:** (1) create a Supabase project, (2) run `sql/my-account.sql` in the SQL Editor, (3) put
  `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local` and in Vercel, (4) in Supabase
  Authentication -> URL Configuration set the Site URL to the deployed address.
* Next (not done yet): move `plan_items` and `money_entries` into the database with `user_id` + the same row level
  security, so data follows the user across devices; password reset by email.

### **`money-tracker`** (owner request)

* Income and expense records at `/money-tracker` (open it from the ☰ menu). Add a record: Income or Expense, amount,
  category, date (default today), optional note. Tap a record to edit or delete it (delete has Undo).
* Summary cards: **remaining balance** (income minus expenses; turns red-orange when negative), **total income**,
  **total expenses**. View a single month (‹ › arrows) or All time; filter the list by All / Income / Expense
  (the totals always cover the whole period). Currency: MNT ₮ / USD $ / EUR € (default follows the language).
* Stage 1 data: localStorage `daily-plan:money-entries` (named after the future `money_entries` table) and
  `daily-plan:money-prefs`. Fields: id, kind, amount, category, note, date, createdAt.

### **Controls** (owner request, whole app)

* A "Controls" section in the ☰ menu: **text size** (Small 90% / Default / Large 115%, scales the whole app),
  **vibration feedback** on/off (every buzz goes through `haptic()`), and **animations** on/off (stops confetti,
  slides and fades). Saved on the device (`daily-plan:controls`), applied before first paint. Code: `lib/controls/`,
  `components/controls-panel.tsx`.

### **Appearance** (owner request, whole app)

* Light / Dark / System switch in the ☰ menu (default: System, follows the phone). The choice is saved in
  localStorage (`daily-plan:theme`) and applied as a `dark` class on `<html>` before first paint, so there is no
  flash. Code: `lib/theme/`, `components/theme-picker.tsx`. Address-bar colour follows the choice.

### **`notifications`** (owner request)

* Phone reminders for plan items that have a time. Turned on from the ☰ menu (asks the phone for permission),
  with a choice of On time / 5 / 10 / 30 min before, and a "Send a test" button. Each reminder is sent once per
  item and time; done items are skipped. Tapping a notification opens `today-view`.
* Stage 1 limit: there is no server, so reminders only fire while the app is open or still alive in the
  background. Reminders when the app is fully closed need web push (Stage 3, server). On iPhone, the app must be
  added to the Home Screen first.
* Files: `features/notifications/`, `public/sw.js` (service worker), a panel inside `components/app-menu.tsx`.

### **`plan-calendar`**

* Month view with a marker on days that have plan items.  
* Tapping a day opens that day's plan (view and edit).  
* Button to jump back to today.

### **`app-settings`**

* Account info and logout.  
* Display options such as text size and theme **(confirm)**.

## **4\. Data (for Stage 2 — SQL)**

Draft only; the real schema is produced in Stage 2 from the finished frontend.

* `plan_items`: id, user\_id, plan\_date, title, note, start\_time, is\_done, sort\_order, created\_at  
* Each user can only read and write their own rows.

## **5\. Development Rules**

These are copied into `CLAUDE.md` so the AI reads them every session.

1. **Frontend only in Stage 1\.** No server code, Supabase code, or SQL.  
2. **Naming:** the page/directory name must exactly match the feature name (e.g., feature `today-view` → `features/today-view`).  
3. **Location:** all frontend files for a feature live under `features/`.  
4. **One feature at a time.** Do not touch anything outside the feature being built.  
5. **Avoid confusing names:** no names that could be mistaken for another feature's name.  
6. **Branches:** never work on `main`; use `feature/<feature-name>` for each feature.  
7. Before starting, the AI asks: "Which feature am I building?", reads this file, and confirms the scope. It generates code only after the owner confirms.

## **6\. Stages**

### **Stage 1 — Frontend only**

* Build each feature's frontend, one at a time, on its own branch. Commit when a feature is done.  
* No SQL, no server code.

### **Stage 2 — Review & SQL**

1. Merge all feature branches into `main`; resolve conflicts with the AI.  
2. Ask the AI: "Review everything and fix anything that needs fixing." Then check manually: the app runs, no errors, no naming conflicts.  
3. Ask the AI: "Now build the SQL." Save files in `sql/<feature-name>.sql`.  
4. Run the SQL in my own Supabase dashboard (SQL Editor) and verify the tables exist.  
* Do not build server functionality in this stage. Do not add extra features.

### **Stage 3 — Server (minimal footprint)**

* Build **one** feature's server at a time with only the minimal changes needed. Never touch other features' code or prompts.  
* Order: pick a feature → AI reads the frontend, SQL, and this file → build → test → commit → next feature.  
* Daily routine: update `docs/plan.md` → create a branch → check `CLAUDE.md` → start working.

## **7\. Repository Setup Checklist**

* \[x\] `docs/plan.md` (this file)  
* \[x\] `CLAUDE.md` with the rules from section 5  
* \[x\] `.gitignore` (`node_modules`, `.env`, `.next`, etc.)  
* \[x\] Base project running (Next.js, login/signup, Supabase connection)  
* \[x\] `features/` directory created  
* \[x\] `sql/` directory created (used in Stage 2\)

