import { BADGES } from '../utils/constants';

export default function RewardBadge({ badge, isNew = false, size = 'normal' }) {
  const badgeInfo = BADGES[badge.badge_type] || { emoji: '🎖️', name: badge.badge_name, description: '' };

  const sizeStyles = size === 'large' ? {
    fontSize: 'var(--font-size-4xl)',
    padding: 'var(--space-xl)',
  } : {
    fontSize: 'var(--font-size-2xl)',
    padding: 'var(--space-md)',
  };

  return (
    <div
      className={`card flex-center flex-col gap-sm ${isNew ? 'badge-new' : ''}`}
      style={{
        ...sizeStyles,
        textAlign: 'center',
        animation: isNew ? 'badgePop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
      }}
    >
      <span style={{ fontSize: size === 'large' ? '3rem' : '2rem', lineHeight: 1 }}>
        {badgeInfo.emoji}
      </span>
      <span style={{
        fontSize: 'var(--font-size-sm)',
        fontWeight: 800,
        color: 'var(--text-primary)',
      }}>
        {badgeInfo.name}
      </span>
      {size === 'large' && (
        <span style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-muted)',
        }}>
          {badgeInfo.description}
        </span>
      )}
    </div>
  );
}
