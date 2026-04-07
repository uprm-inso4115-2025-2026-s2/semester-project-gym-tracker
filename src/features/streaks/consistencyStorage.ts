import { getUserWorkoutSessions, type WorkoutSessionRecord } from "../workouts";
import { getAttendanceMap } from "./attendance";
import type { WorkoutSession } from "../../types";
import { getTimestampDateKey } from "../../lib/workouts";

type WorkoutSessionRecordWithCreatedAt = WorkoutSessionRecord & { created_at: string };

function hasCreatedAt(
    record: WorkoutSessionRecord
): record is WorkoutSessionRecordWithCreatedAt {
    return typeof record.created_at === "string" && record.created_at.length > 0;
}

// Convert WorkoutSessionRecord (Supabase) -> WorkoutSession (internal domain)
function toWorkoutSession(record: WorkoutSessionRecordWithCreatedAt): WorkoutSession {
    const sessionDate = getTimestampDateKey(record.created_at) ?? record.created_at.split("T")[0];

    return{
        id: record.workout_id,
        userId: record.user_id,
        date: sessionDate,
        activityType: "gym",
        durationMinutes: record.duration_minutes ?? 0,
    };
}

// ---Types----------------------------------
export interface WeeklySummary {
    weekStart: string;
    weekEnd: string;
    daysAttended: number;
    daysTotal: 7;
    attendanceMap: Record<string, "attended" | "missed">;
}

//----- Helpers-----------------------------
function getMondayOfWeek(date: Date, weeksBack: number = 0): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day) - weeksBack * 7;
    d.setDate(d.getDate() + diff);
    return d.toISOString().split("T")[0];
}

function getDaysOfWeek(mondayISO: string): string[] {
    return Array.from({ length: 7}, (_, i) => {
        const d = new Date(mondayISO);
        d.setDate(d.getDate() + i);
        return d.toISOString().split("T")[0];
    });
}

// ----- Core --------------------------
export async function getWeeklySummaries(
    userId: string,
    weeksBack: number = 4,
    today: Date = new Date()
): Promise<WeeklySummary[]> {

    // Fetch real data from Supabase
    const records = await getUserWorkoutSessions(userId);

    const recordsWithCreatedAt = records.filter(hasCreatedAt);
    if (recordsWithCreatedAt.length !== records.length) {
        console.warn("Skipped workout sessions missing created_at while building weekly summaries.");
    }

    // Addapt to domain type
    const sessions: WorkoutSession[] = recordsWithCreatedAt.map(toWorkoutSession);

    // Build summaries
    return Array.from({ length: weeksBack }, (_, i) => {
        const weekStart = getMondayOfWeek(today, weeksBack - 1 - i);
        const days = getDaysOfWeek(weekStart);
        const weekEnd = days[6];
        const attendanceMap = getAttendanceMap(days, sessions);
        const daysAttended = Object.values(attendanceMap).filter(v => v === "attended").length;

        return { weekStart, weekEnd, daysAttended, daysTotal: 7, attendanceMap };
    });
}

export async function getCurrencyWeekSummary(
    userId: string,
    today: Date = new Date()
): Promise<WeeklySummary> {
    return (await getWeeklySummaries(userId, 1, today))[0];
}

// Usage example:
// const summaries = await getWeeklySummaries("user-uuid-here", 4);
// const thisWeek = await getCurrentWeekSummary("user-uuid-here");
//
// summaries[0].daysAttended     → number (0–7)
// summaries[0].attendanceMap    → { "2026-03-24": "attended", "2026-03-25": "missed", ... }
