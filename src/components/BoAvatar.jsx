import { useState, useEffect } from 'react';

const expressions = {
  happy: {
    mouthPath: 'M26 42 Q32 48 38 42',
    eyeScale: 1,
    bodyBounce: 'animate-gentle-bounce',
  },
  excited: {
    mouthPath: 'M24 40 Q32 52 40 40',
    eyeScale: 1.15,
    bodyBounce: 'animate-bounce',
  },
  thinking: {
    mouthPath: 'M28 44 Q32 42 36 44',
    eyeScale: 0.9,
    bodyBounce: '',
  },
  cheering: {
    mouthPath: 'M24 40 Q32 54 40 40',
    eyeScale: 1.2,
    bodyBounce: 'animate-bounce',
  },
  encouraging: {
    mouthPath: 'M26 42 Q32 47 38 42',
    eyeScale: 1.05,
    bodyBounce: 'animate-gentle-bounce',
  },
  waving: {
    mouthPath: 'M26 42 Q32 48 38 42',
    eyeScale: 1,
    bodyBounce: 'animate-wiggle',
  },
};

export default function BoAvatar({ expression = 'happy', size = 120, className = '' }) {
  const expr = expressions[expression] || expressions.happy;
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (expression === 'excited' || expression === 'cheering') {
      const newSparkles = Array.from({ length: 6 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 24,
        y: 5 + Math.random() * 20,
        delay: Math.random() * 0.5,
        size: 2 + Math.random() * 3,
      }));
      setSparkles(newSparkles);
    } else {
      setSparkles([]);
    }
  }, [expression]);

  return (
    <div
      className={`${expr.bodyBounce} ${className}`}
      style={{ display: 'inline-block', lineHeight: 0 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        {/* Sparkles for excited/cheering */}
        {sparkles.map(s => (
          <circle
            key={s.id}
            cx={s.x}
            cy={s.y}
            r={s.size}
            fill="#FFD93D"
            opacity="0.8"
            style={{
              animation: `starPop 1s ease ${s.delay}s infinite alternate`,
            }}
          />
        ))}

        {/* Body */}
        <ellipse cx="32" cy="52" rx="18" ry="12" fill="#C27D4A" />

        {/* Head */}
        <circle cx="32" cy="32" r="22" fill="#D4956B" />

        {/* Ears */}
        <circle cx="14" cy="14" r="9" fill="#D4956B" />
        <circle cx="14" cy="14" r="5.5" fill="#C27D4A" />
        <circle cx="50" cy="14" r="9" fill="#D4956B" />
        <circle cx="50" cy="14" r="5.5" fill="#C27D4A" />

        {/* Inner face */}
        <ellipse cx="32" cy="38" rx="13" ry="10" fill="#F0D5B8" />

        {/* Eyes */}
        <g transform={`scale(${expr.eyeScale})`} style={{ transformOrigin: '32px 28px' }}>
          <circle cx="23" cy="28" r="3.5" fill="#2D1B0E" />
          <circle cx="41" cy="28" r="3.5" fill="#2D1B0E" />
          {/* Eye shine */}
          <circle cx="24.5" cy="26.5" r="1.3" fill="white" />
          <circle cx="42.5" cy="26.5" r="1.3" fill="white" />
        </g>

        {/* Eyebrows for expressions */}
        {expression === 'thinking' && (
          <>
            <line x1="19" y1="22" x2="26" y2="23" stroke="#8B5E3B" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="38" y1="23" x2="45" y2="22" stroke="#8B5E3B" strokeWidth="1.5" strokeLinecap="round" />
          </>
        )}

        {/* Nose */}
        <ellipse cx="32" cy="35" rx="3.5" ry="2.5" fill="#2D1B0E" />
        <ellipse cx="31" cy="34.5" rx="1" ry="0.7" fill="#5C3A1E" opacity="0.4" />

        {/* Mouth */}
        <path
          d={expr.mouthPath}
          stroke="#2D1B0E"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          style={{ transition: 'all 0.3s ease' }}
        />

        {/* Blush */}
        <ellipse cx="17" cy="36" rx="4" ry="2.5" fill="#FFB5A7" opacity="0.4" />
        <ellipse cx="47" cy="36" rx="4" ry="2.5" fill="#FFB5A7" opacity="0.4" />

        {/* Waving arm */}
        {expression === 'waving' && (
          <g style={{ animation: 'wiggle 0.6s ease infinite', transformOrigin: '50px 50px' }}>
            <ellipse cx="54" cy="44" rx="5" ry="8" fill="#D4956B" transform="rotate(-30, 54, 44)" />
          </g>
        )}

        {/* Cheering arms */}
        {expression === 'cheering' && (
          <>
            <ellipse cx="10" cy="38" rx="5" ry="8" fill="#D4956B" transform="rotate(30, 10, 38)" />
            <ellipse cx="54" cy="38" rx="5" ry="8" fill="#D4956B" transform="rotate(-30, 54, 38)" />
          </>
        )}

        {/* Thinking paw */}
        {expression === 'thinking' && (
          <ellipse cx="44" cy="42" rx="5" ry="6" fill="#D4956B" transform="rotate(-15, 44, 42)" />
        )}
      </svg>
    </div>
  );
}
