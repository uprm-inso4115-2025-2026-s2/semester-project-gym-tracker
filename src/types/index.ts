// ─── Workout Session ──────────────────────────────────────────────────────────

export type ActivityType = "gym" | "run" | "cardio" | "other";

export interface WorkoutSession {
  id: string;
  userId: string;
  date: string; // ISO 8601, e.g. "2026-02-24"
  activityType: ActivityType;
  durationMinutes: number;
  exercises?: string[];
  notes?: string;
  completed?: boolean;
}

// ─── Goal ─────────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  userId: string;
  targetDays: number; // positive integer — workouts per week
  weekStart: string; // ISO 8601 Monday of the target week
}

// ─── Goal Evaluation ──────────────────────────────────────────────────────────

export interface WeekBounds {
  start: string; // ISO 8601 Monday
  end: string; // ISO 8601 Sunday
}

export interface GoalResult {
  achieved: boolean;
  activeDays: number;
  targetDays: number;
  remaining: number;
}

export type ProgressStatus = "not_started" | "in_progress" | "completed";

export interface GoalProgress {
  dailyGoalMet: boolean;
  weeklyGoalMet: boolean;
  activeDaysThisWeek: number;
  targetDaysForWeek: number;
  remainingDaysForWeek: number;
  status: ProgressStatus;

}
// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
