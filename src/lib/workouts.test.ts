import { describe, expect, it } from "vitest";
import type { WorkoutSession } from "../types";
import {
  computeLongestStreakFromWorkoutSessions,
  countWorkoutDaysInRange,
  countWorkoutsOnDate,
  evaluateWeeklyGoal,
  getEndOfWeekDateKey,
  getStartOfWeekDateKey,
  getTimestampDateKey,
  validateGoalEntry,
} from "./workouts";

const sessions: WorkoutSession[] = [
  { id: "w1", userId: "u1", date: "2026-04-06", activityType: "gym", durationMinutes: 45 },
  { id: "w2", userId: "u1", date: "2026-04-06", activityType: "gym", durationMinutes: 30 },
  { id: "w3", userId: "u1", date: "2026-04-07", activityType: "run", durationMinutes: 20 },
  { id: "w4", userId: "u1", date: "2026-04-08", activityType: "cardio", durationMinutes: 25 },
  { id: "w5", userId: "u1", date: "2026-04-10", activityType: "gym", durationMinutes: 60 },
  { id: "w6", userId: "u1", date: "2026-04-11", activityType: "gym", durationMinutes: 60, completed: false },
];

describe("workout helpers", () => {
  it("extracts a UTC date key from timestamps", () => {
    expect(getTimestampDateKey("2026-04-07T13:20:00.000Z")).toBe("2026-04-07");
    expect(getTimestampDateKey(null)).toBeNull();
  });

  it("counts workouts logged on a specific day", () => {
    expect(countWorkoutsOnDate(sessions, "2026-04-06")).toBe(2);
    expect(countWorkoutsOnDate(sessions, "2026-04-11")).toBe(0);
  });

  it("counts unique workout days inside a range", () => {
    expect(countWorkoutDaysInRange(sessions, "2026-04-06", "2026-04-12")).toBe(4);
    expect(countWorkoutDaysInRange(sessions, "2026-04-09", "2026-04-12")).toBe(1);
  });

  it("computes the longest streak from unique completed days", () => {
    expect(computeLongestStreakFromWorkoutSessions(sessions)).toBe(3);
  });

  it("evaluates weekly goals from completed workout days in the requested week", () => {
    const result = evaluateWeeklyGoal(
      sessions,
      4,
      { start: "2026-04-06", end: "2026-04-12" }
    );

    expect(result).toEqual({
      achieved: true,
      activeDays: 4,
      targetDays: 4,
      remaining: 0,
    });
  });

  it("ignores incomplete workouts and sessions outside the requested week", () => {
    const extendedSessions: WorkoutSession[] = [
      ...sessions,
      { id: "w7", userId: "u1", date: "2026-04-05", activityType: "run", durationMinutes: 20 },
      { id: "w8", userId: "u1", date: "2026-04-12", activityType: "gym", durationMinutes: 50, completed: false },
    ];

    const result = evaluateWeeklyGoal(
      extendedSessions,
      5,
      { start: "2026-04-06", end: "2026-04-12" }
    );

    expect(result).toEqual({
      achieved: false,
      activeDays: 4,
      targetDays: 5,
      remaining: 1,
    });
  });

  it("validates weekly goal targets as positive integers", () => {
    expect(validateGoalEntry(5)).toEqual({ valid: true, errors: [] });
    expect(validateGoalEntry(undefined)).toEqual({
      valid: false,
      errors: ["Goal must be a positive integer."],
    });
    expect(validateGoalEntry(0)).toEqual({
      valid: false,
      errors: ["Goal must be a positive integer."],
    });
    expect(validateGoalEntry(2.5)).toEqual({
      valid: false,
      errors: ["Goal must be a positive integer."],
    });
  });

  it("returns monday-sunday week bounds", () => {
    expect(getStartOfWeekDateKey(new Date("2026-04-08T12:00:00Z"))).toBe("2026-04-06");
    expect(getEndOfWeekDateKey(new Date("2026-04-08T12:00:00Z"))).toBe("2026-04-12");
  });
});
