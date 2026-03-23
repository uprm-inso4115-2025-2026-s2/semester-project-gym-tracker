import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, ProfilePage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import WorkoutHistoryPage from "./features/workouts/WorkoutHistoryPage";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import SettingsPage from "./features/streaks/SettingsPage";
import NotFoundPage from "./features/ui/NotFoundPage";
import DailyGoalProgress from "./features/feedback/DailyGoalProgress";
import WeeklyProgressSummary from "./features/feedback/WeeklyProgressSummary";
import { supabase } from "./lib/supabaseClient";
import type { WorkoutSession } from "./types";
import "./App.css";

type GoalFeedbackRow = {
  id: string;
  user_id: string;
  type: string;
  period_date: string;
  recorded_value: number;
};

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const diff = d.getDay() === 0 ? -6 : 1 - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function StreakPreviewPage() {
  const previewSessions: WorkoutSession[] = [];
  const pastSession: WorkoutSession[] = [
    { id: "1", userId: "demo", date: "2025-01-01", activityType: "gym", durationMinutes: 60 },
  ];
  const activeSessions: WorkoutSession[] = [
    { id: "1", userId: "demo", date: "2026-03-20", activityType: "gym", durationMinutes: 45 },
    { id: "2", userId: "demo", date: "2026-03-21", activityType: "gym", durationMinutes: 50 },
    { id: "3", userId: "demo", date: "2026-03-22", activityType: "gym", durationMinutes: 40 },
    { id: "4", userId: "demo", date: "2026-03-23", activityType: "gym", durationMinutes: 55 },
    { id: "5", userId: "demo", date: "2026-03-24", activityType: "gym", durationMinutes: 60 },
    { id: "6", userId: "demo", date: "2026-03-25", activityType: "gym", durationMinutes: 35 },
    { id: "7", userId: "demo", date: "2026-03-26", activityType: "gym", durationMinutes: 50 },
  ];
  const milestonePreview = [3, 7, 14, 30];

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(to bottom, #5f84e8, #0d2f8b)",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <section
        style={{
          width: "100%",
          maxWidth: 500,
          padding: "30px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 18, fontWeight: "bold" }}>
          Streaks Preview
        </h1>

        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: "0.5rem" }}>Active state:</p>
        <StreakDisplay sessions={activeSessions} isBroken={false} longestStreak={67} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Empty state:</p>
        <StreakDisplay sessions={previewSessions} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Broken state:</p>
        <StreakDisplay sessions={pastSession} isBroken={true} longestStreak={7} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>
          Milestone badges:
        </p>
        <div style={{ display: "grid", gap: "0.5rem" }}>
          {milestonePreview.map((value) => (
            <StreakMilestoneBadge key={value} milestoneDays={value} reached={value <= 7} />
          ))}
        </div>
      </section>
    </main>
  );
}

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    async function fetchSessions() {
      if (!user) return;
      const { data, error } = await supabase
        .from("goals_feedback")
        .select("id, user_id, type, period_date, recorded_value")
        .eq("user_id", user.id)
        .eq("type", "daily")
        .gt("recorded_value", 0)
        .order("period_date", { ascending: false });
      if (error) {
        console.error("Error fetching sessions:", error);
        setSessions([]);
      } else {
        setSessions(((data as GoalFeedbackRow[]) ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          date: row.period_date,
          activityType: "gym",
          durationMinutes: 60,
        })));
      }
    }
    fetchSessions();
    window.addEventListener("progress-updated", fetchSessions);
    return () => window.removeEventListener("progress-updated", fetchSessions);
  }, [user]);

  const weeklyCompletedDays = useMemo(() => {
    const startOfWeek = getStartOfWeek();
    return new Set(
      sessions
        .filter((s) => new Date(`${s.date}T00:00:00`) >= startOfWeek)
        .map((s) => s.date)
    ).size;
  }, [sessions]);

  return (
    <main className="home-main" style={{ position: "relative" }}>
      {/* Settings icon - top right */}
      <button
        onClick={() => navigate("/settings")}
        aria-label="Settings"
        style={{
          position: "absolute",
          top: "1.5rem",
          right: "1.5rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0.25rem",
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#374151"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      <h1 className="home-title">Gym Tracker</h1>
      <p className="home-subtitle">Logged in as: {user?.email}</p>

      <div className="home-weekly">
        <StreakDisplay sessions={sessions} />
      </div>

      <div style={{ width: "100%", maxWidth: "760px", margin: "0 auto 1.5rem" }}>
        <DailyGoalProgress />
        <WeeklyProgressSummary />
      </div>

      <div style={{ display: "flex", gap: "1rem", justifyContent: "center", marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/profile")}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
          }}
        >
          Profile
        </button>
        <button
          onClick={() => navigate("/history")}
          style={{
            padding: "0.5rem 1rem",
            cursor: "pointer",
            background: "#ffffff",
            color: "#111827",
            border: "1px solid #d1d5db",
            borderRadius: "4px",
          }}
        >
          Workout History
        </button>

        <button className="btn-logout" onClick={() => signOut()}>
          Logout
        </button>
      </div>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <WeeklyProgress completedDays={weeklyCompletedDays} />
      </div>
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <WorkoutHistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/streaks-preview" element={<StreakPreviewPage />} />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
