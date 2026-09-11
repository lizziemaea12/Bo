import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabase = null;

try {
  if (supabaseUrl && supabaseUrl.startsWith('http') && supabaseKey && supabaseKey !== 'your_supabase_anon_key_here') {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase credentials not configured. Using localStorage demo mode.');
  }
} catch (e) {
  console.error('Failed to initialize Supabase:', e);
}

export { supabase };

// Helper to get/set localStorage items for fallback
const getLocal = (key) => JSON.parse(localStorage.getItem(`bo_${key}`) || '[]');
const setLocal = (key, val) => localStorage.setItem(`bo_${key}`, JSON.stringify(val));

// ──── Profile operations ────

export async function getProfiles() {
  if (!supabase) {
    return getLocal('profiles');
  }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) { console.error('getProfiles:', error); return []; }
  return data || [];
}

export async function createProfile({ name, avatarColor, initialAge }) {
  const newProfile = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    name,
    avatar_color: avatarColor,
    initial_age_setting: initialAge,
    reading_level: initialAge <= 4 ? 1 : initialAge <= 5 ? 2 : initialAge <= 6 ? 3 : 4,
    parent_pin: '1234',
    total_xp: 0,
    current_level: 1,
    streak_days: 0,
    created_at: new Date().toISOString(),
  };

  if (!supabase) {
    const profiles = getLocal('profiles');
    profiles.push(newProfile);
    setLocal('profiles', profiles);
    return newProfile;
  }
  
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      name,
      avatar_color: avatarColor,
      initial_age_setting: initialAge,
      reading_level: newProfile.reading_level,
      parent_pin: '1234',
    })
    .select()
    .single();
  if (error) { console.error('createProfile:', error); return null; }
  return data;
}

export async function updateProfile(id, updates) {
  if (!supabase) {
    const profiles = getLocal('profiles');
    const idx = profiles.findIndex(p => p.id === id);
    if (idx !== -1) {
      profiles[idx] = { ...profiles[idx], ...updates };
      setLocal('profiles', profiles);
      return profiles[idx];
    }
    return null;
  }
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) { console.error('updateProfile:', error); return null; }
  return data;
}

// ──── Session operations ────

export async function createSession(sessionData) {
  const newSession = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    created_at: new Date().toISOString(),
    ...sessionData,
  };

  if (!supabase) {
    const sessions = getLocal('sessions');
    sessions.push(newSession);
    setLocal('sessions', sessions);
    return newSession;
  }
  const { data, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();
  if (error) { console.error('createSession:', error); return null; }
  return data;
}

export async function getSessionsForProfile(profileId, limit = 50) {
  if (!supabase) {
    const sessions = getLocal('sessions');
    return sessions
      .filter(s => s.profile_id === profileId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, limit);
  }
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) { console.error('getSessions:', error); return []; }
  return data || [];
}

export async function getRecentSessions(profileId, count = 3) {
  if (!supabase) {
    const sessions = getLocal('sessions');
    return sessions
      .filter(s => s.profile_id === profileId)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, count);
  }
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .limit(count);
  if (error) { console.error('getRecentSessions:', error); return []; }
  return data || [];
}

// ──── Badge operations ────

export async function getBadgesForProfile(profileId) {
  if (!supabase) {
    const badges = getLocal('badges');
    return badges.filter(b => b.profile_id === profileId);
  }
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('profile_id', profileId)
    .order('earned_at', { ascending: false });
  if (error) { console.error('getBadges:', error); return []; }
  return data || [];
}

export async function awardBadge(profileId, badgeType, badgeName) {
  const newBadge = {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    profile_id: profileId,
    badge_type: badgeType,
    badge_name: badgeName,
    earned_at: new Date().toISOString(),
  };

  if (!supabase) {
    const badges = getLocal('badges');
    const exists = badges.some(b => b.profile_id === profileId && b.badge_type === badgeType);
    if (!exists) {
      badges.push(newBadge);
      setLocal('badges', badges);
      return newBadge;
    }
    return null;
  }
  const { data, error } = await supabase
    .from('badges')
    .upsert(
      { profile_id: profileId, badge_type: badgeType, badge_name: badgeName },
      { onConflict: 'profile_id,badge_type' }
    )
    .select()
    .single();
  if (error && error.code !== '23505') { // ignore duplicate
    console.error('awardBadge:', error);
    return null;
  }
  return data;
}

// ──── Check and award badges based on stats ────

export async function checkAndAwardBadges(profileId, stats) {
  const newBadges = [];

  const checks = [
    { type: 'first_read', name: 'First Story! 📖', condition: stats.totalSessions >= 1 },
    { type: 'five_star', name: 'Five Star! ⭐', condition: stats.lastStarRating === 5 },
    { type: 'streak_3', name: '3-Day Streak! 🔥', condition: stats.streakDays >= 3 },
    { type: 'streak_7', name: 'Week Warrior! 💪', condition: stats.streakDays >= 7 },
    { type: 'ten_lessons', name: 'Bookworm! 📚', condition: stats.totalSessions >= 10 },
    { type: 'twenty_five', name: 'Library Card! 🏛️', condition: stats.totalSessions >= 25 },
    { type: 'level_5', name: 'Reading Star! 🌟', condition: stats.currentLevel >= 5 },
    { type: 'quiz_master', name: 'Quiz Master! 🧠', condition: stats.totalComprehensionCorrect >= 10 },
  ];

  const existing = await getBadgesForProfile(profileId);
  const existingTypes = new Set(existing.map(b => b.badge_type));

  for (const check of checks) {
    if (check.condition && !existingTypes.has(check.type)) {
      const badge = await awardBadge(profileId, check.type, check.name);
      if (badge) newBadges.push(badge);
    }
  }

  return newBadges;
}

// ──── Streak management ────

export async function updateStreak(profileId) {
  let profile;
  if (!supabase) {
    const profiles = getLocal('profiles');
    profile = profiles.find(p => p.id === profileId);
  } else {
    const { data } = await supabase
      .from('profiles')
      .select('streak_days, last_active')
      .eq('id', profileId)
      .single();
    profile = data;
  }

  if (!profile) return 0;

  const today = new Date().toISOString().split('T')[0];
  const lastActive = profile.last_active;

  let newStreak = profile.streak_days || 0;

  if (lastActive === today) {
    return newStreak;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  if (lastActive === yesterdayStr) {
    newStreak += 1;
  } else {
    newStreak = 1;
  }

  await updateProfile(profileId, {
    streak_days: newStreak,
    last_active: today,
  });

  return newStreak;
}

