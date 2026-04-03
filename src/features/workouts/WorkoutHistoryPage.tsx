import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import {
  getUserWorkoutSessions,
  getWorkoutExercisesBySessionId,
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

export default function WorkoutHistoryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<WorkoutSessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  const [expandedWorkoutId, setExpandedWorkoutId] = useState<string | null>(null);
  const [exerciseMap, setExerciseMap] = useState<Record<string, WorkoutExerciseRecord[]>>({});
  const [loadingExercisesFor, setLoadingExercisesFor] = useState<string | null>(null);

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
      return;
    }

    setExpandedWorkoutId(workoutId);

    if (exerciseMap[workoutId]) return;

    try {
      setLoadingExercisesFor(workoutId);
      const exercises = await getWorkoutExercisesBySessionId(workoutId);

      setExerciseMap((prev) => ({
        ...prev,
        [workoutId]: exercises,
      }));
    } catch (error) {
      console.error("Failed to load workout exercises:", error);

      setExerciseMap((prev) => ({
        ...prev,
        [workoutId]: [],
      }));
    } finally {
      setLoadingExercisesFor(null);
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
              const exercises = exerciseMap[session.workout_id] ?? [];
              const isLoadingExercises = loadingExercisesFor === session.workout_id;

              return (
                <article key={session.workout_id} className="session-card">
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

                  {isExpanded && (
                    <div className="session-details">
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
                                <p className="exercise-name">Exercise ID: {exercise.exercise_id}</p>
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
