import { supabase } from "../../lib/supabaseClient";
import { validateWorkoutEntry } from "../../lib/workouts";
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

// --- Utility helpers ---------------------------------------------------------
const DEFAULT_CRITERIA: ValidWorkoutCriteria = { min_exercises: 1, min_duration_minutes: 5 };

export const isValidWorkoutDay = (
  exercises: number,
  duration_minutes: number,
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

function daysBetweenUtcDates(date1: Date, date2: Date): number {
  const d1 = new Date(Date.UTC(date1.getUTCFullYear(), date1.getUTCMonth(), date1.getUTCDate()));
  const d2 = new Date(Date.UTC(date2.getUTCFullYear(), date2.getUTCMonth(), date2.getUTCDate()));
  return Math.round((d2.getTime() - d1.getTime()) / (24 * 60 * 60 * 1000));
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

export function applyMissedDayProgress(streak: UserStreak, currentDate: Date = new Date()): UserStreak {
  const graceStatus = getGracePeriodStatus(streak.grace_period_active, streak.grace_period_start_date, currentDate);

  if (!streak.grace_period_active) {
    if (!streak.last_workout_date) {
      return {
        ...streak,
        grace_period_active: true,
        grace_period_start_date: new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate())),
        updated_at: new Date(),
      };
    }

    const daysSinceLastWorkout = daysBetweenUtcDates(streak.last_workout_date, currentDate);
    if (daysSinceLastWorkout <= 1) {
      return {
        ...streak,
        updated_at: new Date(),
      };
    }

    if (daysSinceLastWorkout === 2) {
      const graceStart = new Date(Date.UTC(streak.last_workout_date.getUTCFullYear(), streak.last_workout_date.getUTCMonth(), streak.last_workout_date.getUTCDate() + 1));
      return {
        ...streak,
        grace_period_active: true,
        grace_period_start_date: graceStart,
        updated_at: new Date(),
      };
    }

    // If more than 2 days have passed without a workout, the grace period is expired and streak resets
    return {
      ...streak,
      streak_current: 0,
      grace_period_active: false,
      grace_period_start_date: null,
      last_workout_date: null,
      updated_at: new Date(),
    };
  }

  if (graceStatus === GracePeriodStatus.EXPIRED) {
    return {
      ...streak,
      streak_current: 0,
      grace_period_active: false,
      grace_period_start_date: null,
      last_workout_date: null,
      updated_at: new Date(),
    };
  }

  return {
    ...streak,
    updated_at: new Date(),
  };
}

const STREAK_TABLE = "user_streaks";

function formatIsoDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export async function getUserStreak(userId: string): Promise<UserStreak | null> {
  const { data, error } = await supabase
    .from(STREAK_TABLE)
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    throw error;
  }

  return (data as UserStreak) ?? null;
}

export async function upsertUserStreak(streak: UserStreak): Promise<UserStreak> {
  const { data, error } = await supabase
    .from(STREAK_TABLE)
    .upsert(streak, { onConflict: "id" })
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Failed to upsert user streak.");
  }

  return data as UserStreak;
}

export async function processWorkoutEvent(
  workout: WorkoutSession,
  userId: string,
  currentDate: Date = new Date()
): Promise<StreakUpdateResult> {
  const validation = validateWorkoutEntry(workout.date, workout.activityType, workout.durationMinutes);
  if (!validation.valid) {
    return {
      success: false,
      new_streak_count: 0,
      is_new_record: false,
      message: validation.errors.join(" "),
    };
  }

  if (!isValidWorkoutDay(workout.exercises?.length ?? 0, workout.durationMinutes)) {
    return {
      success: false,
      new_streak_count: 0,
      is_new_record: false,
      message: "Workout does not qualify.",
    };
  }

  const previous = (await getUserStreak(userId)) || {
    id: `${userId}-streak`,
    user_id: userId,
    streak_current: 0,
    streak_longest: 0,
    grace_period_active: false,
    grace_period_start_date: null,
    last_workout_date: null,
    user_timezone: "UTC",
    created_at: currentDate,
    updated_at: currentDate,
  };

  const updated = applyWorkoutToStreak(previous, workout);
  const saved = await upsertUserStreak(updated);

  return {
    success: true,
    new_streak_count: saved.streak_current,
    is_new_record: saved.streak_current > previous.streak_longest,
    message: "Streak updated from workout event.",
  };
}

export async function checkGracePeriodForUser(userId: string, currentDate: Date = new Date()): Promise<UserStreak | null> {
  const streak = await getUserStreak(userId);
  if (!streak) return null;

  const graceStatus = getGracePeriodStatus(streak.grace_period_active, streak.grace_period_start_date, currentDate);

  if (graceStatus === GracePeriodStatus.EXPIRED) {
    const reset = {
      ...streak,
      streak_current: 0,
      grace_period_active: false,
      grace_period_start_date: null,
      last_workout_date: null,
      updated_at: currentDate,
    };

    return await upsertUserStreak(reset);
  }

  return streak;
}

export async function dailyStreakMaintenance(currentDate: Date = new Date()): Promise<number> {
  const dateString = formatIsoDate(currentDate);
  const { data, error } = await supabase
    .from(STREAK_TABLE)
    .select("user_id")
    .or(`grace_period_active.eq.true,last_workout_date.lt.${dateString}`);

  if (error) {
    throw error;
  }

  const users = data ?? [];
  let updatedCount = 0;

  for (const row of users) {
    const result = await checkGracePeriodForUser(row.user_id, currentDate);
    if (result) updatedCount++;
  }

  return updatedCount;
}

export async function safeUpdateStreakState(userId: string, updater: (streak: UserStreak) => UserStreak): Promise<UserStreak | null> {
  const existing = await getUserStreak(userId);
  if (!existing) return null;

  const backup = { ...existing };
  const updated = updater(existing);

  try {
    return await upsertUserStreak(updated);
  } catch (err) {
    await upsertUserStreak(backup);
    throw err;
  }
}

export async function invokeUpdateOnWorkout(workout: WorkoutSession, userId: string) {
  const { data, error } = await supabase.rpc("update_on_workout", {
    p_user_id: userId,
    p_workout: workout,
  });

  if (error) throw error;

  return (data as StreakUpdateResult) ?? {
    success: false,
    new_streak_count: 0,
    is_new_record: false,
    message: "RPC did not return result",
  };
}

export async function invokeCheckGracePeriod(userId: string, currentDate: Date = new Date()) {
  const { data, error } = await supabase.rpc("check_grace_period", {
    p_user_id: userId,
    p_current_date: currentDate.toISOString(),
  });

  if (error) throw error;

  return (data as UserStreak) ?? null;
}

export function computeStreakFromSessions(sessions: WorkoutSession[], today = new Date()): number {
  const qualifyingSessions = sessions
    .filter((session) => (session.completed ?? true) && isValidWorkoutDay(session.exercises?.length ?? 0, session.durationMinutes));

  if (!qualifyingSessions.length) return 0;

  const uniqueDates = Array.from(new Set(qualifyingSessions.map((s) => s.date))).sort();

  // The streak is only active if the most recent workout was today or yesterday.
  // If more time has passed the streak is broken, even if the history shows consecutive days.
  const todayDate = localDateForTimezone(today, "UTC");
  const mostRecentDate = new Date(`${uniqueDates[uniqueDates.length - 1]}T00:00:00Z`);
  const daysSinceLast = daysBetweenUtcDates(mostRecentDate, todayDate);
  if (daysSinceLast > 1) return 0;

  // A streak requires at least 2 consecutive days — a single attendance day
  // is not a streak per the domain definition ("consecutive" implies ≥2).
  if (uniqueDates.length < 2) return 0;

  let streak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i--) {
    const curr = new Date(`${uniqueDates[i]}T00:00:00Z`);
    const prev = new Date(`${uniqueDates[i - 1]}T00:00:00Z`);

    if (isConsecutiveDay(prev, curr)) {
      streak++;
    } else {
      break;
    }
  }

  // Only a streak if we found consecutive days (streak > 1 means at least 2 were consecutive).
  return streak > 1 ? streak : 0;
}

export function updateStreakWithWorkout(
  streak: UserStreak,
  workout: WorkoutSession,
  currentDate: Date = new Date()
) {
  if (!isValidWorkoutDay(workout.exercises?.length ?? 0, workout.durationMinutes)) {
    const updated = { ...streak, updated_at: currentDate };
    return { updated, previous: streak, is_new_record: false };
  }

  const workoutDate = new Date(workout.date);
  const isConsecutive = isConsecutiveDay(streak.last_workout_date, workoutDate, streak.user_timezone);
  const nextStreak = isConsecutive ? streak.streak_current + 1 : 1;
  const updated = {
    ...streak,
    streak_current: nextStreak,
    streak_longest: Math.max(streak.streak_longest, nextStreak),
    grace_period_active: false,
    grace_period_start_date: null,
    last_workout_date: workoutDate,
    updated_at: currentDate,
  };

  return { updated, previous: streak, is_new_record: nextStreak > streak.streak_longest };
}
