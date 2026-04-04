import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../auth";
import LogWorkoutModal from "../workouts/LogWorkoutModal";

type ProgressData = {
  current: number;
  goal: number;
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function DailyGoalProgress() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({ current: 0, goal: 1 });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchDailyGoal = useCallback(async () => {
    if (!user) return;

    try {
      const today = formatDate(new Date());

      const { data: goal, error } = await supabase
        .from("goals_feedback")
        .select("id, recorded_value, target_value, status, period_date")
        .eq("type", "daily")
        .eq("user_id", user.id)
        .eq("period_date", today)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message ?? "Failed to load daily goal.");
        return;
      }

      setData(goal
        ? { current: goal.recorded_value ?? 0, goal: goal.target_value ?? 1 }
        : { current: 0, goal: 1 }
      );
      setErrorMessage("");
    } catch {
      setErrorMessage("Unexpected error while loading daily goal.");
    }
  }, [user]);

  useEffect(() => {
    fetchDailyGoal();
    window.addEventListener("progress-updated", fetchDailyGoal);
    return () => window.removeEventListener("progress-updated", fetchDailyGoal);
  }, [fetchDailyGoal]);

  async function handleAddWorkout() {
    if (!user) {
      setErrorMessage("You must be logged in to record workouts.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    try {
      const today = formatDate(new Date());

      const { data: existingDaily, error: dailyFetchError } = await supabase
        .from("goals_feedback")
        .select("id, recorded_value, target_value")
        .eq("type", "daily")
        .eq("user_id", user.id)
        .eq("period_date", today)
        .maybeSingle();

      if (dailyFetchError) {
        setErrorMessage(dailyFetchError.message ?? "Failed to fetch daily goal.");
        return;
      }

      const dailyTarget = existingDaily?.target_value ?? 1;
      const newDailyValue = (existingDaily?.recorded_value ?? 0) + 1;
      const dailyStatus = newDailyValue >= dailyTarget ? "completed" : "pending";

      if (existingDaily) {
        const { error } = await supabase
          .from("goals_feedback")
          .update({ recorded_value: newDailyValue, status: dailyStatus })
          .eq("id", existingDaily.id);
        if (error) { setErrorMessage(error.message ?? "Failed to update daily goal."); return; }
      } else {
        const { error } = await supabase
          .from("goals_feedback")
          .insert({
            user_id: user.id,
            type: "daily",
            title: "Daily Workout Goal",
            description: "Track daily workout completions",
            target_value: 1,
            recorded_value: 1,
            status: "completed",
            period_date: today,
          });
        if (error) { setErrorMessage(error.message ?? "Failed to insert daily goal."); return; }
      }

      const weekDate = new Date();
      const day = weekDate.getDay();
      const diff = day === 0 ? -6 : 1 - day;
      weekDate.setDate(weekDate.getDate() + diff);
      weekDate.setHours(0, 0, 0, 0);
      const weekStart = formatDate(weekDate);

      const { data: existingWeekly, error: weeklyFetchError } = await supabase
        .from("goals_feedback")
        .select("id, recorded_value, target_value")
        .eq("type", "weekly")
        .eq("user_id", user.id)
        .eq("period_date", weekStart)
        .maybeSingle();

      if (weeklyFetchError) {
        setErrorMessage(weeklyFetchError.message ?? "Failed to fetch weekly goal.");
        return;
      }

      const weeklyTarget = existingWeekly?.target_value ?? 5;
      const newWeeklyValue = (existingWeekly?.recorded_value ?? 0) + 1;
      const weeklyStatus = newWeeklyValue >= weeklyTarget ? "completed" : "pending";

      if (existingWeekly) {
        const { error } = await supabase
          .from("goals_feedback")
          .update({ recorded_value: newWeeklyValue, status: weeklyStatus })
          .eq("id", existingWeekly.id);
        if (error) { setErrorMessage(error.message ?? "Failed to update weekly goal."); return; }
      } else {
        const { error } = await supabase
          .from("goals_feedback")
          .insert({
            user_id: user.id,
            type: "weekly",
            title: "Weekly Workout Goal",
            description: "Track weekly workout completions",
            target_value: 5,
            recorded_value: 1,
            status: "pending",
            period_date: weekStart,
          });
        if (error) { setErrorMessage(error.message ?? "Failed to insert weekly goal."); return; }
      }

      setData({ current: newDailyValue, goal: dailyTarget });
      setMessage("Workout logged!");
      setErrorMessage("");
      window.dispatchEvent(new Event("progress-updated"));
      setTimeout(() => setMessage(""), 2500);
    } catch {
      setErrorMessage("Unexpected error while logging workout.");
    } finally {
      setLoading(false);
    }
  }

  const percentage = data.goal > 0 ? Math.min((data.current / data.goal) * 100, 100) : 0;

  return (
    <div style={{ padding: "0.25rem 0" }}>
      <h2 style={{
        margin: "0 0 var(--space-1)",
        fontFamily: "var(--font-family-display)",
        fontSize: "var(--font-title-md)",
        fontWeight: 700,
        color: "var(--on-surface)",
      }}>
        Daily Goal
      </h2>

      <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.65)" }}>
        {data.current} / {data.goal} workouts today
      </p>

      <div style={{
        background: "var(--surface-container-high)",
        height: "10px",
        borderRadius: "var(--radius-full)",
        overflow: "hidden",
        marginBottom: "var(--space-1)",
      }}>
        <div style={{
          width: `${percentage}%`,
          background: "var(--secondary)",
          height: "100%",
          borderRadius: "var(--radius-full)",
          transition: "width 0.3s ease",
        }} />
      </div>

      <p style={{ margin: "0 0 var(--space-2)", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.55)" }}>
        {percentage.toFixed(0)}% complete
      </p>

      <button
        onClick={() => setShowLogModal(true)}
        disabled={loading}
        style={{
          padding: "0.65rem 1.25rem",
          background: loading ? "var(--outline-variant)" : "var(--power-gradient)",
          color: "#ffffff",
          border: "none",
          borderRadius: "var(--radius-full)",
          fontFamily: "var(--font-family-body)",
          fontWeight: 700,
          fontSize: "var(--font-body-md)",
          cursor: loading ? "not-allowed" : "pointer",
          transition: "opacity 0.2s",
        }}
      >
        {loading ? "Logging…" : "+ Log Workout"}
      </button>

      {message && (
        <p style={{ marginTop: "var(--space-1)", color: "var(--secondary)", fontWeight: 700, fontSize: "var(--font-body-md)" }}>
          {message}
        </p>
      )}

      {errorMessage && (
        <p style={{ marginTop: "var(--space-1)", color: "var(--error)", fontWeight: 700, fontSize: "var(--font-body-md)" }}>
          {errorMessage}
        </p>
      )}

      {showLogModal && (
        <LogWorkoutModal
          onClose={() => setShowLogModal(false)}
          onWorkoutLogged={handleAddWorkout}
        />
      )}
    </div>
  );
}
