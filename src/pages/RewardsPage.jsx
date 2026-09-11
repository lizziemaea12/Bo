import { useApp } from '../context/AppContext';
import RewardBadge from '../components/RewardBadge';
import ProgressBar from '../components/ProgressBar';
import { BADGES } from '../utils/constants';

export default function RewardsPage() {
  const { currentProfile, badges, xpProgress } = useApp();

  if (!currentProfile) return null;

  const earnedTypes = new Set(badges.map(b => b.badge_type));
  const allBadgeTypes = Object.keys(BADGES);

  return (
    <div className="page-container">
      <div className="flex-col flex-center gap-md text-center" style={{ marginBottom: 'var(--space-2xl)' }}>
        <h1 style={{ color: 'var(--color-sun)' }}>Your Trophy Case 🏆</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-lg)' }}>
          Keep reading to unlock all the badges!
        </p>
      </div>

      {xpProgress && (
        <div className="card no-hover" style={{ marginBottom: 'var(--space-2xl)' }}>
          <ProgressBar
            progress={xpProgress.progress}
            label={`Level ${xpProgress.current.level}: ${xpProgress.current.name} ${xpProgress.current.emoji}`}
            sublabel={`${xpProgress.xpInLevel} / ${xpProgress.xpNeeded} XP to Level ${xpProgress.next?.level || 10}`}
          />
        </div>
      )}

      <h3 style={{ marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-sm)' }}>
        My Badges ({badges.length} / {allBadgeTypes.length})
      </h3>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 'var(--space-md)',
      }}>
        {allBadgeTypes.map(type => {
          const isEarned = earnedTypes.has(type);
          const badgeData = BADGES[type];

          return (
            <div
              key={type}
              style={{
                opacity: isEarned ? 1 : 0.25,
                filter: isEarned ? 'none' : 'grayscale(80%)',
                transition: 'all 0.3s ease',
              }}
            >
              <RewardBadge
                badge={{ badge_type: type, badge_name: badgeData.name }}
                size="normal"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
