import { supabase } from "../../lib/supabaseClient";

export type WorkoutSessionRecord = {
  workout_id: string;
  user_id: string;
  workout_type: string;
  duration_minutes: number | null;
  calories_burned: number | null;
  notes: string | null;
  created_at: string | null;
};

export type WorkoutExerciseRecord = {
  record_id: string;
  workout_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  exercises: { name: string } | null;
};

/**
 * Fetches the basic workout history for a user.
 * Used to display the list of workout sessions including:
 * workout_type, duration_minutes, calories_burned, notes, and created_at.
 */
export async function getUserWorkoutSessions(
  userId: string
): Promise<WorkoutSessionRecord[]> {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(
      "workout_id, user_id, workout_type, duration_minutes, calories_burned, notes, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching workout sessions:", error.message);
    throw error;
  }

  return data ?? [];
}

/**
 * Fetches workout exercise details for a specific session.
 * Used by the dropdown / "more info" feature to show exercises
 * performed in a selected workout session.
 */
export async function getWorkoutExercisesBySessionId(
  workoutId: string
): Promise<WorkoutExerciseRecord[]> {
  const { data, error } = await supabase
    .from("workout_exercises")
    .select("record_id, workout_id, exercise_id, sets, reps, weight, exercises(name)")
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error fetching workout exercises:", error.message);
    throw error;
  }

  return data ?? [];
}

export async function deleteWorkoutSession(workoutId: string): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .delete()
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error deleting workout session:", error.message);
    throw error;
  }
}

export async function updateWorkoutSession(
  workoutId: string,
  updates: Partial<Pick<WorkoutSessionRecord, "workout_type" | "duration_minutes" | "calories_burned" | "notes">>
): Promise<void> {
  const { error } = await supabase
    .from("workout_sessions")
    .update(updates)
    .eq("workout_id", workoutId);

  if (error) {
    console.error("Error updating workout session:", error.message);
    throw error;
  }
}