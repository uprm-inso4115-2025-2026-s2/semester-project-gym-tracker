import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../auth";

type ProgressData = {
  current: number;
  goal: number;
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

export default function DailyGoalProgress() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({
    current: 0,
    goal: 1,
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
        console.error(error);
        setErrorMessage(error.message ?? "Failed to load daily goal.");
        return;
      }

      if (goal) {
        setData({
          current: goal.recorded_value ?? 0,
          goal: goal.target_value ?? 1,
        });
      } else {
        setData({
          current: 0,
          goal: 1,
        });
      }

      setErrorMessage("");
    } catch (err) {
      console.error(err);
      setErrorMessage("Unexpected error while loading daily goal.");
    }
  }, [user]);

  useEffect(() => {
    fetchDailyGoal();

    const handleRefresh = () => {
      fetchDailyGoal();
    };

    window.addEventListener("progress-updated", handleRefresh);

    return () => {
      window.removeEventListener("progress-updated", handleRefresh);
    };
  }, [fetchDailyGoal]);

  async function handleAddWorkout() {
    if (!user) {
      console.log("No user found");
      setErrorMessage("You must be logged in to record workouts.");
      return;
    }

    console.log("Button clicked");
    console.log("Current user:", user);
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

      console.log("Existing daily goal:", existingDaily);
      console.log("Daily fetch error:", dailyFetchError);

      if (dailyFetchError) {
        console.error("Daily fetch error:", dailyFetchError);
        setErrorMessage(dailyFetchError.message ?? "Failed to fetch daily goal.");
        return;
      }

      const dailyTarget = existingDaily?.target_value ?? 1;
      const newDailyValue = (existingDaily?.recorded_value ?? 0) + 1;
      const dailyStatus = newDailyValue >= dailyTarget ? "completed" : "pending";

      if (existingDaily) {
        const { error: updateDailyError } = await supabase
          .from("goals_feedback")
          .update({
            recorded_value: newDailyValue,
            status: dailyStatus,
          })
          .eq("id", existingDaily.id);

        console.log("Update daily error:", updateDailyError);

        if (updateDailyError) {
          console.error("Update daily error:", updateDailyError);
          setErrorMessage(updateDailyError.message ?? "Failed to update daily goal.");
          return;
        }
      } else {
        const { error: insertDailyError } = await supabase
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

        console.log("Insert daily error:", insertDailyError);

        if (insertDailyError) {
          console.error("Insert daily error:", insertDailyError);
          setErrorMessage(insertDailyError.message ?? "Failed to insert daily goal.");
          return;
        }
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

      console.log("Existing weekly goal:", existingWeekly);
      console.log("Weekly fetch error:", weeklyFetchError);

      if (weeklyFetchError) {
        console.error("Weekly fetch error:", weeklyFetchError);
        setErrorMessage(weeklyFetchError.message ?? "Failed to fetch weekly goal.");
        return;
      }

      const weeklyTarget = existingWeekly?.target_value ?? 5;
      const newWeeklyValue = (existingWeekly?.recorded_value ?? 0) + 1;
      const weeklyStatus = newWeeklyValue >= weeklyTarget ? "completed" : "pending";

      if (existingWeekly) {
        const { error: updateWeeklyError } = await supabase
          .from("goals_feedback")
          .update({
            recorded_value: newWeeklyValue,
            status: weeklyStatus,
          })
          .eq("id", existingWeekly.id);

        console.log("Update weekly error:", updateWeeklyError);

        if (updateWeeklyError) {
          console.error("Update weekly error:", updateWeeklyError);
          setErrorMessage(updateWeeklyError.message ?? "Failed to update weekly goal.");
          return;
        }
      } else {
        const { error: insertWeeklyError } = await supabase
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

        console.log("Insert weekly error:", insertWeeklyError);

        if (insertWeeklyError) {
          console.error("Insert weekly error:", insertWeeklyError);
          setErrorMessage(insertWeeklyError.message ?? "Failed to insert weekly goal.");
          return;
        }
      }

      setData({
        current: newDailyValue,
        goal: dailyTarget,
      });

      setMessage("Workout logged successfully!");
      setErrorMessage("");
      window.dispatchEvent(new Event("progress-updated"));

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error("Unexpected error:", err);
      setErrorMessage("Unexpected error while logging workout. Check the console for details.");
    } finally {
      setLoading(false);
    }
  }

  const percentage =
    data.goal > 0 ? Math.min((data.current / data.goal) * 100, 100) : 0;

  return (
    <div
      style={{
        padding: "1.5rem",
        borderRadius: "12px",
        background: "rgba(255, 255, 255, 0.95)",
        color: "#24364b",
        marginTop: "1rem",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <h2 style={{ marginBottom: "0.75rem" }}>Daily Goal Progress</h2>

      <p style={{ marginBottom: "0.75rem" }}>
        {data.current} / {data.goal} workouts completed today
      </p>

      <div
        style={{
          background: "#e5e7eb",
          height: "12px",
          borderRadius: "999px",
          overflow: "hidden",
          marginBottom: "0.75rem",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            background: "#22c55e",
            height: "100%",
            borderRadius: "999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p style={{ marginBottom: "0.75rem" }}>{percentage.toFixed(0)}% complete</p>

      <button
        onClick={handleAddWorkout}
        disabled={loading}
        style={{
          padding: "0.7rem 1.1rem",
          background: loading ? "#94a3b8" : "#1f45b5",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontWeight: "bold",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Logging..." : "+ Log Workout"}
      </button>

      {message && (
        <p style={{ marginTop: "0.75rem", color: "#166534", fontWeight: "bold" }}>
          {message}
        </p>
      )}

      {errorMessage && (
        <p style={{ marginTop: "0.75rem", color: "#b91c1c", fontWeight: "bold" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}