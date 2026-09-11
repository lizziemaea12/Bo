import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getProfiles,
  createProfile,
  updateProfile,
  getSessionsForProfile,
  getBadgesForProfile,
} from '../services/supabaseService';
import { getLevelFromXP, getXPProgress } from '../utils/constants';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [profiles, setProfiles] = useState([]);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isParentMode, setIsParentMode] = useState(false);

  // Load profiles on mount
  useEffect(() => {
    loadProfiles();
  }, []);

  // Load sessions and badges when profile changes
  useEffect(() => {
    if (currentProfile) {
      loadProfileData(currentProfile.id);
    }
  }, [currentProfile?.id]);

  const loadProfiles = async () => {
    setLoading(true);
    const data = await getProfiles();
    setProfiles(data);
    setLoading(false);
  };

  const loadProfileData = async (profileId) => {
    const [sessionsData, badgesData] = await Promise.all([
      getSessionsForProfile(profileId),
      getBadgesForProfile(profileId),
    ]);
    setSessions(sessionsData);
    setBadges(badgesData);
  };

  const selectProfile = useCallback((profile) => {
    setCurrentProfile(profile);
    setIsParentMode(false);
  }, []);

  const addProfile = async (profileData) => {
    const profile = await createProfile(profileData);
    if (profile) {
      setProfiles(prev => [...prev, profile]);
      setCurrentProfile(profile);
    }
    return profile;
  };

  const refreshProfile = async () => {
    if (!currentProfile) return;
    const profiles = await getProfiles();
    const updated = profiles.find(p => p.id === currentProfile.id);
    if (updated) {
      setCurrentProfile(updated);
      setProfiles(profiles);
    }
    await loadProfileData(currentProfile.id);
  };

  const addSession = (session) => {
    setSessions(prev => [session, ...prev]);
  };

  const addBadges = (newBadges) => {
    setBadges(prev => [...newBadges, ...prev]);
  };

  const enterParentMode = () => setIsParentMode(true);
  const exitParentMode = () => setIsParentMode(false);

  // Derived state
  const levelInfo = currentProfile
    ? getLevelFromXP(currentProfile.total_xp || 0)
    : null;

  const xpProgress = currentProfile
    ? getXPProgress(currentProfile.total_xp || 0)
    : null;

  const value = {
    // State
    profiles,
    currentProfile,
    sessions,
    badges,
    loading,
    isParentMode,
    levelInfo,
    xpProgress,

    // Actions
    loadProfiles,
    selectProfile,
    addProfile,
    refreshProfile,
    addSession,
    addBadges,
    enterParentMode,
    exitParentMode,
    setCurrentProfile,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
