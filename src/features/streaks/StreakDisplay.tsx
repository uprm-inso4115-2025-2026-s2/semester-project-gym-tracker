import type { WorkoutSession } from "../../types";
import { computeStreak } from "../../lib/workouts";
import StreakEmptyState, { type StreakEmptyStateProps } from "./StreakEmptyState";
import StreakBrokenState, { type StreakBrokenStateProps } from "./StreakBrokenState";
import "./StreakDisplay.css";

type StreakDisplayProps = {
  sessions: WorkoutSession[];
  isBroken?: boolean;
  longestStreak?: number;
  emptyStateProps?: StreakEmptyStateProps;
  brokenStateProps?: StreakBrokenStateProps;
};

export default function StreakDisplay({
  sessions,
  isBroken,
  longestStreak,
  emptyStateProps,
  brokenStateProps,
}: StreakDisplayProps) {
  const streakCount = computeStreak(sessions);

  if (sessions.length === 0) {
    return <StreakEmptyState {...emptyStateProps} />;
  }

  if (isBroken || streakCount === 0) {
    return <StreakBrokenState longestStreak={longestStreak} {...brokenStateProps} />;
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