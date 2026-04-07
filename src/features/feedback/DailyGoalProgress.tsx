import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  DEFAULT_DAILY_WORKOUT_GOAL,
  formatDateKey,
  getTimestampDateKey,
} from "../../lib/workouts";
import { useAuth } from "../auth";
import { getUserWorkoutSessions } from "../workouts/api";
import LogWorkoutModal from "../workouts/LogWorkoutModal";

type ProgressData = {
  current: number;
  goal: number;
};

export default function DailyGoalProgress() {
  const { user } = useAuth();
  const [data, setData] = useState<ProgressData>({
    current: 0,
    goal: DEFAULT_DAILY_WORKOUT_GOAL,
  });
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  const fetchDailyGoal = useCallback(async () => {
    if (!user) return;

    try {
      const today = formatDateKey(new Date());
      const [sessions, goalResult] = await Promise.all([
        getUserWorkoutSessions(user.id),
        supabase
          .from("goals_feedback")
          .select("target_value")
          .eq("type", "daily")
          .eq("user_id", user.id)
          .eq("period_date", today)
          .maybeSingle(),
      ]);

      const workoutsToday = sessions.filter(
        (session) => getTimestampDateKey(session.created_at) === today
      ).length;

      if (goalResult.error) {
        console.warn("Failed to load saved daily goal target:", goalResult.error.message);
      }

      setData({
        current: workoutsToday,
        goal: goalResult.data?.target_value ?? DEFAULT_DAILY_WORKOUT_GOAL,
      });
      setErrorMessage("");
    } catch (error) {
      console.error("Unexpected error while loading daily progress:", error);
      setErrorMessage("Failed to load daily progress.");
      throw error;
    }
  }, [user]);

  useEffect(() => {
    fetchDailyGoal().catch(() => undefined);

    const handleRefresh = () => {
      fetchDailyGoal().catch(() => undefined);
    };

    window.addEventListener("progress-updated", handleRefresh);
    return () => window.removeEventListener("progress-updated", handleRefresh);
  }, [fetchDailyGoal]);

  async function handleWorkoutLogged() {
    if (!user) {
      setErrorMessage("You must be logged in to record workouts.");
      return;
    }

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    let refreshFailed = false;

    try {
      await fetchDailyGoal();
    } catch {
      refreshFailed = true;
    } finally {
      window.dispatchEvent(new Event("progress-updated"));
      setLoading(false);
    }

    if (refreshFailed) {
      setErrorMessage("Workout was saved, but refreshing daily progress failed.");
      return;
    }

    setMessage("Workout logged and progress updated.");
    setTimeout(() => setMessage(""), 2500);
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
        {loading ? "Updating…" : "+ Log Workout"}
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
          onWorkoutLogged={handleWorkoutLogged}
        />
      )}
    </div>
  );
}
