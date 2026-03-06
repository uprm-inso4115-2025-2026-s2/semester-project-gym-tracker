# Gym Tracker

A web application for tracking gym sessions, runs, and fitness habits. Built with React + TypeScript and Supabase.

## Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **Backend**: Supabase (Auth + PostgreSQL)

## Getting Started

```bash
cp .env.example .env
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project

npm install
npm run dev
```

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build locally |

## Project Structure

```
src/
  features/
    auth/        # User registration, login, session management
    workouts/    # Session logging, editing, history
    streaks/     # Consecutive attendance, habit consistency
    goals/       # Weekly goal setting, summaries, reminders
  lib/
    supabaseClient.ts  # Supabase client singleton
    workouts.ts        # Domain logic (streak, goal evaluation, validation)
  types/
    index.ts     # Shared TypeScript types
```
