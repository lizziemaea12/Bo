import { AGE_DIFFICULTY_MAP } from '../utils/constants';

export default function AgeSlider({ value, onChange, showLabels = true }) {
  const ages = Object.keys(AGE_DIFFICULTY_MAP).map(Number);
  const min = Math.min(...ages);
  const max = Math.max(...ages);
  const difficulty = AGE_DIFFICULTY_MAP[value] || AGE_DIFFICULTY_MAP[5];

  return (
    <div className="age-slider-container">
      <div className="age-slider-value">
        Age {value}
      </div>

      <input
        type="range"
        className="age-slider"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        id="age-slider"
        aria-label="Select child's age"
      />

      {showLabels && (
        <div className="age-slider-labels">
          <span>Age {min}</span>
          <span>Age {max}</span>
        </div>
      )}

      <div style={{
        textAlign: 'center',
        marginTop: 'var(--space-md)',
        padding: 'var(--space-md)',
        background: 'var(--bg-glass-light)',
        borderRadius: 'var(--radius-md)',
      }}>
        <div style={{
          fontSize: 'var(--font-size-lg)',
          fontWeight: 800,
          color: 'var(--text-accent)',
        }}>
          {difficulty.label}
        </div>
        <div style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-muted)',
          marginTop: 'var(--space-xs)',
        }}>
          {difficulty.description}
        </div>
      </div>
    </div>
  );
}
