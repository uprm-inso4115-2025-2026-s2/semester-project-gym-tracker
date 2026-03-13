import type { WorkoutSession } from "../../types";
import { computeStreak } from "../../lib/workouts";

// Milestone Thresholds

export const STREAK_MILESTONES = [7, 14, 30, 60, 100];

// Types

export interface MilestoneCheckResult {
  streak: number;
  milestoneReached: boolean;
  milestone?: number;
}

// Detect Milestone

export function detectStreakMilestone(
  sessions: WorkoutSession[],
  achievedMilestones: number[]
): MilestoneCheckResult {
  const streak = computeStreak(sessions);
  const milestone = STREAK_MILESTONES.find((m) => m === streak);

  if (!milestone) {
    return { streak, milestoneReached: false };
  }

  if (achievedMilestones.includes(milestone)) {
    return { streak, milestoneReached: false };
  }

  return { streak, milestoneReached: true, milestone };
}

// Handle Fails and Calls the Notification 

export async function handleMilestoneCheck(
  userId: string,
  sessions: WorkoutSession[],
  achievedMilestones: number[],
  notify: (userId: string, milestone: number) => Promise<void>
): Promise<MilestoneCheckResult> {
  const result = detectStreakMilestone(sessions, achievedMilestones);

  if (result.milestoneReached && result.milestone !== undefined) {
    try {
      await notify(userId, result.milestone);
    } catch (err) {
      console.error(`Notification failed for user ${userId}:`, err);
    }
  }

  return result;
}
