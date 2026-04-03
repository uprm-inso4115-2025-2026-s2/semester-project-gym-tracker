import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import {
  getUserWorkoutSessions,
  getWorkoutExercisesBySessionId,
  deleteWorkoutSession,
  updateWorkoutSession,
  type WorkoutSessionRecord,
  type WorkoutExerciseRecord,
} from "./api";
import "./WorkoutHistoryPage.css";

function formatWorkoutDate(dateString: string | null | undefined) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(minutes: number | null) {
  if (minutes == null) return "N/A";
  return `${minutes} min`;
}

function formatWeight(weight: number | null) {
  if (weight == null) return "N/A";
  return `${weight} lb`;
}

type EditDraft = {
  workout_type: string;
  duration_minutes: string;
  calories_burned: string;
  notes: string;
};

function sessionToEditDraft(session: WorkoutSessionRecord): EditDraft {
  return {
    workout_type: session.workout_type ?? "",
    duration_minutes: session.duration_minutes != null ? String(session.duration_minutes) : "",
    calories_burned: session.calories_burned != null ? String(session.calories_burned) : "",
    notes: session.notes ?? "",
  };
}

export default function WorkoutHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, WorkoutExerciseRecord[]>>({});
  const [loadingExercisesFor, setLoadingExercisesFor] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkoutSessions() {
      if (!user?.id) return;

      setLoadingSessions(true);
      setSessionsError(null);

      try {
        const data = await getUserWorkoutSessions(user.id);
        setSessions(data);
      } catch (error) {
        console.error("Failed to load workout history:", error);
        setSessionsError("Could not load workout history.");
      } finally {
        setLoadingSessions(false);
      }
    }

    loadWorkoutSessions();
  }, [user]);

  async function handleToggleWorkoutDetails(workoutId: string) {
    if (expandedWorkoutId === workoutId) {
      setExpandedWorkoutId(null);
      setEditingId(null);
      setEditDraft(null);
      return;
    }

    setExpandedWorkoutId(workoutId);
    setEditingId(null);
    setEditDraft(null);

    if (exerciseMap[workoutId]) return;

    try {
      setLoadingExercisesFor(workoutId);
      const exercises = await getWorkoutExercisesBySessionId(workoutId);
      setExerciseMap((prev) => ({ ...prev, [workoutId]: exercises }));
    } catch (error) {
      console.error("Failed to load workout exercises:", error);
      setExerciseMap((prev) => ({ ...prev, [workoutId]: [] }));
    } finally {
      setLoadingExercisesFor(null);
    }
  }

  async function handleDelete(workoutId: string) {
    setDeletingId(workoutId);
    try {
      await deleteWorkoutSession(workoutId);
      setSessions((prev) => prev.filter((s) => s.workout_id !== workoutId));
      setConfirmDeleteId(null);
      if (expandedWorkoutId === workoutId) setExpandedWorkoutId(null);
    } catch {
      alert("Failed to delete workout. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEditStart(session: WorkoutSessionRecord) {
    setEditingId(session.workout_id);
    setEditDraft(sessionToEditDraft(session));
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function handleEditSave(workoutId: string) {
    if (!editDraft) return;
    setSavingId(workoutId);
    try {
      const updates = {
        workout_type: editDraft.workout_type.trim(),
        duration_minutes: editDraft.duration_minutes !== "" ? Number(editDraft.duration_minutes) : null,
        calories_burned: editDraft.calories_burned !== "" ? Number(editDraft.calories_burned) : null,
        notes: editDraft.notes.trim() || null,
      };
      await updateWorkoutSession(workoutId, updates);
      setSessions((prev) =>
        prev.map((s) => s.workout_id === workoutId ? { ...s, ...updates } : s)
      );
      setEditingId(null);
      setEditDraft(null);
    } catch {
      alert("Failed to save changes. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="history-page">
      <div className="history-inner">
        <header className="history-header">
          <div>
            <h1 className="history-heading">Workout History</h1>
            <p className="history-subheading">
              View your previous workout sessions and expand a card for more details.
            </p>
          </div>

          <button className="history-back-btn" onClick={() => navigate("/")}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>
        </header>

        {loadingSessions && (
          <div className="history-status">Loading workout history…</div>
        )}

        {sessionsError && (
          <div className="history-status-error">{sessionsError}</div>
        )}

        {!loadingSessions && !sessionsError && sessions.length === 0 && (
          <div className="history-status">
            No workout sessions found for this user yet.
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length > 0 && (
          <section className="history-list">
            {sessions.map((session) => {
              const isExpanded = expandedWorkoutId === session.workout_id;
              const isEditing = editingId === session.workout_id;
              const isConfirmingDelete = confirmDeleteId === session.workout_id;
              const exercises = exerciseMap[session.workout_id] ?? [];
              const isLoadingExercises = loadingExercisesFor === session.workout_id;

              return (
                <article key={session.workout_id} className="session-card">
                  {/* Card header row: expand trigger + delete button */}
                  <div className="session-card-header">
                    <button
                      className="session-card-trigger"
                      onClick={() => handleToggleWorkoutDetails(session.workout_id)}
                    >
                      <div>
                        <h2 className="session-type">{session.workout_type}</h2>
                        <p className="session-date">{formatWorkoutDate(session.created_at)}</p>
                      </div>
                      <div className="session-meta-right">
                        <p className="session-duration">{formatDuration(session.duration_minutes)}</p>
                        <p className="session-expand-label">{isExpanded ? "Hide details" : "More info"}</p>
                      </div>
                    </button>

                    <button
                      className="session-delete-btn"
                      onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : session.workout_id)}
                      aria-label="Delete workout"
                      title="Delete workout"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        <path d="M10 11v6M14 11v6" />
                        <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>

                  {/* Confirm delete bar */}
                  {isConfirmingDelete && (
                    <div className="session-confirm-delete">
                      <p className="confirm-delete-text">Delete this workout?</p>
                      <div className="confirm-delete-actions">
                        <button
                          className="confirm-delete-yes"
                          onClick={() => handleDelete(session.workout_id)}
                          disabled={deletingId === session.workout_id}
                        >
                          {deletingId === session.workout_id ? "Deleting…" : "Yes, delete"}
                        </button>
                        <button
                          className="confirm-delete-cancel"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="session-details">
                      {isEditing && editDraft ? (
                        <>
                          <div className="session-detail-grid">
                            <div className="session-detail-item">
                              <p className="detail-label">Type</p>
                              <input
                                className="detail-input"
                                value={editDraft.workout_type}
                                onChange={(e) => setEditDraft({ ...editDraft, workout_type: e.target.value })}
                              />
                            </div>
                            <div className="session-detail-item">
                              <p className="detail-label">Duration (min)</p>
                              <input
                                className="detail-input"
                                type="number"
                                min="1"
                                value={editDraft.duration_minutes}
                                onChange={(e) => setEditDraft({ ...editDraft, duration_minutes: e.target.value })}
                              />
                            </div>
                            <div className="session-detail-item">
                              <p className="detail-label">Calories Burned</p>
                              <input
                                className="detail-input"
                                type="number"
                                min="0"
                                value={editDraft.calories_burned}
                                onChange={(e) => setEditDraft({ ...editDraft, calories_burned: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="session-notes">
                            <p className="notes-label">Notes</p>
                            <textarea
                              className="detail-input detail-textarea"
                              value={editDraft.notes}
                              onChange={(e) => setEditDraft({ ...editDraft, notes: e.target.value })}
                              rows={3}
                            />
                          </div>
                          <div className="session-edit-actions">
                            <button
                              className="edit-save-btn"
                              onClick={() => handleEditSave(session.workout_id)}
                              disabled={savingId === session.workout_id}
                            >
                              {savingId === session.workout_id ? "Saving…" : "Save"}
                            </button>
                            <button className="edit-cancel-btn" onClick={handleEditCancel}>
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="session-detail-grid">
                            <div className="session-detail-item">
                              <p className="detail-label">Duration</p>
                              <p className="detail-value">{formatDuration(session.duration_minutes)}</p>
                            </div>
                            <div className="session-detail-item">
                              <p className="detail-label">Calories Burned</p>
                              <p className="detail-value">{session.calories_burned ?? "N/A"}</p>
                            </div>
                            <div className="session-detail-item">
                              <p className="detail-label">Session Date</p>
                              <p className="detail-value">{formatWorkoutDate(session.created_at)}</p>
                            </div>
                          </div>

                          <div className="session-notes">
                            <p className="notes-label">Notes</p>
                            <p className="notes-text">
                              {session.notes?.trim() ? session.notes : "No notes for this session."}
                            </p>
                          </div>

                          <button
                            className="session-edit-trigger"
                            onClick={() => handleEditStart(session)}
                          >
                            Edit session
                          </button>

                          <div>
                            <h3 className="exercises-heading">Exercises</h3>

                            {isLoadingExercises && (
                              <p className="exercises-empty">Loading exercises…</p>
                            )}

                            {!isLoadingExercises && exercises.length === 0 && (
                              <p className="exercises-empty">No exercise records found for this workout.</p>
                            )}

                            {!isLoadingExercises && exercises.length > 0 && (
                              <div className="exercise-list">
                                {exercises.map((exercise) => (
                                  <div key={exercise.record_id} className="exercise-item">
                                    <p className="exercise-name">
                                      {exercise.exercises?.name ?? exercise.exercise_id}
                                    </p>
                                    <div className="exercise-stats">
                                      <span>Sets: {exercise.sets ?? "N/A"}</span>
                                      <span>Reps: {exercise.reps ?? "N/A"}</span>
                                      <span>Weight: {formatWeight(exercise.weight)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
