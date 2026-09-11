import { XP_REWARDS } from './constants';

/**
 * Calculate star rating (1-5) from AI accuracy assessment.
 * accuracy is 0-100 float.
 */
export function calculateStars(accuracy) {
  if (accuracy >= 95) return 5;
  if (accuracy >= 80) return 4;
  if (accuracy >= 65) return 3;
  if (accuracy >= 45) return 2;
  return 1;
}

/**
 * Calculate XP earned for a session.
 */
export function calculateXP(starRating, comprehensionCorrect = 0, streakDays = 0) {
  let xp = XP_REWARDS.LESSON_BASE;
  xp += starRating * XP_REWARDS.STAR_BONUS;

  if (starRating === 5) {
    xp += XP_REWARDS.PERFECT_READING;
  }

  if (comprehensionCorrect > 0) {
    xp += XP_REWARDS.COMPREHENSION_BONUS;
  }

  if (streakDays >= 3) {
    xp += XP_REWARDS.STREAK_BONUS;
  }

  return xp;
}

/**
 * Determine difficulty adjustment based on recent performance.
 * Returns a descriptive string to guide the AI prompt, not a number.
 */
export function getDifficultyAdjustment(recentSessions) {
  if (!recentSessions || recentSessions.length === 0) return 'maintain';

  const lastTwo = recentSessions.slice(0, 2);
  const avgAccuracy = lastTwo.reduce((sum, s) => sum + (s.accuracy_score || 0), 0) / lastTwo.length;

  if (avgAccuracy >= 90) return 'harder';
  if (avgAccuracy <= 50) return 'easier';
  return 'maintain';
}
