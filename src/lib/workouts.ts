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

// ─── Session Comparison ───────────────────────────────────────────────────────

export function compareSessions(session1: WorkoutSession, session2: WorkoutSession) {

  let result = "";

  // ─── Compare duration ───────────────────────────────
  const timeDiff = session1.durationMinutes - session2.durationMinutes;

  if (timeDiff > 0)
    result += `Session 1 has longer duration by ${timeDiff} minutes.\n`;
  else if (timeDiff < 0)
    result += `Session 2 has longer duration by ${-timeDiff} minutes.\n`;
  else
    result += "Durations are equal.\n";


  // ─── Get exercise ────────────────────────────────────────────────────────
  const exercises1 = session1.exercises ?? [];
  const exercises2 = session2.exercises ?? [];

  // Find common exercises by name
  const commonExercise = new Set(
    exercises1
      .map(e => e.name)
      .filter(name => exercises2.some(e2 => e2.name === name))
  );

  // If no common exercises, stop comparison
  if (commonExercise.size === 0) {
    result += "No common exercises to compare.\n";
    return result.trim();
  }

  // ─── Initialize totals ───────────────────────────────
  let totalReps1 = 0, totalReps2 = 0;
  let totalSets1 = 0, totalSets2 = 0;


  // ─── Compare each common exercise ────────────────────
  for (const name of commonExercise) {

    const ex1 = exercises1.find(e => e.name === name)!;
    const ex2 = exercises2.find(e => e.name === name)!;

    result += `\nExercise: ${name}\n`;

    // Accumulate totals
    totalReps1 += ex1.reps;
    totalReps2 += ex2.reps;
    totalSets1 += ex1.sets;
    totalSets2 += ex2.sets;

    // ─── Compare reps ─────────────────────
    const repsDiff = ex1.reps - ex2.reps;

    if (repsDiff > 0)
      result += `  Session 1 did ${repsDiff} more reps\n`;
    else if (repsDiff < 0)
      result += `  Session 2 did ${-repsDiff} more reps\n`;
    else
      result += `  Reps are equal\n`;

    // ─── Compare sets ─────────────────────
    const setsDiff = ex1.sets - ex2.sets;

    if (setsDiff > 0)
      result += `  Session 1 did ${setsDiff} more sets\n`;
    else if (setsDiff < 0)
      result += `  Session 2 did ${-setsDiff} more sets\n`;
    else
      result += `  Sets are equal\n`;

    // ─── Compare weight per set ─────────────────────
    const weights1 = ex1.weight ?? [];
    const weights2 = ex2.weight ?? [];

    const maxSets = Math.max(weights1.length, weights2.length);

    result += `  Weight per set:\n`;

    for (let i = 0; i < maxSets; i++) {
      const w1 = weights1[i] ?? 0;
      const w2 = weights2[i] ?? 0;
      const diff = w1 - w2;

      let diffText = "";

      if (diff > 0)
        diffText = `(+${diff} Session 1)`;
      else if (diff < 0)
        diffText = `(+${-diff} Session 2)`;
      else
        diffText = `(equal)`;

      result += `    Set ${i + 1}: ${w1} lbs vs ${w2} lbs ${diffText}\n`;
    }
  }

  // ─── Final totals comparison ─────────────────────────
  result += `\n--- Totals ---\n`;

  const totalSetsDiff = totalSets1 - totalSets2;
  const totalRepsDiff = totalReps1 - totalReps2;

  if (totalSetsDiff > 0)
    result += `Session 1 has ${totalSetsDiff} more sets than Session 2.\n`;
  else if (totalSetsDiff < 0)
    result += `Session 2 has ${-totalSetsDiff} more sets than Session 1.\n`;
  else
    result += "Total sets are equal.\n";

  if (totalRepsDiff > 0)
    result += `Session 1 has ${totalRepsDiff} more reps than Session 2.\n`;
  else if (totalRepsDiff < 0)
    result += `Session 2 has ${-totalRepsDiff} more reps than Session 1.\n`;
  else
    result += "Total reps are equal.\n";

  return result.trim();
}