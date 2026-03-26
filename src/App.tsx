import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage, ForgotPasswordPage, ResetPasswordPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import NotFoundPage from "./features/ui/NotFoundPage";
import type { WorkoutSession } from "./types";
import "./App.css";

function StreakPreviewPage() {
  const previewSessions: WorkoutSession[] = [];
  const pastSession: WorkoutSession[] = [
    { id: "1", userId: "demo", date: "2025-01-01", activityType: "gym", durationMinutes: 60 },
  ];
  const milestonePreview = [3, 7, 14, 30];
  const missingSupabaseEnv =
    !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;

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
          maxWidth: 350,
          padding: "30px 24px",
          textAlign: "center",
          color: "white",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            marginTop: 0,
            marginBottom: 18,
            fontWeight: "bold",
          }}
        >
          Streaks Preview
        </h1>
        <p
          style={{
            marginTop: 0,
            marginBottom: "1.25rem",
            color: "#e2e8f0",
            fontSize: 14,
          }}
        >
          Temporary public route for review while login is unavailable.
          {missingSupabaseEnv ? " Supabase is not configured yet." : ""}
        </p>

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "0 0 0.5rem" }}>Empty state:</p>
        <StreakDisplay sessions={previewSessions} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Broken state:</p>
        <StreakDisplay sessions={pastSession} isBroken longestStreak={7} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Milestone badges:</p>
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
  const sessions: WorkoutSession[] = [];

  return (
    <main className="home-main">
      <h1 className="home-title">Gym Tracker</h1>
      <p className="home-subtitle">Logged in as: {user?.email}</p>

      <div className="home-weekly">
        <StreakDisplay sessions={sessions} />
      </div>

      <button className="btn-logout" onClick={() => signOut()}>
        Logout
      </button>
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
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/streaks-preview" element={<StreakPreviewPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;