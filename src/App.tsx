import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
const logo = "/Colored-Logo.svg";
import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProfilePage,
  AuthProvider,
  ProtectedRoute,
  useAuth,
} from "./features/auth";
import WorkoutHistoryPage from "./features/workouts/WorkoutHistoryPage";
import DailyGoalProgress from "./features/feedback/DailyGoalProgress";
import WeeklyProgressSummary from "./features/feedback/WeeklyProgressSummary";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import SettingsPage from "./features/streaks/SettingsPage";
import NotFoundPage from "./features/ui/NotFoundPage";
import BottomNav from "./features/ui/BottomNav";
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

function getStartOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

function computeLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const sorted = [...new Set(dates)].sort();
  let longest = 1, current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(`${sorted[i - 1]}T00:00:00`);
    const curr = new Date(`${sorted[i]}T00:00:00`);
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    current = diff === 1 ? current + 1 : 1;
    if (current > longest) longest = current;
  }
  return longest;
}

function HomePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loadingStreaks, setLoadingStreaks] = useState(true);

  useEffect(() => {
    async function fetchStreakSessions() {
      if (!user) return;

      setLoadingStreaks(true);

      const { data, error } = await supabase
        .from("goals_feedback")
        .select("id, user_id, type, period_date, recorded_value")
        .eq("user_id", user.id)
        .eq("type", "daily")
        .gt("recorded_value", 0)
        .order("period_date", { ascending: false });

      if (error) {
        console.error("Error fetching streak sessions:", error);
        setSessions([]);
        setLoadingStreaks(false);
        return;
      }

      const rows = (data as GoalFeedbackRow[]) ?? [];
      const mappedSessions: WorkoutSession[] = rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.period_date,
        activityType: "gym",
        durationMinutes: 60,
      }));

      setSessions(mappedSessions);
      setLongestStreak(computeLongestStreak(rows.map((r) => r.period_date)));
      setLoadingStreaks(false);
    }

    fetchStreakSessions();
    window.addEventListener("progress-updated", fetchStreakSessions);
    return () => window.removeEventListener("progress-updated", fetchStreakSessions);
  }, [user]);

  const weeklyCompletedDays = useMemo(() => {
    const startOfWeek = getStartOfWeek();
    const uniqueDays = new Set(
      sessions
        .filter((session) => {
          const sessionDate = new Date(`${session.date}T00:00:00`);
          return sessionDate >= startOfWeek;
        })
        .map((session) => session.date)
    );

    return uniqueDays.size;
  }, [sessions]);

  return (
    <main className="home-main">
      {/* Compact header */}
      <header className="home-header">
        <img src={logo} alt="Gym Tracker" className="home-logo" />
        <div className="home-greeting">
          <h1 className="home-title">Gym Tracker</h1>
          <p className="home-subtitle">{user?.email}</p>
        </div>
      </header>

      {/* Dashboard grid */}
      <div className="home-dashboard">
        <div className="dash-card dash-streaks">
          {loadingStreaks
            ? <p style={{ margin: 0, textAlign: "center", color: "var(--outline-variant)", padding: "var(--space-2)" }}>Loading streaks…</p>
            : <StreakDisplay sessions={sessions} longestStreak={longestStreak} />}
        </div>

        <div className="dash-card dash-weekly">
          <WeeklyProgress completedDays={weeklyCompletedDays} />
        </div>

        <div className="dash-card dash-daily">
          <DailyGoalProgress />
        </div>

        <div className="dash-card dash-summary">
          <WeeklyProgressSummary />
        </div>
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
                <AppLayout><HomePage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout><WorkoutHistoryPage /></AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <AppLayout><ProfilePage /></AppLayout>
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
                <AppLayout><SettingsPage /></AppLayout>
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