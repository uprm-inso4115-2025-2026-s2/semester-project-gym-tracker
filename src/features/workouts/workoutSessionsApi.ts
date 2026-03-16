import { supabase } from "../../lib/supabaseClient";

export async function getWorkoutSessions() {
  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, user_id, workout_type, duration_minutes, calories_burned, notes, created_at");

  if (error) {
    throw new Error(error.message);
  }

  return data;
}