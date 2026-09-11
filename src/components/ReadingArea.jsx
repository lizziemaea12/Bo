export default function ReadingArea({ passage, highlightedWords = [], wordStatuses = {} }) {
  if (!passage) return null;

  const words = passage.split(/\s+/);

  return (
    <div className="card no-hover" style={{ marginTop: 'var(--space-lg)' }}>
      <div className="reading-passage">
        {words.map((word, index) => {
          const isHighlighted = highlightedWords.includes(index);
          const status = wordStatuses[index]; // 'correct', 'incorrect', or undefined

          let className = 'reading-word';
          if (isHighlighted) className += ' highlighted';
          if (status === 'correct') className += ' correct';
          if (status === 'incorrect') className += ' incorrect';

          return (
            <span key={index} className={className}>
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
