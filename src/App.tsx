import { useEffect, useMemo, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LoginPage, SignupPage, AuthProvider, ProtectedRoute, useAuth, signOut } from "./features/auth";
import { getUserWorkoutSessions, type WorkoutSessionRecord } from "./features/workouts/api";
import WeeklyProgress from "./features/streaks/WeeklyProgress";
import { StreakDisplay, StreakMilestoneBadge } from "./features/streaks";
import type { ActivityType, WorkoutSession } from "./types";

function normalizeActivityType(value: string): ActivityType {
  if (value === "gym" || value === "run" || value === "cardio" || value === "other") {
    return value;
  }
  return "other";
}

function mapWorkoutRecordToSession(record: WorkoutSessionRecord): WorkoutSession {
  return {
    id: record.id,
    userId: record.user_id,
    date: record.created_at.slice(0, 10),
    activityType: normalizeActivityType(record.workout_type),
    durationMinutes: record.duration_minutes ?? 0,
    notes: record.notes ?? undefined,
  };
}

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

        <p style={{ fontSize: 13, color: "#cbd5e1", marginBottom: "0.5rem" }}>Empty state:</p>
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
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadSessions() {
      if (!user?.id) {
        if (isMounted) setSessions([]);
        return;
      }

      try {
        const records = await getUserWorkoutSessions(user.id);
        if (isMounted) {
          setSessions(records.map(mapWorkoutRecordToSession));
        }
      } catch {
        if (isMounted) setSessions([]);
      }
    }

    void loadSessions();

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const completedDays = useMemo(() => {
    const uniqueDays = new Set(sessions.map((s) => s.date));
    return Math.min(7, uniqueDays.size);
  }, [sessions]);
  
  return (
    <main style={{ padding: "2rem", textAlign: "center" }}>
      <h1>Gym Tracker</h1>
      <p style={{ marginBottom: "2rem" }}>Logged in as: {user?.email}</p>

      <div style={{ maxWidth: 350, margin: "0 auto 2rem" }}>
        <StreakDisplay sessions={sessions} />
      </div>

      <div style={{ maxWidth: 400, margin: "0 auto 2rem" }}>
        <WeeklyProgress completedDays={completedDays} />
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