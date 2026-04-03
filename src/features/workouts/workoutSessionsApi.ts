import { supabase } from "../../lib/supabaseClient";

export async function getWorkoutSessions() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not logged in");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("workout_id, user_id, workout_type, duration_minutes, calories_burned, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createWorkoutSession(session: {
  workout_type: string;
  duration_minutes: number;
  calories_burned?: number;
  notes?: string;
}) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error("User not logged in");
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert([
      {
        user_id: user.id,
        workout_type: session.workout_type,
        duration_minutes: session.duration_minutes,
        calories_burned: session.calories_burned ?? null,
        notes: session.notes ?? null,
      },
    ])
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}