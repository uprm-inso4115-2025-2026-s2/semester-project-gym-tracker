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
    <div style={{ padding: "0.25rem 0" }}>
      <h2 style={{
        margin: "0 0 var(--space-1)",
        fontFamily: "var(--font-family-display)",
        fontSize: "var(--font-title-md)",
        fontWeight: 700,
        color: "var(--on-surface)",
      }}>
        Weekly Summary
      </h2>

      <p style={{ margin: "0 0 var(--space-1)", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.65)" }}>
        {data.workoutsCompleted} / {data.weeklyGoal} workouts this week
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
          background: "var(--primary)",
          height: "100%",
          borderRadius: "var(--radius-full)",
          transition: "width 0.3s ease",
        }} />
      </div>

      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <p style={{ margin: 0, fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.55)" }}>
          {percentage.toFixed(0)}% of goal
        </p>
        <p style={{ margin: 0, fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.55)" }}>
          {data.streak} day streak
        </p>
      </div>
    </div>
  );
}