import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import type { WorkoutSession } from "./types";

function StreakPreviewPage() {
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
    <main style={{
      minHeight: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(to bottom, #5f84e8, #0d2f8b)",
      fontFamily: "Arial, sans-serif",
    }}>
      <section style={{
        width: "100%",
        maxWidth: 500,
        padding: "30px 24px",
        textAlign: "center",
        color: "white",
      }}>
        <h1 style={{ fontSize: 28, marginTop: 0, marginBottom: 18, fontWeight: "bold" }}>
          Streaks Preview
        </h1>

        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: "0.5rem" }}>Active state:</p>
        <StreakDisplay sessions={activeSessions} isBroken={false} longestStreak={67} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Broken state:</p>
        <StreakDisplay sessions={activeSessions} isBroken={true} longestStreak={67} />

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
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Gym Tracker</h1>
      <p style={{ marginBottom: "2rem" }}>Logged in as: {user?.email}</p>

      <div style={{ maxWidth: 350, margin: "0 auto 2rem" }}>
        <StreakDisplay sessions={sessions} />
      </div>
      
      <button 
        onClick={() => signOut()}
        style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "#ef4444", color: "white", border: "none", borderRadius: "4px" }}
      >
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
          <Route path="/streaks-preview" element={<StreakPreviewPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;