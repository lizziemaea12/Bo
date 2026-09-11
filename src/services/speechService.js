/**
 * Speech Service — wraps Web Speech API (STT + TTS) and MediaRecorder
 */

// ──── Text-to-Speech (Bo speaking) ────

let currentUtterance = null;

/**
 * Bo speaks text aloud using Web Speech Synthesis.
 * Returns a promise that resolves when speaking is done.
 */
export function speak(text, options = {}) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate || 0.85;
    utterance.pitch = options.pitch || 1.1;
    utterance.volume = options.volume || 1;

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      v.name.includes('Samantha') ||
      v.name.includes('Google US English') ||
      v.name.includes('Microsoft Zira') ||
      (v.lang.startsWith('en') && v.name.includes('Female'))
    ) || voices.find(v => v.lang.startsWith('en'));

    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };
    utterance.onerror = () => {
      currentUtterance = null;
      resolve();
    };

    currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  currentUtterance = null;
}

export function preloadVoices() {
  if (window.speechSynthesis) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}

// ──── Speech-to-Text (child reading) ────

let recognition = null;

export function isSpeechRecognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

function clearRestartTimeout(instance) {
  if (instance?._restartTimeout) {
    clearTimeout(instance._restartTimeout);
    instance._restartTimeout = null;
  }
}

function scheduleRecognitionRestart(instance) {
  if (instance._stopped) return;
  clearRestartTimeout(instance);
  instance._restartTimeout = setTimeout(() => {
    instance._restartTimeout = null;
    if (!instance._stopped) {
      try {
        instance.start();
      } catch {
        /* already started */
      }
    }
  }, 250);
}

/**
 * Start listening — must be called synchronously from a click handler.
 * SpeechRecognition.start() requires an active user gesture; do not await before calling this.
 */
export function startListening(callbacks = {}) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    callbacks.onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
    return null;
  }

  stopListening();
  stopSpeaking();

  const instance = new SpeechRecognition();
  recognition = instance;
  instance._stopped = false;
  instance._fullTranscript = '';

  instance.continuous = true;
  instance.interimResults = true;
  instance.lang = 'en-US';
  instance.maxAlternatives = 3;

  let fullTranscript = '';
  let latestTranscript = '';

  instance.onstart = () => {
    console.log('SpeechRecognition: started listening');
    instance._isListening = true;
  };

  instance.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcriptText = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += transcriptText;
      } else {
        interim += transcriptText;
      }
    }

    if (final) {
      fullTranscript += final + ' ';
    }

    latestTranscript = (fullTranscript + interim).trim();
    instance._fullTranscript = latestTranscript;

    if (interim || final) {
      callbacks.onInterimResult?.(latestTranscript);
    }
    if (final) {
      callbacks.onFinalResult?.(fullTranscript.trim());
    }
  };

  instance.onerror = (event) => {
    console.error('SpeechRecognition error:', event.error);
    if (event.error === 'no-speech') {
      scheduleRecognitionRestart(instance);
      return;
    }
    if (event.error === 'aborted') return;
    callbacks.onError?.(event.error);
  };

  instance.onend = () => {
    instance._isListening = false;
    if (!instance._stopped) {
      scheduleRecognitionRestart(instance);
    }
  };

  // Start immediately while the browser still has user-gesture activation.
  try {
    instance.start();
  } catch (e) {
    console.error('SpeechRecognition failed to start:', e);
    callbacks.onError?.('Could not start speech recognition: ' + e.message);
    recognition = null;
    return null;
  }

  return {
    getTranscript: () => latestTranscript || fullTranscript.trim() || instance._fullTranscript || '',
  };
}

/**
 * Stop listening and return the captured transcript.
 */
export async function stopListening() {
  let transcript = '';

  if (recognition) {
    recognition._stopped = true;
    clearRestartTimeout(recognition);
    transcript = recognition._fullTranscript || '';
    try {
      recognition.stop();
    } catch {
      /* ignore */
    }
    recognition = null;
  }

  return { transcript, audioBlob: null };
}
