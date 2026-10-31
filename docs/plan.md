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

### **`plan-editor`**

* Form to add a plan item: title, optional time, optional note.  
* List of the selected day's items with edit, delete, and reorder.  
* Defaults to today; receives the date when opened from `plan-calendar`.
* Time editing (owner request): change or clear an item's time directly in the list; items re-sort by time.

> Stage 1 note: until Supabase is wired in Stage 3, features share mock data through localStorage key
> `daily-plan:plan-items:YYYY-MM-DD` (named after the table, not a feature).

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

