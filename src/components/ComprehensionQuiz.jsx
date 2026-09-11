import { useState, useEffect } from 'react';
import { speak } from '../services/speechService';

export default function ComprehensionQuiz({ questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [hasSpoken, setHasSpoken] = useState(false);

  const question = questions?.[currentIndex];

  // Speak the question aloud
  useEffect(() => {
    if (question && !hasSpoken) {
      setHasSpoken(true);
      speak(question.question);
    }
  }, [currentIndex, question, hasSpoken]);

  useEffect(() => {
    setHasSpoken(false);
  }, [currentIndex]);

  if (!questions || questions.length === 0) return null;

  const handleAnswer = async (optionIndex) => {
    if (showResult) return;
    setSelectedAnswer(optionIndex);
    setShowResult(true);

    const isCorrect = optionIndex === question.correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
      await speak(question.explanation || "That's right! Great job!");
    } else {
      const correctAnswer = question.options[question.correctIndex];
      await speak(`Not quite! The answer is: ${correctAnswer}. ${question.explanation || ''}`);
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      onComplete?.(correctCount);
    }
  };

  // At the end
  if (currentIndex >= questions.length) {
    return null;
  }

  return (
    <div className="card no-hover animate-fadeIn" style={{ marginTop: 'var(--space-lg)' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: 'var(--space-md)',
      }}>
        <span className="badge">
          Question {currentIndex + 1} of {questions.length}
        </span>
        <span className="badge">
          ✅ {correctCount} correct
        </span>
      </div>

      <h4 style={{
        marginBottom: 'var(--space-lg)',
        color: 'var(--text-primary)',
        fontSize: 'var(--font-size-xl)',
      }}>
        {question.question}
      </h4>

      <div className="flex-col gap-sm stagger-children">
        {question.options.map((option, index) => {
          let className = 'quiz-option';
          if (showResult) {
            if (index === question.correctIndex) className += ' correct';
            else if (index === selectedAnswer) className += ' incorrect';
          } else if (index === selectedAnswer) {
            className += ' selected';
          }

          return (
            <button
              key={index}
              className={className}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              id={`quiz-option-${currentIndex}-${index}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div style={{ marginTop: 'var(--space-lg)', textAlign: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleNext}
            id="quiz-next-btn"
          >
            {currentIndex + 1 < questions.length ? 'Next Question →' : 'All Done! 🎉'}
          </button>
        </div>
      )}
    </div>
  );
}
