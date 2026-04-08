import React from "react";
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

type DateGroup = {
  dateKey: string;
  label: string;
  sessions: WorkoutSessionRecord[];
};

function groupSessionsByDate(sessions: WorkoutSessionRecord[]): DateGroup[] {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
  const map = new Map<string, WorkoutSessionRecord[]>();

  for (const session of sessions) {
    const key = session.created_at ? session.created_at.split("T")[0] : "unknown";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(session);
  }

  return Array.from(map.entries()).map(([dateKey, groupSessions]) => {
    let label: string;
    if (dateKey === "unknown") label = "Unknown date";
    else if (dateKey === today) label = "Today";
    else if (dateKey === yesterday) label = "Yesterday";
    else {
      label = new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      });
    }
    return { dateKey, label, sessions: groupSessions };
  });
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

function validateEditDraft(draft: EditDraft): string | null {
  if (!draft.workout_type.trim()) {
    return "Workout type is required.";
  }

  if (draft.duration_minutes !== "") {
    const duration = Number(draft.duration_minutes);
    if (!Number.isInteger(duration) || duration <= 0) {
      return "Duration must be a positive whole number.";
    }
  }

  if (draft.calories_burned !== "") {
    const calories = Number(draft.calories_burned);
    if (!Number.isInteger(calories) || calories < 0) {
      return "Calories burned must be 0 or greater.";
    }
  }

  return null;
}

export default function WorkoutHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, WorkoutExerciseRecord[]>>({});
  const [loadingExercisesFor, setLoadingExercisesFor] = useState<string | null>(null);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  // Select + bulk delete state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingSelected, setDeletingSelected] = useState(false);

  useEffect(() => {
    async function loadWorkoutSessions() {
      if (!user?.id) {
        setLoadingSessions(false);
        return;
      }
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

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  function clearActionFeedback() {
    setActionMessage(null);
    setActionError(null);
  }

  function toggleSelectMode() {
    if (selectMode) {
      exitSelectMode();
    } else {
      clearActionFeedback();
      setSelectMode(true);
      setExpandedWorkoutId(null);
      setEditingId(null);
      setEditDraft(null);
    }
  }

  function toggleSelection(workoutId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(workoutId)) next.delete(workoutId);
      else next.add(workoutId);
      return next;
    });
  }

  async function handleDeleteSelected() {
    if (selectedIds.size === 0) return;
    clearActionFeedback();
    setDeletingSelected(true);
    const deletedCount = selectedIds.size;
    try {
      await Promise.all(Array.from(selectedIds).map((id) => deleteWorkoutSession(id)));
      setSessions((prev) => prev.filter((s) => !selectedIds.has(s.workout_id)));
      exitSelectMode();
      setActionMessage(`Deleted ${deletedCount} workout${deletedCount === 1 ? "" : "s"}.`);
      window.dispatchEvent(new Event("progress-updated"));
    } catch {
      setActionError("Some deletions failed. Please try again.");
    } finally {
      setDeletingSelected(false);
    }
  }

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

  function handleEditStart(session: WorkoutSessionRecord) {
    clearActionFeedback();
    setExpandedWorkoutId(session.workout_id);
    setEditingId(session.workout_id);
    setEditDraft(sessionToEditDraft(session));
  }

  function handleEditCancel() {
    setEditingId(null);
    setEditDraft(null);
  }

  async function handleEditSave(workoutId: string) {
    if (!editDraft) return;
    const validationError = validateEditDraft(editDraft);
    if (validationError) {
      setActionMessage(null);
      setActionError(validationError);
      return;
    }

    clearActionFeedback();
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
      setActionMessage("Workout updated.");
      window.dispatchEvent(new Event("progress-updated"));
    } catch {
      setActionError("Failed to save changes. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  const dateGroups = groupSessionsByDate(sessions);

  return (
    <main className="history-page">
      <div className="history-inner">
        <header className="history-header">
          <div>
            <h1 className="history-heading">Workout History</h1>
            <p className="history-subheading">
              Your previous workout sessions.
            </p>
          </div>

          <div className="history-header-actions">
            {sessions.length > 0 && (
              <button
                className={`history-select-btn${selectMode ? " history-select-btn--active" : ""}`}
                onClick={toggleSelectMode}
              >
                {selectMode ? "Cancel" : "Select"}
              </button>
            )}
            <button className="history-back-btn" onClick={() => navigate("/")}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Back
            </button>
          </div>
        </header>

        {loadingSessions && (
          <div className="history-status">Loading workout history…</div>
        )}

        {sessionsError && (
          <div className="history-status-error">{sessionsError}</div>
        )}

        {actionMessage && (
          <div className="history-status">{actionMessage}</div>
        )}

        {actionError && (
          <div className="history-status-error">{actionError}</div>
        )}

        {!loadingSessions && !sessionsError && sessions.length === 0 && (
          <div className="history-status">
            No workout sessions found yet.
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length > 0 && (
          <div className="history-list">
            {dateGroups.map((group) => (
              <div key={group.dateKey} className="date-group">
                <div className="date-group-header">
                  <span className="date-group-label">{group.label}</span>
                </div>

                <section className="date-group-sessions">
                  {group.sessions.map((session) => {
                    const isExpanded = expandedWorkoutId === session.workout_id;
                    const isEditing = editingId === session.workout_id;
                    const isSelected = selectedIds.has(session.workout_id);
                    const exercises = exerciseMap[session.workout_id] ?? [];
                    const isLoadingExercises = loadingExercisesFor === session.workout_id;

                    return (
                      <article
                        key={session.workout_id}
                        className={`session-card${isSelected ? " session-card--selected" : ""}`}
                      >
                        {/* Card header */}
                        <div className="session-card-header">
                          {selectMode && (
                            <button
                              className="session-checkbox-btn"
                              onClick={() => toggleSelection(session.workout_id)}
                              aria-label={isSelected ? "Deselect" : "Select"}
                            >
                              <span className={`session-checkbox${isSelected ? " session-checkbox--checked" : ""}`} />
                            </button>
                          )}

                          <button
                            className="session-card-trigger"
                            onClick={() =>
                              selectMode
                                ? toggleSelection(session.workout_id)
                                : handleToggleWorkoutDetails(session.workout_id)
                            }
                          >
                            <div>
                              <h2 className="session-type">{session.workout_type}</h2>
                              <p className="session-date">{formatWorkoutDate(session.created_at)}</p>
                            </div>
                            {!selectMode && (
                              <div className="session-meta-right">
                                <p className="session-duration">{formatDuration(session.duration_minutes)}</p>
                                <p className="session-expand-label">{isExpanded ? "Hide details" : "More info"}</p>
                              </div>
                            )}
                          </button>

                          {!selectMode && (
                            <button
                              className="session-edit-icon-btn"
                              onClick={() =>
                                isEditing ? handleEditCancel() : handleEditStart(session)
                              }
                              aria-label="Edit workout"
                              title="Edit workout"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                            </button>
                          )}
                        </div>

                        {/* Expanded details */}
                        {isExpanded && !selectMode && (
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk delete bar — shown at bottom when items are selected */}
      {selectMode && (
        <div className="select-mode-bar">
          <p className="select-mode-count">
            {selectedIds.size === 0
              ? "Tap workouts to select"
              : `${selectedIds.size} selected`}
          </p>
          <button
            className="select-mode-delete-btn"
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0 || deletingSelected}
          >
            {deletingSelected ? "Deleting…" : `Delete${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
          </button>
        </div>
      )}
    </main>
  );
}
