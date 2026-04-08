import "./StreakDisplay.css";

type StreakBrokenStateProps = {
  title?: string;
  message?: string;
  longestStreak?: number;
};

export default function StreakBrokenState({
  title = "💔 Streak Broken",
  message = "You missed a workout. Start a new streak today!",
  longestStreak,
}: StreakBrokenStateProps) {
  return (
    <section aria-live="polite" className="streak-broken-card">
      <h2 className="streak-broken-title">{title}</h2>
      <p className="streak-broken-message">{message}</p>
      {longestStreak !== undefined && longestStreak > 0 && (
        <p className="streak-broken-record">
          Your best streak:{" "}
          <strong>
            {longestStreak} day{longestStreak === 1 ? "" : "s"}
          </strong>
        </p>
      )}
    </section>
  );
}

export type { StreakBrokenStateProps };
