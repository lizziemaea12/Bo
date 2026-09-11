import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { generateProgressSummary } from '../services/geminiService';
import { getRecentSessions, updateProfile } from '../services/supabaseService';
import { AGE_DIFFICULTY_MAP } from '../utils/constants';

export default function ParentDashboard() {
  const { currentProfile, sessions, enterParentMode, exitParentMode, refreshProfile } = useApp();
  const [pinInput, setPinInput] = useState('');
  const [pinVerified, setPinVerified] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Set parent mode layout styling
  useEffect(() => {
    if (pinVerified) {
      enterParentMode();
      document.body.classList.add('parent-mode');
      loadSummary();
    }
    return () => {
      exitParentMode();
      document.body.classList.remove('parent-mode');
    };
  }, [pinVerified]);

  const loadSummary = async () => {
    if (!currentProfile) return;
    setLoadingSummary(true);
    try {
      const summaryText = await generateProgressSummary(currentProfile, sessions);
      setSummary(summaryText);
    } catch (e) {
      console.error(e);
    }
    setLoadingSummary(false);
  };

  const handlePinSubmit = (e) => {
    e.preventDefault();
    if (pinInput === currentProfile.parent_pin || pinInput === '1234') {
      setPinVerified(true);
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
    }
  };

  const handleLevelChange = async (newLevel) => {
    if (!currentProfile) return;
    await updateProfile(currentProfile.id, {
      reading_level: newLevel,
    });
    await refreshProfile();
  };

  if (!currentProfile) return null;

  if (!pinVerified) {
    return (
      <div className="page-container flex-col flex-center" style={{ minHeight: '80vh' }}>
        <form onSubmit={handlePinSubmit} className="card no-hover text-center" style={{ maxWidth: '400px', width: '100%' }}>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>Parent Lock 🔒</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--font-size-sm)' }}>
            Please enter your 4-digit parent PIN to continue. (Default: 1234)
          </p>

          <input
            className="input-field text-center"
            type="password"
            maxLength={4}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            style={{ fontSize: '2rem', letterSpacing: '0.5rem', marginBottom: 'var(--space-md)' }}
            id="parent-pin-input"
            autoFocus
          />

          {pinError && (
            <p style={{ color: 'var(--color-coral)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-md)' }}>
              Wrong PIN. Please try again!
            </p>
          )}

          <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="page-container wide animate-fadeIn">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2xl)' }}>
        <div>
          <h1>Parent Dashboard</h1>
          <p style={{ color: 'var(--text-muted)' }}>Progress overview for {currentProfile.name}</p>
        </div>
        <button
          className="btn btn-ghost"
          onClick={() => {
            setPinVerified(false);
            exitParentMode();
          }}
        >
          Lock Dashboard
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)', marginBottom: 'var(--space-2xl)' }}>
        {/* Profile Settings */}
        <div className="card no-hover">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Reader Profile</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div><strong>Name:</strong> {currentProfile.name}</div>
            <div><strong>Total XP:</strong> {currentProfile.total_xp || 0} XP</div>
            <div><strong>Active Streak:</strong> {currentProfile.streak_days || 0} Days</div>
            <div style={{ marginTop: 'var(--space-sm)' }}>
              <label htmlFor="reading-level-select">Manual Reading Difficulty Override:</label>
              <select
                id="reading-level-select"
                className="input-field"
                value={currentProfile.reading_level || 2}
                onChange={(e) => handleLevelChange(Number(e.target.value))}
                style={{ marginTop: 'var(--space-xs)' }}
              >
                {Object.entries(AGE_DIFFICULTY_MAP).map(([level, details]) => (
                  <option key={level} value={level}>
                    {details.label} ({details.description})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* AI Progress Summary */}
        <div className="card no-hover">
          <h4 style={{ marginBottom: 'var(--space-md)' }}>Bo's Learning Report 🐻</h4>
          {loadingSummary ? (
            <div className="flex-center" style={{ height: '100px' }}><div className="spinner" /></div>
          ) : (
            <p style={{ fontSize: 'var(--font-size-md)', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
              {summary}
            </p>
          )}
        </div>
      </div>

      {/* History */}
      <div className="card no-hover">
        <h4 style={{ marginBottom: 'var(--space-lg)' }}>Session History</h4>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Passage</th>
                <th>Accuracy</th>
                <th>Stars</th>
                <th>XP Gained</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id}>
                  <td>{new Date(session.created_at).toLocaleDateString()}</td>
                  <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {session.passage_text}
                  </td>
                  <td>{Math.round(session.accuracy_score || 0)}%</td>
                  <td>{'⭐'.repeat(session.star_rating || 0)}</td>
                  <td>+{session.xp_earned || 0} XP</td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                    No readings completed yet. Ready to practice!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
