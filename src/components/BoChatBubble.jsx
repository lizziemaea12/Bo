import { useEffect, useRef } from 'react';
import { speak } from '../services/speechService';

export default function BoChatBubble({ text, speakAloud = true, onDoneSpeaking, className = '' }) {
  const hasSpoken = useRef(false);

  useEffect(() => {
    if (speakAloud && text) {
      hasSpoken.current = false;
      speak(text).then(() => {
        hasSpoken.current = true;
        onDoneSpeaking?.();
      });
    }
  }, [text, speakAloud]);

  if (!text) return null;

  return (
    <div className={`chat-bubble ${className}`}>
      {text}
    </div>
  );
}
