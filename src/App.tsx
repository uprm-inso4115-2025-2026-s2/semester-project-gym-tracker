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
import { getUserWorkoutSessions } from "./features/workouts/api";
import DailyGoalProgress from "./features/feedback/DailyGoalProgress";
import WeeklyProgressSummary from "./features/feedback/WeeklyProgressSummary";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import SettingsPage from "./features/streaks/SettingsPage";
import NotFoundPage from "./features/ui/NotFoundPage";
import BottomNav from "./features/ui/BottomNav";
import {
  computeLongestStreakFromWorkoutSessions,
  countWorkoutDaysInRange,
  formatDateKey,
  getTimestampDateKey,
} from "./lib/workouts";
import type { WorkoutSession } from "./types";
import "./App.css";

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

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}

function HomePage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loadingStreaks, setLoadingStreaks] = useState(true);

  useEffect(() => {
    async function fetchStreakSessions() {
      if (!user) {
        setSessions([]);
        setLongestStreak(0);
        setLoadingStreaks(false);
        return;
      }

      setLoadingStreaks(true);
      try {
        const data = await getUserWorkoutSessions(user.id);
        const mappedSessions = data.flatMap((row): WorkoutSession[] => {
            const sessionDate = getTimestampDateKey(row.created_at);
            if (!sessionDate) return [];

            return [{
              id: row.workout_id,
              userId: row.user_id,
              date: sessionDate,
              activityType: "gym",
              durationMinutes: row.duration_minutes ?? 0,
              ...(row.notes ? { notes: row.notes } : {}),
            }];
          });

        setSessions(mappedSessions);
        setLongestStreak(computeLongestStreakFromWorkoutSessions(mappedSessions));
      } catch (error) {
        console.error("Error fetching streak sessions:", error);
        setSessions([]);
        setLongestStreak(0);
      } finally {
        setLoadingStreaks(false);
      }
    }

    fetchStreakSessions().catch(() => undefined);
    window.addEventListener("progress-updated", fetchStreakSessions);
    return () => window.removeEventListener("progress-updated", fetchStreakSessions);
  }, [user]);

  const weeklyCompletedDays = useMemo(() => {
    const weekEnd = formatDateKey(new Date());
    const weekStart = formatDateKey(new Date(Date.now() - 6 * 86_400_000));
    return countWorkoutDaysInRange(sessions, weekStart, weekEnd);
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
