import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BoAvatar from '../components/BoAvatar';
import BoChatBubble from '../components/BoChatBubble';
import AgeSlider from '../components/AgeSlider';
import { AVATAR_COLORS } from '../utils/constants';

export default function WelcomePage() {
  const { profiles, selectProfile, addProfile, loading } = useApp();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [age, setAge] = useState(5);
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]);
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  const handleSelectProfile = (profile) => {
    selectProfile(profile);
    navigate('/lesson');
  };

  const handleCreateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setCreating(true);
    const profile = await addProfile({
      name: name.trim(),
      avatarColor,
      initialAge: age,
    });

    if (profile) {
      navigate('/lesson');
    }
    setCreating(false);
  };

  if (loading) {
    return (
      <div className="page-container flex-center" style={{ minHeight: '80vh' }}>
        <div className="flex-col flex-center gap-lg">
          <BoAvatar expression="thinking" size={150} />
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex-col flex-center" style={{ minHeight: '90vh' }}>
      {/* Hero */}
      <div className="flex-col flex-center gap-lg text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
        <BoAvatar expression="waving" size={160} />
        <BoChatBubble
          text="Hi there! I'm Bo! 🐻 Let's read together!"
          speakAloud={profiles.length === 0}
        />
        <h1 style={{ fontSize: 'var(--font-size-4xl)', marginTop: 'var(--space-md)' }}>
          Welcome to <span style={{ color: 'var(--color-sun)' }}>Bo</span>
        </h1>
        <p style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--text-secondary)',
          maxWidth: '500px',
        }}>
          Your friendly reading buddy! Practice reading, earn stars, and have fun! ⭐
        </p>
      </div>

      {/* Existing profiles */}
      {profiles.length > 0 && !showCreateForm && (
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <h3 style={{
            textAlign: 'center',
            marginBottom: 'var(--space-lg)',
            color: 'var(--text-secondary)',
          }}>
            Who's reading today?
          </h3>

          <div className="flex-col gap-md stagger-children">
            {profiles.map(profile => (
              <button
                key={profile.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-lg)',
                  cursor: 'pointer',
                  border: 'none',
                  fontFamily: 'var(--font-family)',
                  textAlign: 'left',
                  width: '100%',
                }}
                onClick={() => handleSelectProfile(profile)}
                id={`profile-${profile.id}`}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: 'var(--radius-full)',
                  background: profile.avatar_color || '#FFB347',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-xl)',
                  fontWeight: 900,
                  color: 'white',
                  flexShrink: 0,
                }}>
                  {profile.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {profile.name}
                  </div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
                    ⭐ {profile.total_xp || 0} XP • 🔥 {profile.streak_days || 0} day streak
                  </div>
                </div>
                <span style={{ fontSize: 'var(--font-size-xl)', color: 'var(--text-muted)' }}>→</span>
              </button>
            ))}

            <button
              className="btn btn-ghost btn-lg"
              onClick={() => setShowCreateForm(true)}
              style={{ width: '100%', marginTop: 'var(--space-sm)' }}
              id="add-reader-btn"
            >
              ➕ Add a New Reader
            </button>
          </div>
        </div>
      )}

      {/* Create profile form */}
      {(showCreateForm || profiles.length === 0) && (
        <form
          onSubmit={handleCreateProfile}
          className="card no-hover animate-fadeIn"
          style={{ width: '100%', maxWidth: '500px' }}
        >
          <h3 style={{
            textAlign: 'center',
            marginBottom: 'var(--space-xl)',
            color: 'var(--text-primary)',
          }}>
            Let's get started! 🎉
          </h3>

          {/* Name */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label htmlFor="reader-name">What's your name?</label>
            <input
              id="reader-name"
              className="input-field"
              type="text"
              placeholder="Type your name here..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
          </div>

          {/* Avatar color */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label>Pick your color!</label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAvatarColor(color)}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: 'var(--radius-full)',
                    background: color,
                    border: avatarColor === color ? '3px solid var(--text-primary)' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    transform: avatarColor === color ? 'scale(1.15)' : 'scale(1)',
                  }}
                  aria-label={`Select color ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Age slider */}
          <div style={{ marginBottom: 'var(--space-xl)' }}>
            <label>How old are you?</label>
            <div className="flex-center" style={{ marginTop: 'var(--space-md)' }}>
              <AgeSlider value={age} onChange={setAge} />
            </div>
          </div>

          {/* Submit */}
          <div className="flex-col gap-sm">
            <button
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={!name.trim() || creating}
              style={{ width: '100%' }}
              id="create-profile-btn"
            >
              {creating ? 'Creating...' : "Let's Read! 📚"}
            </button>

            {profiles.length > 0 && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setShowCreateForm(false)}
                style={{ width: '100%' }}
              >
                ← Back to profiles
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
