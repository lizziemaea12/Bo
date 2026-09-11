export default function ProgressBar({ progress, label, sublabel, showPercentage = true }) {
  const clampedProgress = Math.min(1, Math.max(0, progress || 0));

  return (
    <div style={{ width: '100%' }}>
      {(label || sublabel) && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 'var(--space-xs)',
        }}>
          {label && (
            <span style={{ fontSize: 'var(--font-size-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {label}
            </span>
          )}
          {sublabel && (
            <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-muted)' }}>
              {sublabel}
            </span>
          )}
        </div>
      )}
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{ width: `${clampedProgress * 100}%` }}
        />
      </div>
    </div>
  );
}
