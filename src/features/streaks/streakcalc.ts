/*
  Objective: Streak Tracking Domain Attributes & Validation

  Core Domain Entity: UserStreak
  - streak_current: number (>=0, default 0)
  - streak_longest: number (>=streak_current, default 0)
  - grace_period_active: boolean (default false)
  - grace_period_start_date: Date|null (set on first missed day, null when inactive)
  - last_workout_date: Date|null (timestamp of last qualifying workout)
  - user_timezone: string (IANA timezone, default UTC)

  Validation rules:
  - Valid workout criteria: exercises >= 1 OR duration_minutes >= 5
  - No future workout_date
  - Max backdating: 48 hours (per requirement)
  - Day boundary: local timezone midnight via Intl.DateTimeFormat

  Attribute behavior rules:
  - streak_current increments on consecutive day workout
  - grace period starts on first missed day, lasts 2 missed days
  - streak resets at third consecutive missed day
  - streak_longest updates when streak_current > streak_longest
  - grace_period_active true IFF grace_period_start_date != null
  - last_workout_date <= current date

  Supabase schema (for production DB integration):
  table user_streaks:
    id uuid PK
    user_id uuid FK users(id)
    streak_current integer not null default 0 check >= 0
    streak_longest integer not null default 0 check >= streak_current
    grace_period_active boolean not null default false
    grace_period_start_date timestamptz null
    last_workout_date timestamptz null
    user_timezone text not null default 'UTC'
    created_at timestamptz not null default now()
    updated_at timestamptz not null default now()

*/

import type { WorkoutSession } from "../../types";

// --- Core Domain Types -------------------------------------------------------
export interface UserStreak {
  id: string;
  user_id: string;
  streak_current: number;
  streak_longest: number;
  grace_period_active: boolean;
  grace_period_start_date: Date | null;
  last_workout_date: Date | null;
  user_timezone: string;
  created_at: Date;
  updated_at: Date;
}

export const GracePeriodStatus = {
  NONE: "none",
  DAY_1: "day_1",
  DAY_2: "day_2",
  EXPIRED: "expired",
} as const;

export type GracePeriodStatus = (typeof GracePeriodStatus)[keyof typeof GracePeriodStatus];

export interface ValidWorkoutCriteria {
  min_exercises: number;
  min_duration_minutes: number;
}

export interface StreakStatus {
  current_streak: number;
  longest_streak: number;
  grace_period_status: GracePeriodStatus;
  days_until_reset: number | null;
  last_workout_date: Date | null;
}

export type StreakUpdateResult = {
  success: boolean;
  new_streak_count: number;
  is_new_record: boolean;
  message: string;
};

export const ResetReason = {
  GRACE_EXPIRED: "grace_expired",
  MANUAL: "manual",
  ADMIN: "admin",
} as const;

export type ResetReason = (typeof ResetReason)[keyof typeof ResetReason];

export type ValidateWorkoutDay = (
  exercises: number,
  duration_minutes: number,
  criteria?: ValidWorkoutCriteria
) => boolean;

export type IsConsecutiveDay = (
  lastDate: Date,
  currentDate: Date,
  timezone: string
) => boolean;

export type CalculateDaysBetween = (
  date1: Date,
  date2: Date,
  timezone: string
) => number;

// --- Utility helpers ---------------------------------------------------------
const DEFAULT_CRITERIA: ValidWorkoutCriteria = { min_exercises: 1, min_duration_minutes: 5 };

export const isValidWorkoutDay: ValidateWorkoutDay = (
  exercises,
  duration_minutes,
  criteria = DEFAULT_CRITERIA
) => {
  return exercises >= criteria.min_exercises || duration_minutes >= criteria.min_duration_minutes;
};

function localDateForTimezone(date: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter
    .format(date)
    .split("-")
    .map((v) => Number(v));

  return new Date(Date.UTC(year, month - 1, day));
}

export function isConsecutiveDay(
  lastDate: Date | null,
  currentDate: Date | null,
  timezone = "UTC"
): boolean {
  if (!lastDate || !currentDate) return false;

  const lastDay = localDateForTimezone(lastDate, timezone);
  const currentDay = localDateForTimezone(currentDate, timezone);
  const diff = Math.round((currentDay.getTime() - lastDay.getTime()) / (24 * 60 * 60 * 1000));

  return diff === 1;
}


export function getGracePeriodStatus(
  grace_active: boolean,
  grace_start: Date | null,
  currentDate: Date = new Date()
): GracePeriodStatus {
  if (!grace_active || !grace_start) return GracePeriodStatus.NONE;

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysInGrace = Math.floor((currentDate.getTime() - grace_start.getTime()) / msPerDay);
  if (daysInGrace <= 0) return GracePeriodStatus.DAY_1;
  if (daysInGrace === 1) return GracePeriodStatus.DAY_2;
  return GracePeriodStatus.EXPIRED;
};

// --- Streak engine operations -------------------------------------------------

export function computeStreakStatus(streak: UserStreak): StreakStatus {
  const grace_status = getGracePeriodStatus(streak.grace_period_active, streak.grace_period_start_date);

  let daysUntilReset: number | null = null;
  if (grace_status === GracePeriodStatus.DAY_1) daysUntilReset = 2;
  if (grace_status === GracePeriodStatus.DAY_2) daysUntilReset = 1;
  if (grace_status === GracePeriodStatus.EXPIRED) daysUntilReset = 0;

  return {
    current_streak: streak.streak_current,
    longest_streak: streak.streak_longest,
    grace_period_status: grace_status,
    days_until_reset: daysUntilReset,
    last_workout_date: streak.last_workout_date,
  };
}

export function applyWorkoutToStreak(streak: UserStreak, workout: WorkoutSession): UserStreak {
  if (!isValidWorkoutDay(workout.exercises?.length ?? 0, workout.durationMinutes)) return streak;

  const workoutDate = new Date(workout.date);
  const isConsecutive = isConsecutiveDay(streak.last_workout_date, workoutDate, streak.user_timezone);
  const nextStreak = isConsecutive ? streak.streak_current + 1 : 1;

  return {
    ...streak,
    streak_current: nextStreak,
    streak_longest: Math.max(streak.streak_longest, nextStreak),
    grace_period_active: false,
    grace_period_start_date: null,
    last_workout_date: workoutDate,
    updated_at: new Date(),
  };
}

export function hasQualifyingWorkoutInSession(session: WorkoutSession): boolean {
  return isValidWorkoutDay(session.exercises?.length ?? 0, session.durationMinutes);
}
