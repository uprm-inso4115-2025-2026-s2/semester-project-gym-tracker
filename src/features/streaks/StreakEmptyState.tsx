import "./StreakDisplay.css";

type StreakEmptyStateProps = {
  title?: string;
  message?: string;
};

export default function StreakEmptyState({
  title = "🔥 No streak yet",
  message = "Log your first workout to start building consistency!",
}: StreakEmptyStateProps) {
  return (
    <section aria-live="polite" className="streak-card">
      <h2 className="streak-empty-title">{title}</h2>
      <p className="streak-empty-message">{message}</p>
    </section>
  );
}

export type { StreakEmptyStateProps };