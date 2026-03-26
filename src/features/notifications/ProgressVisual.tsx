import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

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
      color: "var(--accent-green)",
    },
    {
      label: "REPS",
      current: progress.reps_completed ?? 0,
      target: progress.reps_target ?? 1,
      unit: "reps",
      color: "var(--accent-amber)",
    },
    {
      label: "VOLUME",
      current: progress.volume_kg ?? 0,
      target: progress.volume_target_kg ?? 1,
      unit: "kg",
      color: "var(--accent-blue)",
    },
  ];

  const overallPct = Math.round(
    (metrics.reduce((sum, m) => sum + clampRatio(m.current, m.target), 0) / metrics.length) * 100
  );

  return (
    <>
      <style>{styles}</style>
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

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=JetBrains+Mono:wght@400;600&display=swap');

  :root {
    --bg:           #0d0f10;
    --surface:      #161a1d;
    --surface-2:    #1e2428;
    --border:       #2a3038;
    --track:        #2a3038;
    --text:         #e8ecef;
    --muted:        #5a6470;
    --accent-green: #39ff84;
    --accent-amber: #ffb830;
    --accent-blue:  #38bdf8;
  }

  .pg-container {
    background: var(--bg);
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    padding: 1.5rem;
    border-radius: 16px;
    max-width: 480px;
    width: 100%;
    margin: 0 auto;
    border: 1px solid var(--border);
  }

  .pg-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1.75rem;
  }
  .pg-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 2.4rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    margin: 0;
    line-height: 1;
  }
  .pg-period {
    font-size: 0.7rem;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    display: block;
    margin-top: 0.3rem;
  }
  .overall-badge {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 0.6rem 1rem;
    text-align: center;
    min-width: 64px;
  }
  .overall-pct {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 2rem;
    font-weight: 900;
    line-height: 1;
    color: var(--accent-green);
  }
  .overall-label {
    font-size: 0.9rem;
    color: var(--muted);
  }

  .rings-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .ring-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem 0.75rem 0.85rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.45rem;
  }
  .ring-svg { overflow: visible; }
  .ring-arc {
    transform: rotate(-90deg);
    transform-origin: 50% 50%;
    transition: stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .ring-pct {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.15rem;
    font-weight: 900;
    fill: var(--text);
  }
  .ring-unit {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.55rem;
    fill: var(--muted);
    letter-spacing: 0.05em;
  }
  .ring-label {
    font-size: 0.62rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    color: var(--muted);
    text-transform: uppercase;
  }
  .ring-values {
    font-size: 0.7rem;
    color: var(--muted);
    display: flex;
    gap: 2px;
    align-items: center;
  }
  .ring-current { color: var(--text); font-weight: 600; }
  .ring-sep { color: var(--border); }

  .streak-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1rem;
  }
  .streak-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.85rem;
  }
  .section-label {
    font-size: 0.62rem;
    letter-spacing: 0.12em;
    color: var(--muted);
    text-transform: uppercase;
    font-weight: 600;
  }
  .streak-count {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--accent-green);
  }
  .streak-unit { font-size: 0.75rem; color: var(--muted); }
  .streak-bar {
    display: flex;
    justify-content: space-between;
    gap: 0.3rem;
  }
  .streak-day {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
  }
  .streak-pip {
    width: 100%;
    height: 8px;
    border-radius: 4px;
    background: var(--track);
    transition: background 0.3s;
  }
  .streak-day.active .streak-pip {
    background: var(--accent-green);
    box-shadow: 0 0 6px var(--accent-green);
  }
  .streak-day-label {
    font-size: 0.6rem;
    color: var(--muted);
    letter-spacing: 0.05em;
    font-weight: 600;
  }

  .skeleton {
    background: linear-gradient(90deg, var(--surface) 25%, var(--surface-2) 50%, var(--surface) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s infinite;
    border-radius: 6px;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
  .skeleton-header   { flex-direction: column; gap: 0.5rem; }
  .skeleton-title    { height: 2.4rem; width: 140px; }
  .skeleton-subtitle { height: 0.8rem; width: 80px; }
  .skeleton-ring     { height: 160px; }
  .skeleton-circle   { width: 108px; height: 108px; border-radius: 50%; }
  .skeleton-label    { height: 0.6rem; width: 50px; }

  .empty-state {
    text-align: center;
    padding: 3rem 1.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  .empty-icon { font-size: 3rem; color: var(--muted); line-height: 1; }
  .empty-title {
    font-family: 'Barlow Condensed', sans-serif;
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0;
    letter-spacing: 0.05em;
  }
  .empty-body {
    font-size: 0.75rem;
    color: var(--muted);
    line-height: 1.6;
    max-width: 260px;
    margin: 0;
  }
  .error-state { padding: 2rem; text-align: center; }
  .error-msg   { color: #ff6b6b; font-size: 0.75rem; }

  @media (max-width: 360px) {
    .rings-grid { grid-template-columns: 1fr; }
    .ring-card  { flex-direction: row; padding: 0.75rem; }
  }
`;