import { NavLink, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Navbar() {
  const { currentProfile, isParentMode, exitParentMode, levelInfo, xpProgress } = useApp();
  const navigate = useNavigate();

  if (!currentProfile) return null;

  return (
    <nav className="navbar">
      <NavLink to="/lesson" className="navbar-brand" id="nav-home">
        <svg width="32" height="32" viewBox="0 0 64 64" className="bear-icon">
          <circle cx="32" cy="34" r="22" fill="#D4956B"/>
          <circle cx="14" cy="14" r="8" fill="#D4956B"/>
          <circle cx="14" cy="14" r="5" fill="#C27D4A"/>
          <circle cx="50" cy="14" r="8" fill="#D4956B"/>
          <circle cx="50" cy="14" r="5" fill="#C27D4A"/>
          <ellipse cx="32" cy="38" rx="12" ry="9" fill="#F0D5B8"/>
          <circle cx="24" cy="30" r="3" fill="#2D1B0E"/>
          <circle cx="40" cy="30" r="3" fill="#2D1B0E"/>
          <circle cx="25" cy="28.5" r="1.2" fill="white"/>
          <circle cx="41" cy="28.5" r="1.2" fill="white"/>
          <ellipse cx="32" cy="36" rx="3" ry="2" fill="#2D1B0E"/>
          <path d="M27 41 Q32 46 37 41" stroke="#2D1B0E" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        </svg>
        Bo
      </NavLink>

      <div className="navbar-links">
        {!isParentMode ? (
          <>
            {levelInfo && (
              <span className="badge" style={{ marginRight: 'var(--space-sm)' }}>
                {levelInfo.emoji} {levelInfo.name}
              </span>
            )}

            {currentProfile.streak_days > 0 && (
              <span className="badge" style={{ marginRight: 'var(--space-sm)' }}>
                🔥 {currentProfile.streak_days}
              </span>
            )}

            <NavLink
              to="/lesson"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-lesson"
            >
              📖 Read
            </NavLink>

            <NavLink
              to="/rewards"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-rewards"
            >
              🏆 Rewards
            </NavLink>

            <NavLink
              to="/parent"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              id="nav-parent"
            >
              👤 Parent
            </NavLink>
          </>
        ) : (
          <>
            <span className="badge" style={{ marginRight: 'var(--space-sm)' }}>
              Parent Mode
            </span>
            <button
              className="btn btn-sm btn-ghost"
              onClick={() => { exitParentMode(); navigate('/lesson'); }}
              id="exit-parent-mode"
            >
              ← Back to Reading
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
