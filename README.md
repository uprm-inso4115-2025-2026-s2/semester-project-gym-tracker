# Gym Tracker

A webapp for tracking gym sessions in a fun way. Built with React + TypeScript and Supabase.

## Tech Stack

- **Frontend**: React 19 + TypeScript (Vite)
- **Backend**: Supabase (Auth + PostgreSQL)

## Getting Started

```bash
cp .env.example .env
# Corran esto para crear su propio .env file. Aqui van los environment variables de Supabase.

npm install
npm run dev
```

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
