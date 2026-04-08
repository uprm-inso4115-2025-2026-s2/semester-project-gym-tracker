import React from "react";
import { useEffect, useRef, useState } from "react";
import { createWorkoutSession, saveExercisesForSession } from "./workoutSessionsApi";
import { deleteWorkoutSession } from "./api";
import { useAuth } from "../auth";
import { supabase } from "../../lib/supabaseClient";

type ExerciseSuggestion = { exercise_id: string; name: string; category: string | null };

type Props = {
  onClose: () => void;
  /** Called after the workout_sessions record is inserted successfully. */
  onWorkoutLogged: () => Promise<void>;
};

type ExerciseRow = {
  id: number;
  name: string;
  sets: string;
  reps: string;
  weight: string;
};

const WORKOUT_TYPES = ["Gym", "Run", "Cardio", "Other"] as const;

export default function LogWorkoutModal({ onClose, onWorkoutLogged }: Props) {
  const { user } = useAuth();

  const [workoutType, setWorkoutType] = useState<string>("Gym");
  const [duration, setDuration] = useState<string>("");
  const [calories, setCalories] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [exercises, setExercises] = useState<ExerciseRow[]>([]);
  const [nextId, setNextId] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allExercises, setAllExercises] = useState<ExerciseSuggestion[]>([]);
  const [activeSuggestionId, setActiveSuggestionId] = useState<number | null>(null);
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("exercises")
      .select("exercise_id, name, category")
      .order("name")
      .then(({ data }) => setAllExercises((data as ExerciseSuggestion[]) ?? []));
  }, [user]);

  function addExercise() {
    setExercises((prev) => [...prev, { id: nextId, name: "", sets: "", reps: "", weight: "" }]);
    setNextId((n) => n + 1);
  }

  function removeExercise(id: number) {
    setExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function updateExercise(id: number, field: keyof Omit<ExerciseRow, "id">, value: string) {
    setExercises((prev) => prev.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    const durationNum = parseInt(duration, 10);
    if (!duration || isNaN(durationNum) || durationNum <= 0) {
      setError("Please enter a valid duration in minutes.");
      return;
    }

    const caloriesNum = calories ? parseInt(calories, 10) : undefined;
    if (calories && (isNaN(caloriesNum ?? Number.NaN) || (caloriesNum ?? 0) < 0)) {
      setError("Calories burned must be 0 or greater.");
      return;
    }

    setLoading(true);
    setError("");

    let workoutId: string | null = null;

    try {
      const sessionData = await createWorkoutSession({
        workout_type: workoutType,
        duration_minutes: durationNum,
        calories_burned: caloriesNum,
        notes: notes.trim() || undefined,
      });

      workoutId = sessionData?.[0]?.workout_id ?? null;
      const validExercises = exercises.filter((e) => e.name.trim());

      if (!workoutId) {
        throw new Error("Workout was created without a session ID. Please try again.");
      }

      if (validExercises.length > 0) {
        try {
          await saveExercisesForSession(
            workoutId,
            validExercises.map((e) => ({
              name: e.name.trim(),
              sets: e.sets ? parseInt(e.sets, 10) : undefined,
              reps: e.reps ? parseInt(e.reps, 10) : undefined,
              weight: e.weight ? parseFloat(e.weight) : undefined,
            }))
          );
        } catch (exerciseError) {
          try {
            await deleteWorkoutSession(workoutId);
          } catch (rollbackError) {
            console.error("Failed to roll back workout after exercise save failure:", rollbackError);
            throw new Error(
              "The workout session may have been saved without its exercises. Check Workout History before retrying."
            );
          }

          console.error("Failed to save exercises for workout:", exerciseError);
          throw new Error("Exercise details could not be saved, so the workout was not logged.");
        }
      }

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
        alignItems: "flex-start",
        justifyContent: "center",
        zIndex: 100,
        padding: "1rem",
        paddingBottom: "5rem",
        overflowY: "auto",
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

          {/* Exercises — optional */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>
                Exercises <span style={{ color: "var(--outline-variant, #c2c6d9)", fontSize: "0.75rem" }}>(optional)</span>
              </label>
              <button
                type="button"
                onClick={addExercise}
                style={{
                  padding: "0.25rem 0.75rem",
                  background: "var(--primary, #004bca)",
                  color: "#fff",
                  border: "none",
                  borderRadius: "var(--radius-md, 0.5rem)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                + Add
              </button>
            </div>

            {exercises.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                {exercises.map((ex) => {
                  const query = ex.name.trim().toLowerCase();
                  const suggestions = query.length > 0
                    ? allExercises.filter((s) => s.name.toLowerCase().includes(query)).slice(0, 20)
                    : allExercises.slice(0, 20);
                  const showSuggestions = activeSuggestionId === ex.id && suggestions.length > 0;

                  return (
                  <div key={ex.id} style={{ background: "var(--surface-container, #f2f4f6)", borderRadius: "var(--radius-md, 0.5rem)", padding: "0.6rem 0.75rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.4rem" }}>
                      <div style={{ flex: 1 }}>
                        <input
                          ref={(el) => { inputRefs.current[ex.id] = el; }}
                          type="text"
                          value={ex.name}
                          onChange={(e) => {
                            updateExercise(ex.id, "name", e.target.value);
                            const rect = inputRefs.current[ex.id]?.getBoundingClientRect() ?? null;
                            setDropdownRect(rect);
                            setActiveSuggestionId(ex.id);
                          }}
                          onFocus={() => {
                            const rect = inputRefs.current[ex.id]?.getBoundingClientRect() ?? null;
                            setDropdownRect(rect);
                            setActiveSuggestionId(ex.id);
                          }}
                          onBlur={() => setTimeout(() => setActiveSuggestionId(null), 150)}
                          placeholder="Exercise name"
                          style={{ ...inputStyle, width: "100%", boxSizing: "border-box" }}
                        />
                        {showSuggestions && dropdownRect && (
                          <div
                            style={{
                              position: "fixed",
                              top: dropdownRect.bottom + 4,
                              left: dropdownRect.left,
                              width: dropdownRect.width,
                              background: "#ffffff",
                              border: "1.5px solid var(--outline-variant, #c2c6d9)",
                              borderRadius: "var(--radius-md, 0.5rem)",
                              zIndex: 9999,
                              maxHeight: `${Math.min(220, window.innerHeight - dropdownRect.bottom - 72)}px`,
                              overflowY: "auto",
                              boxShadow: "0 4px 16px rgba(25,28,30,0.18)",
                            }}
                          >
                            {suggestions.map((s) => (
                              <div
                                key={s.exercise_id}
                                onMouseDown={() => {
                                  updateExercise(ex.id, "name", s.name);
                                  setActiveSuggestionId(null);
                                }}
                                style={{
                                  padding: "0.5rem 0.85rem",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  fontSize: "0.875rem",
                                  color: "#191c1e",
                                  borderBottom: "1px solid #f2f4f6",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.background = "#f2f4f6")}
                                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                              >
                                <span>{s.name}</span>
                                {s.category && (
                                  <span style={{ fontSize: "0.72rem", color: "#74777f", marginLeft: "0.5rem" }}>
                                    {s.category}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExercise(ex.id)}
                        aria-label="Remove exercise"
                        style={{
                          padding: "0.4rem 0.6rem",
                          background: "transparent",
                          border: "1px solid var(--outline-variant, #c2c6d9)",
                          borderRadius: "var(--radius-md, 0.5rem)",
                          cursor: "pointer",
                          color: "var(--error, #ba1a1a)",
                          fontWeight: 700,
                          fontSize: "0.85rem",
                          flexShrink: 0,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.4rem" }}>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "0.72rem" }}>Sets</label>
                        <input
                          type="number"
                          min={1}
                          value={ex.sets}
                          onChange={(e) => updateExercise(ex.id, "sets", e.target.value)}
                          placeholder="—"
                          style={{ ...inputStyle, textAlign: "center" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "0.72rem" }}>Reps</label>
                        <input
                          type="number"
                          min={1}
                          value={ex.reps}
                          onChange={(e) => updateExercise(ex.id, "reps", e.target.value)}
                          placeholder="—"
                          style={{ ...inputStyle, textAlign: "center" }}
                        />
                      </div>
                      <div>
                        <label style={{ ...labelStyle, fontSize: "0.72rem" }}>Weight (kg)</label>
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          value={ex.weight}
                          onChange={(e) => updateExercise(ex.id, "weight", e.target.value)}
                          placeholder="—"
                          style={{ ...inputStyle, textAlign: "center" }}
                        />
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
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
