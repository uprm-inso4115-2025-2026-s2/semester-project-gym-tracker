import React from "react";
import "./StreakDisplay.css";

export type StreakMilestoneBadgeProps = {
  milestoneDays: number;
  reached?: boolean;
  icon?: string;
  reachedLabel?: string;
  pendingLabel?: string;
};

export default function StreakMilestoneBadge({
  milestoneDays,
  reached = false,
  icon = "🏅",
  reachedLabel = "Milestone Reached",
  pendingLabel = "Keep Going",
}: StreakMilestoneBadgeProps) {
  return (
    <article
      className={`streak-milestone-badge ${reached ? "streak-milestone-badge--reached" : "streak-milestone-badge--pending"}`}
      aria-label={`${milestoneDays} day milestone ${reached ? "reached" : "pending"}`}
    >
      <p className="streak-milestone-title">
        {icon} {milestoneDays} Day Streak
      </p>
      <p className="streak-milestone-subtitle">{reached ? reachedLabel : pendingLabel}</p>
    </article>
  );
}
