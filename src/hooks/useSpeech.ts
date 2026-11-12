import { useCallback, useEffect, useRef, useState } from 'react';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Read-aloud via the browser's built-in speech synthesis (no audio assets, works offline). */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  // The utterance we most recently started. cancel() fires `end` on the OLD one asynchronously; ignore it.
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  const stop = useCallback(() => {
    current.current = null;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.85; // slower than adult speech: easier for small listeners to follow
    utterance.pitch = 1.1;
    const finish = () => {
      if (current.current === utterance) setSpeaking(false);
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    current.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, []);

  useEffect(() => stop, [stop]); // never keep talking after leaving the book

  return { supported, speaking, speak, stop };
}
