//to test place this import on app.tsx import WorkoutSessions from "./features/workouts/WorkoutSessions";
//and inside the return <WorkoutSessions />
//this will make a button appear that pressing it should send data to the supabase
//currently it wont work since theres no user (UUID) attatched to the data

import { useEffect, useState } from "react";
import { getWorkoutSessions, createWorkoutSession } from "./workoutSessionsApi";

export default function WorkoutSessions() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [error, setError] = useState("");
  console.log("WorkoutSessions rendered");

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

  // this will need to be changed when the page is actually working and we want for the user to manaully 
  // write what data they want to log
  async function handleAddSession() {
    try {
      setError("");

      const newSession = await createWorkoutSession({
        workout_type: "Chest Day",
        duration_minutes: 60,
        calories_burned: 300,
        notes: "Test workout",
      });

      console.log("Inserted:", newSession);

      const updated = await getWorkoutSessions();
      setSessions(updated ?? []);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  }

  // this is temporal as well, just a button to add the previous functions data to the supabase
  return (
    <div>
      <h2>Workout Sessions</h2>

      <button onClick={handleAddSession}>Add Test Session</button>

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