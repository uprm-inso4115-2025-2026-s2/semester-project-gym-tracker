/*    
  inside main in app.tsx put:
  <WorkoutSessions/>
  and the following include as well:
  import WorkoutSessions from "./features/workouts/WorkoutSessions";
  to show json response of sessions table

  .env.xxxx has to be properly setted up 
*/


import { useEffect, useState } from "react";
import { getWorkoutSessions } from "./workoutSessionsApi";

export default function WorkoutSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadSessions() {
      try {
        const data = await getWorkoutSessions();
        console.log("Workout sessions:", data);
        setSessions(data ?? []);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    }

    loadSessions();
  }, []);

  return (
    <div>
      <h2>Workout Sessions</h2>

      {error && <p>Error: {error}</p>}

      {sessions.length === 0 && !error && <p>No sessions found.</p>}

      {sessions.map((s) => (
        <div key={s.id}>
          <strong>{s.workout_type}</strong> - {s.duration_minutes} min
        </div>
      ))}
    </div>
  );
}