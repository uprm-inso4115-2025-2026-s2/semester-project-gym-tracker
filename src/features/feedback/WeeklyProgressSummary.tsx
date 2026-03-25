import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useAuth } from "../auth";

type WeeklySummaryData = {
  workoutsCompleted: number;
  weeklyGoal: number;
  streak: number;
  performanceMetric: string;
};

function formatDate(date: Date) {
  return date.toISOString().split("T")[0];
}

function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return formatDate(d);
}

function addDays(dateString: string, days: number) {
  const d = new Date(`${dateString}T00:00:00`);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

export default function WeeklyProgressSummary() {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklySummaryData>({
    workoutsCompleted: 0,
    weeklyGoal: 5,
    streak: 0,
    performanceMetric: "0% goal completion",
  });

  const fetchWeeklySummary = useCallback(async () => {
    if (!user) return;

    try {
      const weekStart = getWeekStart(new Date());

      const { data: weeklyGoal, error: weeklyError } = await supabase
        .from("goals_feedback")
        .select("recorded_value, target_value")
        .eq("type", "weekly")
        .eq("user_id", user.id)
        .eq("period_date", weekStart)
        .maybeSingle();

      if (weeklyError) {
        console.error(weeklyError);
        return;
      }

      const workoutsCompleted = weeklyGoal?.recorded_value ?? 0;
      const weeklyGoalTarget = weeklyGoal?.target_value ?? 5;
      const percentage =
        weeklyGoalTarget > 0
          ? Math.min((workoutsCompleted / weeklyGoalTarget) * 100, 100)
          : 0;

      const { data: dailyGoals, error: streakError } = await supabase
        .from("goals_feedback")
        .select("period_date, recorded_value, status")
        .eq("type", "daily")
        .eq("user_id", user.id)
        .order("period_date", { ascending: false });

      if (streakError) {
        console.error(streakError);
        return;
      }

      const completedDates = new Set(
        (dailyGoals ?? [])
          .filter((goal) => (goal.recorded_value ?? 0) > 0 || goal.status === "completed")
          .map((goal) => goal.period_date)
      );

      let streak = 0;
      let cursor = formatDate(new Date());

      while (completedDates.has(cursor)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      }

      setData({
        workoutsCompleted,
        weeklyGoal: weeklyGoalTarget,
        streak,
        performanceMetric: `${percentage.toFixed(0)}% goal completion`,
      });
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    fetchWeeklySummary();

    const handleRefresh = () => {
      fetchWeeklySummary();
    };

    window.addEventListener("progress-updated", handleRefresh);

    return () => {
      window.removeEventListener("progress-updated", handleRefresh);
    };
  }, [fetchWeeklySummary]);

  const percentage =
    data.weeklyGoal > 0
      ? Math.min((data.workoutsCompleted / data.weeklyGoal) * 100, 100)
      : 0;

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
      <h2 style={{ marginBottom: "0.75rem" }}>Weekly Progress Summary</h2>

      <p style={{ marginBottom: "0.5rem" }}>
        Workouts completed: {data.workoutsCompleted} / {data.weeklyGoal}
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
            background: "#3b82f6",
            height: "100%",
            borderRadius: "999px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      <p style={{ marginBottom: "0.4rem" }}>
        Weekly goal progress: {percentage.toFixed(0)}%
      </p>
      <p style={{ marginBottom: "0.4rem" }}>
        Streak continuation: {data.streak} day(s)
      </p>
      <p>Basic performance metric: {data.performanceMetric}</p>
    </div>
  );
}