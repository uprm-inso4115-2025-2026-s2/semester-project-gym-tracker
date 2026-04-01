import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import "./ProgressVisual.css";

interface WorkoutProgress {
  sets_completed: number;
  sets_target: number;
  reps_completed: number;
  reps_target: number;
  volume_kg: number;
  volume_target_kg: number;
  recorded_at: string;
}

interface WorkoutSession {
  session_date: string;
}

interface ProgressData {
  progress: WorkoutProgress | null;
  activeDays: boolean[];
}

interface ProgressRingProps {
  label: string;
  current: number;
  target: number;
  unit: string;
  color: string;
}

interface StreakBarProps {
  days: boolean[];
}

interface ProgressVisualProps {
  userId: string;
}

const clampRatio = (val: number, target: number): number =>
  target > 0 ? Math.min(val / target, 1) : 0;

function ProgressRing({ label, current, target, unit, color }: ProgressRingProps) {
  const radius = 54;
  const stroke = 7;
  const normalizedRadius = radius - stroke;
  const circumference = 2 * Math.PI * normalizedRadius;
  const ratio = clampRatio(current, target);
  const offset = circumference * (1 - ratio);
  const pct = Math.round(ratio * 100);

  return (
    <div className="ring-card">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="ring-svg"
        role="img"
        aria-label={`${label}: ${pct}% of target`}
      >
        <circle
          stroke="var(--track)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="ring-arc"
        />
        <text x="50%" y="46%" className="ring-pct" dominantBaseline="middle" textAnchor="middle">
          {pct}%
        </text>
        <text x="50%" y="66%" className="ring-unit" dominantBaseline="middle" textAnchor="middle">
          {unit}
        </text>
      </svg>
      <div className="ring-label">{label}</div>
      <div className="ring-values">
        <span className="ring-current">{current}</span>
        <span className="ring-sep">/</span>
        <span className="ring-target">{target}</span>
      </div>
    </div>
  );
}

function StreakBar({ days }: StreakBarProps) {
  const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"] as const;
  return (
    <div className="streak-section">
      <div className="streak-header">
        <span className="section-label">WEEKLY ACTIVITY</span>
        <span className="streak-count">
          {days.filter(Boolean).length}
          <span className="streak-unit"> / 7 days</span>
        </span>
      </div>
      <div className="streak-bar">
        {DAY_LABELS.map((d, i) => (
          <div key={i} className={`streak-day ${days[i] ? "active" : ""}`}>
            <div className="streak-pip" />
            <span className="streak-day-label">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="pg-container">
      <div className="pg-header skeleton-header">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-subtitle" />
      </div>
      <div className="rings-grid">
        {[0, 1, 2].map((i) => (
          <div key={i} className="ring-card skeleton-ring">
            <div className="skeleton skeleton-circle" />
            <div className="skeleton skeleton-label" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="pg-container empty-state">
      <div className="empty-icon">◎</div>
      <h2 className="empty-title">No progress data yet</h2>
      <p className="empty-body">
        Log your first workout to start tracking progress toward your goals.
      </p>
    </div>
  );
}

export default function ProgressVisual({ userId }: ProgressVisualProps) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    async function fetchProgress(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const { data: progress, error: progressErr } = await supabase
          .from("workout_progress")
          .select("*")
          .eq("user_id", userId)
          .order("recorded_at", { ascending: false })
          .limit(1)
          .single();

        if (progressErr && progressErr.code !== "PGRST116") throw progressErr;

        const monday = new Date();
        monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
        monday.setHours(0, 0, 0, 0);

        const { data: sessions, error: sessionsErr } = await supabase
          .from("workout_sessions")
          .select("session_date")
          .eq("user_id", userId)
          .gte("session_date", monday.toISOString());

        if (sessionsErr) throw sessionsErr;

        const activeDays: boolean[] = Array(7).fill(false);
        (sessions as WorkoutSession[] | null)?.forEach(({ session_date }) => {
          const d = new Date(session_date);
          activeDays[(d.getDay() + 6) % 7] = true;
        });

        setData({ progress: (progress as WorkoutProgress) ?? null, activeDays });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "An unknown error occurred";
        console.error("ProgressVisual fetch error:", message);
        setError(message);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [userId]);

  if (loading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="pg-container error-state">
        <p className="error-msg">Failed to load progress: {error}</p>
      </div>
    );
  }

  if (!data?.progress) return <EmptyState />;

  const { progress, activeDays } = data;

  const metrics: ProgressRingProps[] = [
    {
      label: "SETS",
      current: progress.sets_completed ?? 0,
      target: progress.sets_target ?? 1,
      unit: "sets",
      color: "var(--secondary-fixed)",
    },
    {
      label: "REPS",
      current: progress.reps_completed ?? 0,
      target: progress.reps_target ?? 1,
      unit: "reps",
      color: "var(--primary-container)",
    },
    {
      label: "VOLUME",
      current: progress.volume_kg ?? 0,
      target: progress.volume_target_kg ?? 1,
      unit: "kg",
      color: "var(--primary)",
    },
  ];

  const overallPct = Math.round(
    (metrics.reduce((sum, m) => sum + clampRatio(m.current, m.target), 0) / metrics.length) * 100
  );

  return (
    <>
      <div className="pg-container">
        <div className="pg-header">
          <div className="pg-header-left">
            <h1 className="pg-title">PROGRESS</h1>
            <span className="pg-period">This Week</span>
          </div>
          <div className="overall-badge">
            <span className="overall-pct">{overallPct}</span>
            <span className="overall-label">%</span>
          </div>
        </div>

        <div className="rings-grid">
          {metrics.map((m) => (
            <ProgressRing key={m.label} {...m} />
          ))}
        </div>

        <StreakBar days={activeDays} />
      </div>
    </>
  );
}