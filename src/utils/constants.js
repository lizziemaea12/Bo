// Constants for the Bo reading app

// Age-to-difficulty mapping for initial passage generation
export const AGE_DIFFICULTY_MAP = {
  4: {
    label: 'Sight Words',
    description: 'Simple words and very short phrases',
    promptHint: 'Use only 2-5 very simple sight words per sentence like "I see a cat." Use CVC words (consonant-vowel-consonant) like cat, dog, hat, run, big. Maximum 2 sentences. Each word should be common kindergarten sight words.',
  },
  5: {
    label: 'Simple Sentences',
    description: 'Short sentences with common words',
    promptHint: 'Use short, simple sentences with common words. 2-3 sentences max. Use words like: the, is, at, it, in, on, can, up, go, see, and, my, we, he, she, a, to. Keep sentences under 6 words each.',
  },
  6: {
    label: 'Short Stories',
    description: 'Short paragraphs with a simple story',
    promptHint: 'Write a short 3-4 sentence story using simple vocabulary. Include some sight words and simple phonetic words. Sentences can be up to 8 words. Use a simple narrative structure (beginning, something happens).',
  },
  7: {
    label: 'Story Reader',
    description: 'Multi-sentence passages with varied vocabulary',
    promptHint: 'Write a 4-6 sentence passage with a clear story arc. Use varied but still simple vocabulary. Include some compound sentences. Can include words with blends (sl, cr, st) and digraphs (sh, ch, th). Include basic punctuation variety (periods, question marks, exclamation points).',
  },
};

// XP rewards
export const XP_REWARDS = {
  LESSON_BASE: 10,
  STAR_BONUS: 5, // per star
  COMPREHENSION_BONUS: 15,
  PERFECT_READING: 25,
  STREAK_BONUS: 10,
};

// Level thresholds and names
export const LEVELS = [
  { level: 1, xp: 0,    name: 'Beginner Reader',     emoji: '🌱' },
  { level: 2, xp: 100,  name: 'Word Explorer',        emoji: '🔍' },
  { level: 3, xp: 250,  name: 'Story Starter',        emoji: '📖' },
  { level: 4, xp: 500,  name: 'Page Turner',          emoji: '📚' },
  { level: 5, xp: 800,  name: 'Reading Star',         emoji: '⭐' },
  { level: 6, xp: 1200, name: 'Book Champion',        emoji: '🏆' },
  { level: 7, xp: 1700, name: 'Super Reader',         emoji: '🦸' },
  { level: 8, xp: 2400, name: 'Word Wizard',          emoji: '🧙' },
  { level: 9, xp: 3200, name: 'Reading Legend',        emoji: '👑' },
  { level: 10, xp: 4200, name: 'Master of Stories',    emoji: '🌟' },
];

// Badge definitions
export const BADGES = {
  first_read:    { name: 'First Story!',     emoji: '📖', description: 'Complete your first reading' },
  five_star:     { name: 'Five Star!',       emoji: '⭐', description: 'Get a perfect 5-star reading' },
  streak_3:     { name: '3-Day Streak!',    emoji: '🔥', description: 'Read 3 days in a row' },
  streak_7:     { name: 'Week Warrior!',    emoji: '💪', description: 'Read 7 days in a row' },
  ten_lessons:  { name: 'Bookworm!',        emoji: '📚', description: 'Complete 10 readings' },
  twenty_five:  { name: 'Library Card!',    emoji: '🏛️', description: 'Complete 25 readings' },
  level_5:      { name: 'Reading Star!',    emoji: '🌟', description: 'Reach level 5' },
  perfect_week: { name: 'Perfect Week!',    emoji: '🏆', description: '7 readings with 4+ stars' },
  quiz_master:  { name: 'Quiz Master!',     emoji: '🧠', description: 'Answer 10 questions correctly' },
  comeback:     { name: 'Comeback Kid!',    emoji: '💫', description: 'Improve your score 3 times in a row' },
};

// Theme colors for profiles
export const AVATAR_COLORS = [
  '#FFB347', '#FF8A80', '#CE93D8', '#80CBC4',
  '#6EC6FF', '#FFD93D', '#A5D6A7', '#F48FB1',
];

// Get level info from XP
export function getLevelFromXP(xp) {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (xp >= level.xp) {
      current = level;
    } else {
      break;
    }
  }
  return current;
}

// Get XP progress to next level
export function getXPProgress(xp) {
  const current = getLevelFromXP(xp);
  const currentIndex = LEVELS.findIndex(l => l.level === current.level);
  const next = LEVELS[currentIndex + 1];

  if (!next) {
    return { current, next: null, progress: 1, xpInLevel: 0, xpNeeded: 0 };
  }

  const xpInLevel = xp - current.xp;
  const xpNeeded = next.xp - current.xp;
  const progress = xpInLevel / xpNeeded;

  return { current, next, progress, xpInLevel, xpNeeded };
}
