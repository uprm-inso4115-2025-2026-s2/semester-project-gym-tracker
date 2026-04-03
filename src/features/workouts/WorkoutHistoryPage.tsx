import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import {
  getUserWorkoutSessions,
  getWorkoutExercisesBySessionId,
  type WorkoutSessionRecord,
  type WorkoutExerciseRecord,
} from "./api";

function formatWorkoutDate(dateString: string) {
  const date = new Date(dateString);

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
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "2rem 1.5rem",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "2.2rem",
                fontWeight: 700,
                color: "#111827",
              }}
            >
              Workout History
            </h1>

            <p
              style={{
                margin: "0.5rem 0 0 0",
                color: "#6b7280",
                fontSize: "1rem",
              }}
            >
              View your previous workout sessions and expand a card for more details.
            </p>
          </div>

          <button
            onClick={() => navigate("/")}
            style={{
              padding: "0.7rem 1rem",
              cursor: "pointer",
              background: "#ffffff",
              color: "#111827",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontWeight: 600,
            }}
          >
            Back
          </button>
        </header>

        {loadingSessions && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1.25rem",
              color: "#4b5563",
            }}
          >
            Loading workout history...
          </div>
        )}

        {sessionsError && (
          <div
            style={{
              border: "1px solid #fca5a5",
              borderRadius: "12px",
              padding: "1.25rem",
              color: "#b91c1c",
            }}
          >
            {sessionsError}
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length === 0 && (
          <div
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "1.5rem",
              color: "#4b5563",
            }}
          >
            No workout sessions found for this user yet.
          </div>
        )}

        {!loadingSessions && !sessionsError && sessions.length > 0 && (
          <section
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
            }}
          >
            {sessions.map((session) => {
              const isExpanded = expandedWorkoutId === session.id;
              const exercises = exerciseMap[session.id] ?? [];
              const isLoadingExercises = loadingExercisesFor === session.id;

              return (
                <article
                  key={session.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "14px",
                    overflow: "hidden",
                  }}
                >
                  <button
                    onClick={() => handleToggleWorkoutDetails(session.id)}
                    style={{
                      width: "100%",
                      background: "#ffffff",
                      border: "none",
                      padding: "1.25rem",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "1rem",
                      textAlign: "left",
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "#111827",
                        }}
                      >
                        {session.workout_type}
                      </h2>

                      <p
                        style={{
                          margin: "0.4rem 0 0 0",
                          fontSize: "0.95rem",
                          color: "#6b7280",
                        }}
                      >
                        {formatWorkoutDate(session.created_at)}
                      </p>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.98rem",
                          fontWeight: 600,
                          color: "#111827",
                        }}
                      >
                        {formatDuration(session.duration_minutes)}
                      </p>

                      <p
                        style={{
                          margin: "0.4rem 0 0 0",
                          fontSize: "0.9rem",
                          color: "#6b7280",
                        }}
                      >
                        {isExpanded ? "Hide details" : "More info"}
                      </p>
                    </div>
                  </button>

                  {isExpanded && (
                    <div
                      style={{
                        borderTop: "1px solid #e5e7eb",
                        padding: "1rem 1.25rem 1.25rem 1.25rem",
                        background: "#ffffff",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                          gap: "0.75rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "0.85rem",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              color: "#6b7280",
                            }}
                          >
                            Duration
                          </p>
                          <p
                            style={{
                              margin: "0.35rem 0 0 0",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {formatDuration(session.duration_minutes)}
                          </p>
                        </div>

                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "0.85rem",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              color: "#6b7280",
                            }}
                          >
                            Calories Burned
                          </p>
                          <p
                            style={{
                              margin: "0.35rem 0 0 0",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {session.calories_burned ?? "N/A"}
                          </p>
                        </div>

                        <div
                          style={{
                            border: "1px solid #e5e7eb",
                            borderRadius: "10px",
                            padding: "0.85rem",
                          }}
                        >
                          <p
                            style={{
                              margin: 0,
                              fontSize: "0.85rem",
                              color: "#6b7280",
                            }}
                          >
                            Session Date
                          </p>
                          <p
                            style={{
                              margin: "0.35rem 0 0 0",
                              fontWeight: 700,
                              color: "#111827",
                            }}
                          >
                            {formatWorkoutDate(session.created_at)}
                          </p>
                        </div>
                      </div>

                      <div
                        style={{
                          border: "1px solid #e5e7eb",
                          borderRadius: "10px",
                          padding: "0.9rem",
                          marginBottom: "1rem",
                        }}
                      >
                        <p
                          style={{
                            margin: 0,
                            fontSize: "0.9rem",
                            color: "#6b7280",
                          }}
                        >
                          Notes
                        </p>
                        <p
                          style={{
                            margin: "0.45rem 0 0 0",
                            color: "#111827",
                          }}
                        >
                          {session.notes?.trim() ? session.notes : "No notes for this session."}
                        </p>
                      </div>

                      <div>
                        <h3
                          style={{
                            margin: "0 0 0.75rem 0",
                            fontSize: "1rem",
                            color: "#111827",
                          }}
                        >
                          Exercises
                        </h3>

                        {isLoadingExercises && (
                          <div
                            style={{
                              color: "#6b7280",
                              fontSize: "0.95rem",
                            }}
                          >
                            Loading exercises...
                          </div>
                        )}

                        {!isLoadingExercises && exercises.length === 0 && (
                          <div
                            style={{
                              border: "1px solid #e5e7eb",
                              borderRadius: "10px",
                              padding: "0.9rem",
                              color: "#6b7280",
                              fontSize: "0.95rem",
                            }}
                          >
                            No exercise records found for this workout.
                          </div>
                        )}

                        {!isLoadingExercises && exercises.length > 0 && (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: "0.75rem",
                            }}
                          >
                            {exercises.map((exercise) => (
                              <div
                                key={exercise.id}
                                style={{
                                  border: "1px solid #e5e7eb",
                                  borderRadius: "10px",
                                  padding: "0.9rem",
                                }}
                              >
                                <p
                                  style={{
                                    margin: 0,
                                    fontWeight: 700,
                                    color: "#111827",
                                  }}
                                >
                                  Exercise ID: {exercise.exercise_id}
                                </p>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "1rem",
                                    flexWrap: "wrap",
                                    marginTop: "0.5rem",
                                    color: "#4b5563",
                                    fontSize: "0.95rem",
                                  }}
                                >
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