// Represent a workout session logged by the user.
export type Workout = {
    id: string;
    date: string;     //Format YYYY-MM-DD
    userId: string;
    durationMinutes: number;
    notes?: string
}

// Possible attendance states for a given day. 
export type AttendanceStatus = "attended" | "missed";


// Determine wether a specific date should be marked as attended or missed.
// Is considered "attended" if the user has logged at least one workout.
export function getDayAttendance(
    date: string,
    workouts: Workout[]
): AttendanceStatus {

    // Check if any workout occured on the given date.
    const wasAttended = workouts.some((workout) => workout.date === date);
    return wasAttended  ? "attended" : "missed";
}

// Generate an atendance map for multiple dates.
export function getAttendanceMap(
    date: string[],
    workouts: Workout[]
): Record<string, AttendanceStatus> {
    const attendanceData = new Set(workouts.map((w) => w.date));
    return Object.fromEntries(
        date.map((date) => [date, attendanceData.has(date) ? "attended" : "missed"])
    );
}

// A mock data for using to testing before connecting to Supabase datebase
export const mockWorkouts: Workout[] =[
    {id: "1", date: "2026-02-01", userId: "user_01", durationMinutes: 40},
    {id: "2", date: "2026-04-10", userId: "user_01", durationMinutes: 45},
    {id: "3", date: "2026-05-02", userId: "user_01", durationMinutes: 60, notes: "Leg Day"},
]