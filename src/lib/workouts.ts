import type { WorkoutSession, ValidationResult, GoalResult, WeekBounds } from "../types";

// ─── Streak Computation ───────────────────────────────────────────────────────

export function computeStreak(sessions: WorkoutSession[]): number {
  if (sessions.length === 0) return 0;

  const uniqueDays = [
    ...new Set(sessions.map((s) => s.date)),
  ].sort((a, b) => (a < b ? 1 : -1));

  let streak = 1;
  for (let i = 0; i < uniqueDays.length - 1; i++) {
    const current = new Date(uniqueDays[i]);
    const previous = new Date(uniqueDays[i + 1]);
    const diffDays =
      (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Weekly Goal Evaluation ───────────────────────────────────────────────────

export function evaluateWeeklyGoal(
  sessions: WorkoutSession[],
  targetDays: number,
  week: WeekBounds
): GoalResult {
  const activeDays = new Set(
    sessions
      .filter((s) => s.date >= week.start && s.date <= week.end)
      .map((s) => s.date)
  ).size;

  return {
    achieved: activeDays >= targetDays,
    activeDays,
    targetDays,
    remaining: Math.max(0, targetDays - activeDays),
  };
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateWorkoutEntry(
  date: string,
  activityType: string | undefined,
  durationMinutes: number | undefined
): ValidationResult {
  const errors: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  if (!date || date > today) {
    errors.push("Workout date must not be in the future.");
  }

  if (!activityType) {
    errors.push("Activity type is required.");
  }

  if (!durationMinutes || durationMinutes <= 0) {
    errors.push("Duration must be a positive number.");
  }

  return { valid: errors.length === 0, errors };
}

export function validateGoalEntry(targetDays: number | undefined): ValidationResult {
  const errors: string[] = [];

  if (!targetDays || !Number.isInteger(targetDays) || targetDays <= 0) {
    errors.push("Goal must be a positive integer.");
  }

  return { valid: errors.length === 0, errors };
}
