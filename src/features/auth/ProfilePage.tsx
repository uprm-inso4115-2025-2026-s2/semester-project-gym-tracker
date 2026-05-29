import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { FaDumbbell, FaFire, FaPencilAlt } from "react-icons/fa";
import "./ProfilePage.css";
import { useAuth } from "../auth/AuthContext";
import { signOut } from "../auth/api";
import { supabase } from "../../lib/supabaseClient";
import { computeStreakFromSessions } from "../streaks/streakcalc";
import type { WorkoutSession } from "../../types";
const logo = "/Colored-Logo.svg";

interface StatCardProps {
  value: string;
  label: string;
  icon: ReactNode;
  color: string;
}

function StatCard({ value, label, icon, color }: StatCardProps) {
  return (
    <article className="stat-card">
      <div className="stat-icon" style={{
        background: color,
        width: "44px",
        height: "44px",
        borderRadius: "var(--radius-md)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "1.2rem",
        margin: "0 auto var(--space-1)",
      }}>
        {icon}
      </div>
      <h3 className="stat-value">{value}</h3>
      <p className="stat-label">{label}</p>
    </article>
  );
}

function formatWorkoutDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type RecentSession = {
  workout_id: string;
  workout_type: string;
  duration_minutes: number | null;
  created_at: string | null;
};

export default function ProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(user?.user_metadata?.full_name ?? "");
  const [goal, setGoal] = useState(user?.user_metadata?.fitness_goal ?? "");
  const [savingProfile, setSavingProfile] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string>(
    user?.user_metadata?.avatar_url ?? ""
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [workoutCount, setWorkoutCount] = useState<number | null>(null);
  const [currentStreak, setCurrentStreak] = useState<number | null>(null);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadStats() {
      setLoadingStats(true);

      // Workout count
      const { count } = await supabase
        .from("workout_sessions")
        .select("workout_id", { count: "exact", head: true })
        .eq("user_id", user!.id);
      setWorkoutCount(count ?? 0);

      // Recent sessions
      const { data: sessions } = await supabase
        .from("workout_sessions")
        .select("workout_id, workout_type, duration_minutes, created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(3);
      setRecentSessions((sessions as RecentSession[]) ?? []);

      // Current streak from goals_feedback daily records — same logic as HomePage
      const { data: dailyGoals } = await supabase
        .from("goals_feedback")
        .select("id, user_id, period_date, recorded_value")
        .eq("type", "daily")
        .eq("user_id", user!.id)
        .gt("recorded_value", 0)
        .order("period_date", { ascending: false });

      const streakSessions: WorkoutSession[] = (dailyGoals ?? []).map((row) => ({
        id: row.id,
        userId: row.user_id,
        date: row.period_date,
        activityType: "gym",
        durationMinutes: 60,
      }));
      setCurrentStreak(computeStreakFromSessions(streakSessions));

      setLoadingStats(false);
    }

    loadStats();
  }, [user]);

  async function handleSave() {
    if (!user) return;
    setSavingProfile(true);
    await supabase.auth.updateUser({
      data: {
        full_name: username,
        fitness_goal: goal,
      },
    });
    setSavingProfile(false);
    setEditing(false);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${data.publicUrl}?t=${Date.now()}`;
      setAvatarUrl(url);
      await supabase.auth.updateUser({ data: { avatar_url: url } });
    }
    setUploadingAvatar(false);
  }

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
    : "—";

const statsData = [
  {
    value: loadingStats ? "…" : String(workoutCount ?? 0),
    label: "Workouts",
    icon: <FaDumbbell color="#ffffff" />,
    color: "linear-gradient(135deg, #004bca, #0061ff)",
  },
  {
    value: loadingStats ? "…" : `${currentStreak ?? 0}d`,
    label: "Streak",
    icon: <FaFire color="#ffffff" />,
    color: "linear-gradient(135deg, #f59e0b, #ef4444)",
  },
];

  return (
    <main className="profile-page">
      <div className="profile-inner">
        <nav className="profile-topbar">
          <img src={logo} alt="Gym Tracker" className="profile-topbar-logo" />
          <button className="profile-logout-btn" onClick={() => signOut()}>
            Logout
          </button>
        </nav>

        <section className="profile-card">
          <div className="profile-banner" />

          <div className="avatar-wrapper">
            <img
              src={avatarUrl || `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(username || user?.email || "U")}`}
              alt="Profile avatar"
              className="profile-avatar"
            />
            <button
              type="button"
              className="avatar-edit-button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              aria-label="Change profile photo"
            >
              <FaPencilAlt />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleAvatarChange}
            />
          </div>

          {uploadingAvatar && (
            <p style={{ textAlign: "center", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.55)", marginBottom: "var(--space-1)" }}>
              Uploading…
            </p>
          )}

          <div className="stats-row">
            {statsData.map((stat) => (
  <StatCard key={stat.label} value={stat.value} label={stat.label} icon={stat.icon} color={stat.color} />
))}
          </div>

          <section className="info-section">
            <div className="info-header">
              <h2 className="section-title">Personal Information</h2>
              <button
                type="button"
                className="edit-profile-button"
                onClick={editing ? handleSave : () => setEditing(true)}
                disabled={savingProfile}
              >
                {savingProfile ? "Saving…" : editing ? "Save" : "Edit"}
              </button>
            </div>

            <div className="info-grid">
              <div className="info-field">
                <label htmlFor="fullName">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={username}
                  placeholder="Your name"
                  onChange={(e) => setUsername(e.target.value)}
                  readOnly={!editing}
                />
              </div>

              <div className="info-field">
                <label htmlFor="email">Email</label>
                <input id="email" type="text" value={user?.email ?? "—"} readOnly />
              </div>

              <div className="info-field">
                <label htmlFor="memberSince">Member Since</label>
                <input id="memberSince" type="text" value={memberSince} readOnly />
              </div>

              <div className="info-field">
                <label htmlFor="goal">Fitness Goal</label>
                <input
                  id="goal"
                  type="text"
                  value={goal}
                  placeholder="e.g. Build strength"
                  onChange={(e) => setGoal(e.target.value)}
                  readOnly={!editing}
                />
              </div>
            </div>
          </section>
        </section>

        <section className="activity-section">
          <h2 className="section-title">Recent Activity</h2>

          {loadingStats && (
            <p style={{ margin: "var(--space-1) 0", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.45)" }}>
              Loading…
            </p>
          )}

          {!loadingStats && recentSessions.length === 0 && (
            <p style={{ margin: "var(--space-1) 0", fontSize: "var(--font-body-md)", color: "rgba(25,28,30,0.45)" }}>
              No workouts logged yet. Log your first one from the home screen!
            </p>
          )}

          {!loadingStats && recentSessions.length > 0 && (
            <div className="activity-list">
              {recentSessions.map((session) => (
                <article key={session.workout_id} className="activity-card">
                  <div className="activity-left">
                    <h3 className="activity-title">{session.workout_type}</h3>
                    <p className="activity-time">{formatWorkoutDate(session.created_at)}</p>
                  </div>
                  <p className="activity-duration">
                    {session.duration_minutes != null ? `${session.duration_minutes} min` : "—"}
                  </p>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
