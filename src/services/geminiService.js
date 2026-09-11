import { GoogleGenerativeAI } from '@google/generative-ai';
import { AGE_DIFFICULTY_MAP } from '../utils/constants';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
let genAI = null;
let model = null;

try {
  if (apiKey && apiKey !== 'your_gemini_api_key_here') {
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });
  } else {
    console.warn('Gemini API key not configured. Using local scoring fallback.');
  }
} catch (e) {
  console.error('Failed to initialize Gemini:', e);
}

export function isGeminiConfigured() {
  return !!model;
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// ──── Generate a reading passage ────

export async function generatePassage(readingLevel, recentSessions = []) {
  if (!model) {
    return getDemoPassage(readingLevel);
  }

  const difficulty = AGE_DIFFICULTY_MAP[readingLevel] || AGE_DIFFICULTY_MAP[5];

  // Build context from recent sessions to make it adaptive
  let adaptiveContext = '';
  if (recentSessions.length > 0) {
    const struggles = recentSessions
      .filter(s => s.words_struggled)
      .flatMap(s => JSON.parse(s.words_struggled || '[]'))
      .slice(0, 10);

    const recentAccuracies = recentSessions.slice(0, 3).map(s => s.accuracy_score);
    const avgAccuracy = recentAccuracies.reduce((a, b) => a + b, 0) / recentAccuracies.length;

    if (struggles.length > 0) {
      adaptiveContext += `\nThe student has recently struggled with these words: ${struggles.join(', ')}. Try to naturally include 1-2 of these words for practice, but don't make it feel forced.`;
    }

    if (avgAccuracy > 90) {
      adaptiveContext += `\nThe student has been doing very well (${Math.round(avgAccuracy)}% accuracy). Make this passage slightly more challenging — add a few longer words or more complex sentence structure while keeping it age-appropriate.`;
    } else if (avgAccuracy < 55) {
      adaptiveContext += `\nThe student has been struggling (${Math.round(avgAccuracy)}% accuracy). Make this passage simpler and shorter than usual. Use very familiar words and keep sentences very short.`;
    }
  }

  const prompt = `You are a kindergarten reading tutor creating a reading passage for a young child.

DIFFICULTY LEVEL: ${difficulty.label}
INSTRUCTIONS: ${difficulty.promptHint}
${adaptiveContext}

RULES:
- Generate ONLY the reading passage text, nothing else
- Do NOT include instructions, titles, headers, or explanations
- Make the story fun and engaging for a young child
- Use themes kids love: animals, nature, friends, adventures, colors, food
- Each passage should tell a tiny, complete story or scene
- Never use scary, violent, or inappropriate content
- Vary themes — don't repeat the same topic as recent passages

Generate the passage now:`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    // Clean up any accidental quotes or markdown
    return text.replace(/^["'`]+|["'`]+$/g, '').replace(/\*\*/g, '').trim();
  } catch (error) {
    console.error('generatePassage error:', error);
    return getDemoPassage(readingLevel);
  }
}

// ──── Assess the child's reading ────

function normalizeWord(word) {
  return word.toLowerCase().replace(/[^a-z']/g, '');
}

function scoreTranscriptLocally(originalPassage, transcript) {
  const rawWords = originalPassage.split(/\s+/);
  const passageWords = rawWords.map(normalizeWord).filter(Boolean);
  const spokenWords = transcript.split(/\s+/).map(normalizeWord).filter(Boolean);
  const wordsStruggled = [];
  let wordsCorrect = 0;

  passageWords.forEach((word, index) => {
    const spoken = spokenWords[index];
    if (spoken && (spoken === word || spoken.startsWith(word) || word.startsWith(spoken))) {
      wordsCorrect++;
    } else {
      wordsStruggled.push(rawWords[index]?.replace(/[^\w']/g, '') || word);
    }
  });

  const accuracy = passageWords.length
    ? Math.round((wordsCorrect / passageWords.length) * 100)
    : 0;

  return {
    accuracy,
    wordsCorrect,
    wordsTotal: passageWords.length,
    feedback: accuracy >= 80
      ? 'Wow, great reading! You did an amazing job!'
      : accuracy >= 50
        ? 'Good try! You read lots of words. Let\'s keep practicing together!'
        : 'Nice effort! Let\'s read it one more time together.',
    parentSummary: `Read ${accuracy}% of words correctly (${wordsCorrect}/${passageWords.length}).`,
    wordsStruggled,
    strengths: wordsCorrect > 0 ? ['Kept going through the passage'] : [],
    areasToImprove: wordsStruggled.length > 0 ? wordsStruggled.slice(0, 3) : ['Keep practicing'],
  };
}

function buildNoCaptureResult(originalPassage) {
  const wordsTotal = originalPassage.split(/\s+/).filter(Boolean).length;
  return {
    accuracy: 0,
    wordsCorrect: 0,
    wordsTotal,
    feedback: 'I could not hear you that time. Tap Read to Bo and try speaking louder!',
    parentSummary: 'No speech was captured. Use Chrome or Edge, allow microphone access, and check that a mic is connected.',
    wordsStruggled: [],
    strengths: [],
    areasToImprove: ['Speak closer to the microphone', 'Use Chrome or Edge browser'],
  };
}

export async function assessReading(originalPassage, transcript, audioBlob = null) {
  const cleanTranscript = (transcript || '').trim();
  const hasAudio = !!(audioBlob && audioBlob.size > 500);

  if (!cleanTranscript && !hasAudio) {
    return buildNoCaptureResult(originalPassage);
  }

  if (!model) {
    if (cleanTranscript) {
      return scoreTranscriptLocally(originalPassage, cleanTranscript);
    }
    return {
      ...buildNoCaptureResult(originalPassage),
      parentSummary: 'Audio was recorded but Gemini API is not configured. Add a valid VITE_GEMINI_API_KEY in .env to enable AI scoring from audio.',
    };
  }

  const parts = [];

  if (hasAudio) {
    const base64 = await blobToBase64(audioBlob);
    parts.push({
      inlineData: {
        mimeType: audioBlob.type || 'audio/webm',
        data: base64,
      },
    });
  }

  const prompt = `You are a patient, supportive kindergarten reading tutor assessing a child's reading.

ORIGINAL PASSAGE:
"${originalPassage}"

${cleanTranscript ? `BROWSER SPEECH-TO-TEXT TRANSCRIPT (may contain errors):
"${cleanTranscript}"` : 'No browser transcript was captured.'}

${hasAudio ? 'An audio recording of the child reading is attached. Listen to it and compare against the original passage.' : ''}

Analyze how well the child read the passage. Consider:
- Speech-to-text may have errors, so be generous with similar-sounding words
- Young children may pause, stutter, or repeat words — that's normal
- If audio is attached, trust the audio over the transcript when they disagree
- Focus on whether they got the meaning and most words right

Respond ONLY with valid JSON in this exact format:
{
  "accuracy": <number 0-100>,
  "wordsCorrect": <number>,
  "wordsTotal": <number of words in original passage>,
  "feedback": "<short, enthusiastic, encouraging feedback for the child — 1-2 sentences max, use simple words they can understand when read aloud>",
  "parentSummary": "<1-2 sentence summary for the parent about how the child did and what to work on>",
  "wordsStruggled": [<list of specific words the child missed or mispronounced>],
  "strengths": [<list of things the child did well>],
  "areasToImprove": [<list of specific skills to work on>]
}`;

  parts.push({ text: prompt });

  try {
    const result = await model.generateContent(parts);
    let text = result.response.text().trim();
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) text = jsonMatch[1].trim();
    return JSON.parse(text);
  } catch (error) {
    console.error('assessReading error:', error);
    if (cleanTranscript) {
      return scoreTranscriptLocally(originalPassage, cleanTranscript);
    }
    return {
      ...buildNoCaptureResult(originalPassage),
      parentSummary: 'Gemini could not score the reading. Check that VITE_GEMINI_API_KEY is valid in your .env file.',
    };
  }
}

function parseJsonFromModelText(text) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) cleaned = jsonMatch[1].trim();
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);
  if (objectMatch) cleaned = objectMatch[0];
  return JSON.parse(cleaned);
}

function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptions(correct, distractors) {
  const unique = [correct, ...distractors.filter((d) => d !== correct)].slice(0, 3);
  const shuffled = shuffleArray(unique);
  return {
    options: shuffled,
    correctIndex: shuffled.indexOf(correct),
  };
}

const ANIMALS = ['cat', 'dog', 'bird', 'frog', 'rabbit', 'fish', 'bear', 'duck', 'pig', 'horse', 'cow', 'mouse', 'butterfly', 'bug', 'bee', 'fox', 'owl', 'turtle', 'squirrel'];
const COLORS = ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white'];
const PLACES = ['park', 'pond', 'garden', 'tree', 'meadow', 'forest', 'house', 'school', 'beach', 'farm', 'path', 'field'];
const SKIP_NAMES = new Set(['The', 'One', 'She', 'He', 'They', 'It', 'His', 'Her', 'And', 'But', 'Then']);

function capitalize(word) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function findInPassage(passage, wordList) {
  const lower = passage.toLowerCase();
  return wordList.find((word) => {
    const pattern = new RegExp(`\\b${word}\\b`, 'i');
    return pattern.test(lower);
  });
}

function findCharacterName(passage) {
  const matches = passage.match(/\b[A-Z][a-z]{2,}\b/g) || [];
  return matches.find((name) => !SKIP_NAMES.has(name)) || null;
}

function findAction(passage) {
  const verbs = ['ran', 'jumped', 'hopped', 'played', 'explored', 'found', 'laughed', 'clapped', 'saw', 'walked', 'flew', 'swam', 'ate', 'slept'];
  const lower = passage.toLowerCase();
  return verbs.find((verb) => new RegExp(`\\b${verb}\\b`).test(lower));
}

/**
 * Build comprehension questions from the actual passage when Gemini is unavailable.
 */
function generateQuestionsLocally(passage) {
  const questions = [];
  const animal = findInPassage(passage, ANIMALS);
  const color = findInPassage(passage, COLORS);
  const place = findInPassage(passage, PLACES);
  const character = findCharacterName(passage);
  const action = findAction(passage);

  if (character) {
    const { options, correctIndex } = buildOptions(character, ['Alex', 'Jordan', 'Taylor']);
    questions.push({
      question: 'Who was in the story?',
      options,
      correctIndex,
      explanation: `Yes! ${character} was in the story! Great remembering!`,
    });
  } else if (animal) {
    const correct = `A ${animal}`;
    const distractors = ANIMALS.filter((a) => a !== animal).slice(0, 2).map((a) => `A ${a}`);
    const { options, correctIndex } = buildOptions(correct, distractors);
    questions.push({
      question: 'What animal was in the story?',
      options,
      correctIndex,
      explanation: `That's right! The story was about a ${animal}!`,
    });
  }

  if (color) {
    const correct = capitalize(color);
    const distractors = COLORS.filter((c) => c !== color).slice(0, 2).map(capitalize);
    const { options, correctIndex } = buildOptions(correct, distractors);
    questions.push({
      question: 'What color was in the story?',
      options,
      correctIndex,
      explanation: `Yes! ${correct} was in the story!`,
    });
  } else if (place) {
    const correct = capitalize(place);
    const distractors = PLACES.filter((p) => p !== place).slice(0, 2).map(capitalize);
    const { options, correctIndex } = buildOptions(correct, distractors);
    questions.push({
      question: 'Where did the story happen?',
      options,
      correctIndex,
      explanation: `Right! The story took place at the ${place}!`,
    });
  } else if (action) {
    const correct = capitalize(action);
    const distractors = ['Slept', 'Cried', 'Fell'].filter((d) => d.toLowerCase() !== action);
    const { options, correctIndex } = buildOptions(correct, distractors);
    questions.push({
      question: 'What did someone do in the story?',
      options,
      correctIndex,
      explanation: `Yes! Someone ${action} in the story!`,
    });
  }

  if (questions.length === 0) {
    const sentences = passage.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);
    const firstSentence = sentences[0] || passage;
    const snippet = firstSentence.split(/\s+/).slice(0, 4).join(' ');
    const { options, correctIndex } = buildOptions(
      firstSentence.length > 60 ? `${snippet}...` : firstSentence,
      ['Something else happened.', 'Nothing happened.', 'The story was blank.']
    );
    questions.push({
      question: 'What happened at the start of the story?',
      options,
      correctIndex,
      explanation: 'Nice job paying attention to the story!',
    });
  }

  if (questions.length === 1) {
    const wordCount = passage.split(/\s+/).filter(Boolean).length;
    const correct = wordCount > 20 ? 'A longer story' : 'A short story';
    const { options, correctIndex } = buildOptions(correct, ['A song', 'A math problem']);
    questions.push({
      question: 'What kind of story was it?',
      options,
      correctIndex,
      explanation: 'You listened carefully to the whole story!',
    });
  }

  return { questions: questions.slice(0, 2) };
}

function normalizeQuestions(data) {
  if (!data?.questions || !Array.isArray(data.questions)) {
    throw new Error('Invalid questions format');
  }

  const questions = data.questions
    .filter((q) => q?.question && Array.isArray(q?.options) && q.options.length >= 2)
    .slice(0, 2)
    .map((q) => {
      const options = q.options.slice(0, 3);
      let correctIndex = Number(q.correctIndex);
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        correctIndex = 0;
      }
      return {
        question: String(q.question).trim(),
        options,
        correctIndex,
        explanation: String(q.explanation || 'Great job!').trim(),
      };
    });

  if (questions.length === 0) {
    throw new Error('No valid questions in response');
  }

  return { questions };
}

export async function generateQuestions(passage) {
  if (!passage?.trim()) {
    return generateQuestionsLocally('The cat is red.');
  }

  if (!model) {
    return generateQuestionsLocally(passage);
  }

  const prompt = `You are a kindergarten reading tutor. Create exactly 2 simple comprehension questions about THIS specific passage that a young child (age 4-7) can answer after listening to the questions read aloud.

PASSAGE:
"${passage}"

RULES:
- Questions MUST be about facts stated in this passage only — not generic questions
- Do NOT ask about cats or colors unless this passage mentions them
- Questions should be very simple and directly answered by the passage
- Use simple language a 5-year-old can understand when heard aloud
- Each question must have exactly 3 answer options
- One option must be clearly correct based on the passage
- Wrong options should be plausible but clearly wrong if the child understood the story
- correctIndex must be 0, 1, or 2

Respond ONLY with valid JSON in this exact format:
{
  "questions": [
    {
      "question": "<simple question about this passage>",
      "options": ["<option A>", "<option B>", "<option C>"],
      "correctIndex": 0,
      "explanation": "<very short, encouraging explanation of the right answer>"
    }
  ]
}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });
    const parsed = parseJsonFromModelText(result.response.text());
    return normalizeQuestions(parsed);
  } catch (error) {
    console.error('generateQuestions error:', error);
    return generateQuestionsLocally(passage);
  }
}

// ──── Generate parent progress summary ────

export async function generateProgressSummary(profile, sessions) {
  if (!model || sessions.length === 0) {
    return 'Complete some reading sessions to see a progress summary here!';
  }

  const recentSessions = sessions.slice(0, 10);
  const sessionSummaries = recentSessions.map(s =>
    `Date: ${new Date(s.created_at).toLocaleDateString()}, Stars: ${s.star_rating}/5, Accuracy: ${s.accuracy_score}%, Words struggled: ${s.words_struggled || 'none'}`
  ).join('\n');

  const prompt = `You are an educational reading specialist writing a brief progress report for a parent.

CHILD: ${profile.name}, age ~${profile.initial_age_setting}
RECENT READING SESSIONS (newest first):
${sessionSummaries}

Write a warm, professional 3-4 sentence summary for the parent that includes:
1. Overall trend (improving, consistent, needs attention)
2. Specific strengths the child is showing
3. Specific areas to focus on
4. An encouraging note

Keep it concise and actionable. Do not use technical jargon.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('generateProgressSummary error:', error);
    return 'Unable to generate summary. Please try again later.';
  }
}

// ──── Demo mode fallbacks ────

function getDemoPassage(level) {
  const passages = {
    1: 'I see a big cat. The cat is red.',
    2: 'The dog ran to the park. He saw a bird in the tree. The bird was blue.',
    3: 'Sam had a little frog. The frog liked to hop and play. One day, the frog jumped into a pond. Sam laughed and clapped.',
    4: 'Luna the rabbit loved to explore the garden. She found colorful flowers and tiny bugs under the leaves. One sunny morning, she discovered a secret path behind the big oak tree. It led to a meadow full of butterflies!',
  };
  return passages[level] || passages[2];
}
