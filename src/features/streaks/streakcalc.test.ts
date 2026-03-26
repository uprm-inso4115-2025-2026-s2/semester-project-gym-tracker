import { describe, it, expect } from 'vitest';
import { StreakCalculator, GracePeriodStatus } from './streakcalc';
import type { UserStreak } from './streakcalc';

describe('StreakCalculator', () => {
  const baseline: UserStreak = {
    id: 'u1',
    user_id: 'u1',
    streak_current: 0,
    streak_longest: 0,
    grace_period_active: false,
    grace_period_start_date: null,
    last_workout_date: null,
    user_timezone: 'UTC',
    created_at: new Date(),
    updated_at: new Date(),
  };

  it('valid workout scoring rules', () => {
    expect(StreakCalculator.isValidWorkoutDay(1, 6)).toBe(true);
    expect(StreakCalculator.isValidWorkoutDay(1, 4)).toBe(true);
    expect(StreakCalculator.isValidWorkoutDay(0, 4)).toBe(false);
  });

  it('increases streak when consecutive', () => {
    const first = StreakCalculator.updateStreakWithWorkout(baseline, { id: 'w1', userId: 'u1', activityType: 'run', date: '2026-03-24', durationMinutes: 10 }, new Date('2026-03-24T12:00:00Z'));
    expect(first.updated.streak_current).toBe(1);

    const second = StreakCalculator.updateStreakWithWorkout(first.updated, { id: 'w2', userId: 'u1', activityType: 'gym', date: '2026-03-25', durationMinutes: 10 }, new Date('2026-03-25T12:00:00Z'));
    expect(second.updated.streak_current).toBe(2);
    expect(second.updated.streak_longest).toBe(2);
  });

  it('grace period activates after missed day', () => {
    const started = StreakCalculator.updateStreakWithWorkout(baseline, { id: 'w1', userId: 'u1', activityType: 'gym', date: '2026-03-20', durationMinutes: 10 }, new Date('2026-03-20T12:00:00Z'));
    const spaced = StreakCalculator.applyMissedDayProgress(started.updated, new Date('2026-03-22T12:00:00Z'));
    expect(spaced.grace_period_active).toBe(true);
    expect(StreakCalculator.getGracePeriodStatus(spaced.grace_period_active, spaced.grace_period_start_date, new Date('2026-03-22T12:00:00Z'))).toBe(GracePeriodStatus.DAY_2);
  });

  it('resets after grace expires', () => {
    const started = StreakCalculator.updateStreakWithWorkout(baseline, { id: 'w1', userId: 'u1', activityType: 'gym', date: '2026-03-20', durationMinutes: 10 }, new Date('2026-03-20T12:00:00Z'));
    const spaced = StreakCalculator.applyMissedDayProgress(started.updated, new Date('2026-03-23T12:00:00Z'));
    expect(spaced.streak_current).toBe(0);
    expect(spaced.grace_period_active).toBe(false);
  });
});
