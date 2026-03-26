import type { WorkoutSession } from "../../types";
import { computeStreak } from "../../lib/workouts";
import StreakEmptyState, { type StreakEmptyStateProps } from "./StreakEmptyState";
import "./StreakDisplay.css";

type StreakDisplayProps = {
  sessions: WorkoutSession[];
  emptyStateProps?: StreakEmptyStateProps;
};

export default function StreakDisplay({ sessions, emptyStateProps }: StreakDisplayProps) {
  const streakCount = computeStreak(sessions);

  if (streakCount <= 0) {
    return <StreakEmptyState {...emptyStateProps} />;
  }

  return (
    <section aria-label="Current workout streak" className="streak-card">
      <p className="streak-label">Current streak</p>
      <p className="streak-count">
        {streakCount} day{streakCount === 1 ? "" : "s"}
      </p>
    </section>
  );
}

export type { StreakDisplayProps };