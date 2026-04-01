import { useState } from "react";
import { createWorkoutSession } from "./workoutSessionsApi";
import { useAuth } from "../auth";

type Props = {
  onClose: () => void;
  /** Called after the workout_sessions record is inserted successfully. */
  onWorkoutLogged: () => Promise<void>;
};

const WORKOUT_TYPES = ["Gym", "Run", "Cardio", "Other"] as const;

export default function LogWorkoutModal({ onClose, onWorkoutLogged }: Props) {
  const { user } = useAuth();

  const [workoutType, setWorkoutType] = useState<string>("Gym");
  const [duration, setDuration] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const durationNum = parseInt(duration, 10);
    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      setError("Please enter a valid duration in minutes.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createWorkoutSession({
        workout_type: workoutType,
        duration_minutes: durationNum,
        calories_burned: calories ? parseInt(calories, 10) : undefined,
        notes: notes.trim() || undefined,
      });

      // Update goals tracking in the parent component
      await onWorkoutLogged();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to log workout.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Log workout"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(25, 28, 30, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          background: "var(--surface-container-lowest, #ffffff)",
          borderRadius: "var(--radius-xl, 1.5rem)",
          padding: "2rem 1.75rem",
          boxShadow: "0 8px 40px rgba(25,28,30,0.18)",
        }}
      >
        <h2 style={{
          margin: "0 0 1.5rem",
          fontSize: "1.25rem",
          fontWeight: 800,
          color: "var(--on-surface, #191c1e)",
          fontFamily: "var(--font-family-display, sans-serif)",
        }}>
          Log Workout
        </h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* Workout Type */}
          <div>
            <label style={labelStyle}>Workout Type</label>
            <select
              value={workoutType}
              onChange={(e) => setWorkoutType(e.target.value)}
              style={inputStyle}
            >
              {WORKOUT_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div>
            <label style={labelStyle}>Duration (minutes) <span style={{ color: "var(--error, #ba1a1a)" }}>*</span></label>
            <input
              type="number"
              min={1}
              max={600}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="e.g. 45"
              required
              style={inputStyle}
            />
          </div>

          {/* Calories — optional */}
          <div>
            <label style={labelStyle}>Calories Burned <span style={{ color: "var(--outline-variant, #c2c6d9)", fontSize: "0.75rem" }}>(optional)</span></label>
            <input
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="e.g. 300"
              style={inputStyle}
            />
          </div>

          {/* Notes — optional */}
          <div>
            <label style={labelStyle}>Notes <span style={{ color: "var(--outline-variant, #c2c6d9)", fontSize: "0.75rem" }}>(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={3}
              style={{ ...inputStyle, resize: "vertical", minHeight: "5rem" }}
            />
          </div>

          {error && (
            <p style={{ margin: 0, color: "var(--error, #ba1a1a)", fontSize: "0.85rem", fontWeight: 600 }}>
              {error}
            </p>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: "0.75rem", marginTop: "0.5rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.7rem",
                background: "transparent",
                border: "1px solid var(--outline-variant, #c2c6d9)",
                borderRadius: "var(--radius-md, 0.5rem)",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                color: "var(--on-surface, #191c1e)",
                fontSize: "0.9rem",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 2,
                padding: "0.7rem",
                background: loading ? "var(--outline-variant, #c2c6d9)" : "var(--primary, #004bca)",
                color: "#ffffff",
                border: "none",
                borderRadius: "var(--radius-md, 0.5rem)",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                fontSize: "0.9rem",
              }}
            >
              {loading ? "Saving…" : "Log Workout"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.35rem",
  fontSize: "0.82rem",
  fontWeight: 700,
  color: "var(--on-surface, #191c1e)",
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.85rem",
  border: "1.5px solid var(--outline-variant, #c2c6d9)",
  borderRadius: "var(--radius-md, 0.5rem)",
  fontSize: "0.9rem",
  color: "var(--on-surface, #191c1e)",
  background: "var(--surface-container-low, #f2f4f6)",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "var(--font-family-body, sans-serif)",
};
