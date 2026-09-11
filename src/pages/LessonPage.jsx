import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import BoAvatar from '../components/BoAvatar';
import BoChatBubble from '../components/BoChatBubble';
import ReadingArea from '../components/ReadingArea';
import RecordButton from '../components/RecordButton';
import ScoreDisplay from '../components/ScoreDisplay';
import ComprehensionQuiz from '../components/ComprehensionQuiz';
import { generatePassage, assessReading, generateQuestions, isGeminiConfigured } from '../services/geminiService';
import { startListening, stopListening, stopSpeaking } from '../services/speechService';
import { createSession, updateProfile, getRecentSessions, checkAndAwardBadges, updateStreak } from '../services/supabaseService';
import { calculateStars, calculateXP } from '../utils/scoring';

export default function LessonPage() {
  const { currentProfile, addSession, addBadges, refreshProfile } = useApp();
  const navigate = useNavigate();

  // Redirect if no profile selected
  useEffect(() => {
    if (!currentProfile) {
      navigate('/');
    }
  }, [currentProfile, navigate]);

  // States
  const [step, setStep] = useState('loading'); // 'loading' | 'intro' | 'reading' | 'assessing' | 'score' | 'quiz' | 'completed'
  const [passage, setPassage] = useState('');
  const [boText, setBoText] = useState('');
  const [boExpression, setBoExpression] = useState('happy');
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [highlightedWords, setHighlightedWords] = useState([]);
  const [wordStatuses, setWordStatuses] = useState({});
  const [assessment, setAssessment] = useState(null);
  const [stars, setStars] = useState(0);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [earnedXP, setEarnedXP] = useState(0);
  const [earnedBadges, setEarnedBadges] = useState([]);



  const [micError, setMicError] = useState(null);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState('');

  const recognitionRef = useRef(null);

  // Load new passage
  const loadPassage = async () => {
    if (!currentProfile) return;
    setStep('loading');
    setBoExpression('thinking');
    setBoText('Bo is making a brand new story just for you...');
    setMicError(null);
    setShowManualInput(false);
    setManualText('');
    setQuizQuestions([]);
    
    try {
      const recent = await getRecentSessions(currentProfile.id, 3);
      const generated = await generatePassage(currentProfile.reading_level || 2, recent);
      setPassage(generated);
      
      setBoExpression('happy');
      setBoText(`Are you ready? Let's read this story:`);
      setStep('intro');
    } catch (e) {
      console.error(e);
      setBoText('Oh no, Bo had a tiny hiccup. Let\'s try again!');
    }
  };

  useEffect(() => {
    if (currentProfile) {
      loadPassage();
    }
    return () => {
      stopSpeaking();
      void stopListening();
    };
  }, [currentProfile?.id]);

  const handleStartReading = () => {
    stopSpeaking();

    setBoText('I am listening! Read the story out loud to me.');
    setBoExpression('encouraging');
    setStep('reading');
    setIsRecording(true);
    setTranscript('');
    setHighlightedWords([]);
    setWordStatuses({});
    setMicError(null);

    const words = passage.toLowerCase().split(/\s+/).map(w => w.replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ''));

    const session = startListening({
      onInterimResult: (text) => {
        setTranscript(text);
        // Basic match highlighting
        const spokenWords = text.toLowerCase().split(/\s+/);
        const highlighted = [];
        spokenWords.forEach(sWord => {
          const idx = words.indexOf(sWord);
          if (idx !== -1 && !highlighted.includes(idx)) {
            highlighted.push(idx);
          }
        });
        setHighlightedWords(highlighted);
      },
      onFinalResult: (text) => {
        setTranscript(text);
      },
      onError: (err) => {
        console.error('Speech recognition error:', err);
        let readableError = 'Microphone error.';
        if (err === 'not-allowed') {
          readableError = 'Microphone permission blocked! Please allow microphone access in your browser settings.';
        } else if (err === 'no-speech') {
          readableError = 'No speech detected. Try speaking closer to the microphone.';
        } else if (err === 'network') {
          readableError = 'Speech recognition needs an internet connection. Please check your network and try again.';
        } else if (err === 'audio-capture') {
          readableError = 'No microphone found. Please plug in a mic or check your device settings.';
        } else if (err === 'service-not-allowed') {
          readableError = 'Speech recognition is not available. Please use Chrome or Edge on desktop.';
        } else {
          readableError = `Speech error: ${err}. Please make sure your mic is plugged in.`;
        }
        setMicError(readableError);
        setIsRecording(false);
      }
    });

    if (!session) {
      setIsRecording(false);
      setStep('intro');
      return;
    }

    recognitionRef.current = session;
  };

  const handleStopReading = async (forcedTranscript = null) => {
    setIsRecording(false);
    setStep('assessing');
    setBoText('Bo is thinking about how wonderful your reading was...');
    setBoExpression('thinking');

    const refTranscript = recognitionRef.current?.getTranscript?.() || '';
    const { transcript: stoppedTranscript, audioBlob } = await stopListening();
    recognitionRef.current = null;

    const finalTranscript = forcedTranscript !== null
      ? forcedTranscript
      : (showManualInput ? manualText : (stoppedTranscript || refTranscript || transcript || ''));

    const hasCapture = finalTranscript.trim().length > 0 || (audioBlob && audioBlob.size > 500);
    if (!hasCapture && forcedTranscript === null) {
      setMicError('No speech was captured. Please use Chrome or Edge, allow microphone access, and try again.');
      setBoText('I could not hear you. Let\'s try again!');
      setBoExpression('encouraging');
      setStep('intro');
      return;
    }

    try {
      const result = await assessReading(passage, finalTranscript, audioBlob);
      setAssessment(result);
      
      const calculatedStars = calculateStars(result.accuracy);
      setStars(calculatedStars);

      // Color the words based on struggling words
      const words = passage.split(/\s+/);
      const statuses = {};
      const lowerStruggles = (result.wordsStruggled || []).map(w => w.toLowerCase());
      words.forEach((w, idx) => {
        const clean = w.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
        if (lowerStruggles.includes(clean)) {
          statuses[idx] = 'incorrect';
        } else if (highlightedWords.includes(idx) || !lowerStruggles.includes(clean) || forcedTranscript !== null) {
          // If Gemini says we didn't struggle with it, color it correct
          statuses[idx] = 'correct';
        }
      });
      setWordStatuses(statuses);

      // Save session
      const calculatedXP = calculateXP(calculatedStars, 0, currentProfile.streak_days);
      const session = await createSession({
        profile_id: currentProfile.id,
        passage_text: passage,
        passage_level: currentProfile.reading_level || 2,
        transcript: finalTranscript,
        star_rating: calculatedStars,
        accuracy_score: result.accuracy,
        ai_feedback: result.feedback,
        ai_summary: result.parentSummary,
        words_correct: result.wordsCorrect,
        words_total: result.wordsTotal,
        xp_earned: calculatedXP,
        words_struggled: JSON.stringify(result.wordsStruggled || []),
      });

      addSession(session);
      setEarnedXP(calculatedXP);

      // Update level and streak
      const newXP = (currentProfile.total_xp || 0) + calculatedXP;
      const streak = await updateStreak(currentProfile.id);
      
      // Determine adaptive difficulty update
      let newLevel = currentProfile.reading_level || 2;
      if (calculatedStars === 5) {
        newLevel = Math.min(4, newLevel + 1); // dynamic level adjust
      } else if (calculatedStars <= 2) {
        newLevel = Math.max(1, newLevel - 1);
      }

      await updateProfile(currentProfile.id, {
        total_xp: newXP,
        reading_level: newLevel,
      });

      // Badges
      const badgeStats = {
        totalSessions: 1, // trigger checks
        lastStarRating: calculatedStars,
        streakDays: streak,
        currentLevel: Math.floor(newXP / 100) + 1,
      };
      const badgesEarnedNow = await checkAndAwardBadges(currentProfile.id, badgeStats);
      if (badgesEarnedNow.length > 0) {
        addBadges(badgesEarnedNow);
        setEarnedBadges(badgesEarnedNow);
      }

      await refreshProfile();

      setBoText(result.feedback);
      setBoExpression(calculatedStars >= 4 ? 'excited' : 'happy');
      setStep('score');
    } catch (e) {
      console.error(e);
      setBoText('We had a small problem scoring. Let\'s try again!');
      setStep('intro');
    }
  };

  const handleNextStep = async () => {
    if (stars >= 3) {
      setStep('loading');
      setBoText('Let\'s answer a couple of fun questions!');
      setBoExpression('thinking');
      try {
        const quiz = await generateQuestions(passage);
        setQuizQuestions(quiz.questions || []);
        setStep('quiz');
      } catch (e) {
        console.error(e);
        handleQuizComplete(0);
      }
    } else {
      setStep('completed');
    }
  };

  const handleQuizComplete = async (correctCount) => {
    setStep('completed');
    setBoExpression('cheering');
    let message = `You did a fantastic job! You earned ${earnedXP} stars of XP!`;
    if (correctCount > 0) {
      message += ` And you got the questions right! You are a super reader!`;
    }
    setBoText(message);
  };

  const handleManualBypass = () => {
    setManualText(passage);
    setShowManualInput(true);
  };

  const handleSimulateSpeech = () => {
    void stopListening();
    setIsRecording(true);
    setTranscript('');
    setHighlightedWords([]);
    
    const words = passage.split(/\s+/);
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      if (currentIdx < words.length) {
        setHighlightedWords(prev => [...prev, currentIdx]);
        setTranscript(prev => (prev + ' ' + words[currentIdx]).trim());
        currentIdx++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          handleStopReading(words.join(' '));
        }, 500);
      }
    }, 400);
  };

  if (!currentProfile) return null;

  return (
    <div className="page-container flex-col flex-center" style={{ minHeight: '85vh' }}>
      <div className="flex-col flex-center gap-md text-center" style={{ width: '100%', maxWidth: '650px' }}>
        <BoAvatar expression={boExpression} size={150} />
        <BoChatBubble
          text={boText}
          speakAloud={step !== 'reading' && step !== 'assessing'}
        />

        {step === 'loading' && <div className="spinner" style={{ marginTop: '2rem' }} />}

        {(step === 'intro' || step === 'reading' || step === 'assessing') && (
          <>
            <ReadingArea
              passage={passage}
              highlightedWords={showManualInput ? passage.split(/\s+/).map((_, i) => i) : highlightedWords}
              wordStatuses={wordStatuses}
            />
            
            {micError && (
              <div style={{
                background: 'rgba(255, 138, 128, 0.15)',
                color: 'var(--color-coral)',
                padding: 'var(--space-md)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                marginTop: 'var(--space-md)',
                width: '100%'
              }}>
                ⚠️ {micError}
              </div>
            )}

            {step === 'intro' && (
              <div className="flex-center gap-md" style={{ marginTop: '2rem', flexWrap: 'wrap', flexDirection: 'column' }}>
                {!isGeminiConfigured() && (
                  <div style={{
                    background: 'rgba(255, 217, 61, 0.15)',
                    color: 'var(--color-sun)',
                    padding: 'var(--space-sm) var(--space-md)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    width: '100%',
                  }}>
                    AI scoring needs a valid Gemini API key in `.env` (VITE_GEMINI_API_KEY). Local word matching is used as a fallback.
                  </div>
                )}
                <div className="flex-center gap-md" style={{ flexWrap: 'wrap' }}>
                <button className="btn btn-primary btn-lg" onClick={handleStartReading}>
                  🎤 Read to Bo!
                </button>
                <button className="btn btn-ghost" onClick={handleManualBypass}>
                  ⌨️ I don't have a mic / Type reading
                </button>
                </div>
              </div>
            )}

            {step === 'reading' && (
              <div className="flex-col flex-center gap-md" style={{ width: '100%' }}>
                {showManualInput ? (
                  <div className="flex-col gap-sm" style={{ width: '100%', marginTop: 'var(--space-md)' }}>
                    <textarea
                      className="input-field"
                      rows={3}
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="Type the words you read here..."
                    />
                    <button className="btn btn-success" onClick={() => handleStopReading()}>
                      Submit Reading! ✅
                    </button>
                  </div>
                ) : (
                  <>
                    <RecordButton isRecording={isRecording} onClick={() => handleStopReading()} />
                    {transcript && (
                      <div style={{
                        marginTop: 'var(--space-md)',
                        fontStyle: 'italic',
                        color: 'var(--color-sky)',
                        background: 'rgba(110, 198, 255, 0.08)',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-md)',
                        border: '1px dashed var(--border-accent)'
                      }}>
                        Bo heard: "{transcript}"
                      </div>
                    )}
                    <div className="flex-center gap-sm" style={{ marginTop: 'var(--space-md)', flexWrap: 'wrap' }}>
                      <button className="btn btn-ghost btn-sm" onClick={handleSimulateSpeech}>
                        🤖 Simulate Reading (Demo)
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { void stopListening(); setShowManualInput(true); setManualText(transcript || passage); }}>
                        Switch to manual typing fallback
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {step === 'score' && (
          <div className="animate-fadeIn flex-col flex-center">
            <ScoreDisplay
              show={true}
              stars={stars}
              accuracy={assessment?.accuracy || 0}
              wordsCorrect={assessment?.wordsCorrect || 0}
              wordsTotal={assessment?.wordsTotal || 0}
            />
            <button className="btn btn-success btn-lg" onClick={handleNextStep} style={{ marginTop: '1.5rem' }}>
              {stars >= 3 ? 'Play Question Game! 🎮' : 'Finished! 🎉'}
            </button>
          </div>
        )}

        {step === 'quiz' && (
          <ComprehensionQuiz
            key={passage}
            questions={quizQuestions}
            onComplete={handleQuizComplete}
          />
        )}

        {step === 'completed' && (
          <div className="animate-fadeIn flex-col flex-center gap-md" style={{ marginTop: '1.5rem' }}>
            <h3 style={{ color: 'var(--color-sun)' }}>Wonderful Job!</h3>
            {earnedBadges.map(b => (
              <div key={b.id} className="badge badge-new">
                Earned Badge: {b.badge_name}! 🎉
              </div>
            ))}
            <div className="flex-center gap-md" style={{ marginTop: '1rem' }}>
              <button className="btn btn-primary btn-lg" onClick={loadPassage}>
                Read Another Book! 📖
              </button>
              <button className="btn btn-ghost btn-lg" onClick={() => navigate('/rewards')}>
                View My Trophies 🏆
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
