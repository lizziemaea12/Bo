import { useState, useEffect, useCallback } from 'react';

const CONFETTI_COLORS = ['#FFD93D', '#FF8A80', '#6EC6FF', '#CE93D8', '#66BB6A', '#FFB347', '#80CBC4'];

function Confetti() {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      delay: Math.random() * 1,
      rotation: Math.random() * 360,
      size: 6 + Math.random() * 8,
    }));
    setPieces(newPieces);
  }, []);

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: '-10px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotation}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

export default function ScoreDisplay({ stars, accuracy, wordsCorrect, wordsTotal, show }) {
  const [revealedStars, setRevealedStars] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (!show) {
      setRevealedStars(0);
      setShowConfetti(false);
      return;
    }

    // Reveal stars one by one
    let count = 0;
    const interval = setInterval(() => {
      count++;
      setRevealedStars(count);
      if (count >= stars) {
        clearInterval(interval);
        if (stars >= 4) {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 3500);
        }
      }
    }, 400);

    return () => clearInterval(interval);
  }, [show, stars]);

  if (!show) return null;

  return (
    <div className="flex-col flex-center gap-lg animate-fadeIn" style={{ margin: 'var(--space-xl) 0' }}>
      {showConfetti && <Confetti />}

      <div className="stars-container">
        {[1, 2, 3, 4, 5].map(i => (
          <span
            key={i}
            className={`star ${i <= revealedStars ? 'filled' : 'empty'}`}
            style={{
              animationDelay: `${(i - 1) * 0.3}s`,
            }}
          >
            ★
          </span>
        ))}
      </div>

      <div style={{
        fontSize: 'var(--font-size-lg)',
        fontWeight: 700,
        color: 'var(--text-secondary)',
      }}>
        {wordsCorrect} / {wordsTotal} words • {Math.round(accuracy)}% accuracy
      </div>
    </div>
  );
}
