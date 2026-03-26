import type { WorkoutSession } from "../../types";

// Possible attendance states for a given day. 
export type AttendanceStatus = "attended" | "missed";


// Determine wether a specific date should be marked as attended or missed.
// Is considered "attended" if the user has logged at least one workout.
export function getDayAttendance(
    date: string,
    workouts: WorkoutSession[]
): AttendanceStatus {

    // Check if any workout occured on the given date.
    const wasAttended = workouts.some((workout) => workout.date === date);
    return wasAttended  ? "attended" : "missed";
}

// Generate an atendance map for multiple dates.
export function getAttendanceMap(
    date: string[],
    workouts: WorkoutSession[]
): Record<string, AttendanceStatus> {
    const attendanceData = new Set(workouts.map((w) => w.date));
    return Object.fromEntries(
        date.map((date) => [date, attendanceData.has(date) ? "attended" : "missed"])
    );
}
