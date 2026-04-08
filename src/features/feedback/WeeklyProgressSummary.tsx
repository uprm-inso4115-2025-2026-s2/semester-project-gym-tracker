import React from "react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import {
  DEFAULT_WEEKLY_WORKOUT_GOAL,
  countWorkoutDaysInRange,
  getEndOfWeekDateKey,
  getStartOfWeekDateKey,
  getTimestampDateKey,
} from "../../lib/workouts";
import type { WorkoutSession } from "../../types";
import { useAuth } from "../auth";
import { getUserWorkoutSessions } from "../workouts/api";
import { computeStreakFromSessions } from "../streaks/streakcalc";

type WeeklySummaryData = {
  workoutDaysCompleted: number;
  weeklyGoal: number;
  streak: number;
};

export default function WeeklyProgressSummary() {
  const { user } = useAuth();
  const [data, setData] = useState<WeeklySummaryData>({
    workoutDaysCompleted: 0,
    weeklyGoal: DEFAULT_WEEKLY_WORKOUT_GOAL,
    streak: 0,
  });

  const fetchWeeklySummary = useCallback(async () => {
    if (!user) return;

    try {
      const weekStart = getStartOfWeekDateKey(new Date());
      const weekEnd = getEndOfWeekDateKey(new Date());
      const [sessions, weeklyGoalResult] = await Promise.all([
        getUserWorkoutSessions(user.id),
        supabase
          .from("goals_feedback")
          .select("target_value")
          .eq("type", "weekly")
          .eq("user_id", user.id)
          .eq("period_date", weekStart)
          .maybeSingle(),
      ]);

      if (weeklyGoalResult.error) {
        console.warn("Failed to load saved weekly goal target:", weeklyGoalResult.error.message);
      }

      const workoutSessions = sessions.flatMap((session): WorkoutSession[] => {
          const sessionDate = getTimestampDateKey(session.created_at);
          if (!sessionDate) return [];

          return [{
            id: session.workout_id,
            userId: session.user_id,
            date: sessionDate,
            activityType: "gym",
            durationMinutes: session.duration_minutes ?? 0,
            ...(session.notes ? { notes: session.notes } : {}),
          }];
        });

      const workoutDaysCompleted = countWorkoutDaysInRange(
        workoutSessions,
        weekStart,
        weekEnd
      );
      const weeklyGoalTarget =
        weeklyGoalResult.data?.target_value ?? DEFAULT_WEEKLY_WORKOUT_GOAL;
      const streak = computeStreakFromSessions(workoutSessions);

      setData({
        workoutDaysCompleted,
        weeklyGoal: weeklyGoalTarget,
        streak,
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
      ? Math.min((data.workoutDaysCompleted / data.weeklyGoal) * 100, 100)
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
        {data.workoutDaysCompleted} / {data.weeklyGoal} workout days this week
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
