import { motion } from "framer-motion";
import type { WorkoutSession } from "../../types";
import { computeStreakFromSessions } from "./streakcalc";
import StreakEmptyState, { type StreakEmptyStateProps } from "./StreakEmptyState";
import "./StreakDisplay.css";

type StreakDisplayProps = {
  sessions: WorkoutSession[];
  isBroken?: boolean;
  longestStreak?: number;
  emptyStateProps?: StreakEmptyStateProps;
};

type StreakCardProps = {
  label: string;
  days: number;
  variant: "active" | "broken" | "longest";
  badge: string;
  delay?: number;
};

function StreakCard({ label, days, variant, badge, delay = 0 }: StreakCardProps) {
  return (
    <motion.section
      aria-label={label}
      className={`streak-card streak-card--${variant}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <p className="streak-card__label">{label}</p>
      <p className="streak-card__count">
        {days}
        <span className="streak-card__unit"> day{days === 1 ? "" : "s"}</span>
      </p>
      <span className={`streak-card__badge streak-card__badge--${variant}`}>{badge}</span>
    </motion.section>
  );
}

export default function StreakDisplay({
  sessions,
  isBroken,
  longestStreak = 0,
  emptyStateProps,
}: StreakDisplayProps) {
  const currentStreak = sessions.length > 0 ? computeStreakFromSessions(sessions) : 0;
  const isStreakBroken = isBroken || currentStreak === 0;

  if (sessions.length === 0 && !isBroken) {
    return <StreakEmptyState {...emptyStateProps} />;
  }

  return (
    <div className="streak-display">
      <motion.div
        className="streak-display__header"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="streak-display__title">Your Streaks 🔥</h2>
        <p className="streak-display__subtitle">Keep the momentum going!</p>
      </motion.div>

      <div className="streak-display__grid">
        {isStreakBroken ? (
          <StreakCard label="Current" days={0} variant="broken" badge="Broken" delay={0.05} />
        ) : (
          <StreakCard label="Current" days={currentStreak} variant="active" badge="Active" delay={0.05} />
        )}
        <StreakCard label="Longest" days={longestStreak} variant="longest" badge="All-time" delay={0.15} />
      </div>
    </div>
  );
}

export type { StreakDisplayProps };
