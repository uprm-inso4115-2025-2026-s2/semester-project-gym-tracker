import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import { StreakDisplay } from "./features/streaks";
import type { WorkoutSession } from "./types";

function StreakPreviewPage() {
  const previewSessions: WorkoutSession[] = [];
  const pastSession: WorkoutSession[] = [
    { id: "1", userId: "demo", date: "2025-01-01", activityType: "gym", durationMinutes: 60 },
  ];
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

        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: "0.5rem" }}>Empty state:</p>
        <StreakDisplay sessions={previewSessions} />

        <p style={{ fontSize: 13, color: "#cbd5e1", margin: "1.5rem 0 0.5rem" }}>Broken state:</p>
        <StreakDisplay sessions={pastSession} isBroken longestStreak={7} />
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