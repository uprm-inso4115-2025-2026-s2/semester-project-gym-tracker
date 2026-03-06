# Gym Tracker

A webapp for tracking gym sessions in a fun way. Built with React + TypeScript and Supabase.

## Tech Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **Backend**: Supabase (Auth + PostgreSQL)

## Getting Started

You need **Node.js** installed, which includes `npm`. Download it from [nodejs.org](https://nodejs.org) — install the LTS version.

```bash
cp .env.example .env
# Fill in the Supabase URL and anon key (get them from the manager)

npm install
npm run dev
```

The app will be running at `http://localhost:5173`.

## Common Mistakes

- **Forgot to create `.env`** — the app will fail silently or throw errors on login. Always run `cp .env.example .env` first.
- **Skipped `npm install`** — if you see "Cannot find module" errors, run `npm install`.
- **Wrong Node version** — if `npm install` throws unexpected errors, make sure you're on Node LTS (`node --version` should be v18 or higher).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Type-check and build for production |

## Project Structure

```
src/
  features/
    auth/        # User registration, login, session management
    workouts/    # Session logging, editing, history
    streaks/     # Consecutive attendance, habit consistency
    notifications/ # Goal setting, summaries, reminders, motivational feedback
  lib/
    supabaseClient.ts  # Supabase client singleton
    workouts.ts        # Domain logic (streak, goal evaluation, validation)
  types/
    index.ts     # Shared TypeScript types
```
