import { useCallback, useEffect, useRef, useState } from 'react';
import { SPEECH_LOCALE, type Lang } from '../lib/i18n';

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

export interface SpeakOptions {
  lang: Lang;
  rate?: number;
  pitch?: number;
  /** Fired as speech reaches each word: the character range [start, end) in the spoken text. Not every voice reports this. */
  onBoundary?: (start: number, end: number) => void;
  onEnd?: () => void;
}

const norm = (tag: string) => tag.toLowerCase().replace('_', '-');

/** The best installed voice for a language: an exact locale match first, then any voice of that language; local voices win (offline, and they report word boundaries). */
export function pickVoice(voices: readonly SpeechSynthesisVoice[], lang: Lang): SpeechSynthesisVoice | null {
  const exact = voices.filter((v) => norm(v.lang) === norm(SPEECH_LOCALE[lang]));
  const pool = exact.length > 0 ? exact : voices.filter((v) => norm(v.lang).startsWith(lang));
  return pool.find((v) => v.localService) ?? pool[0] ?? null;
}

/** Read-aloud via the browser's built-in speech synthesis (no audio assets, works offline). */
export function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() => (supported ? window.speechSynthesis.getVoices() : []));
  const voicesRef = useRef(voices);
  // The utterance we most recently started. cancel() fires `end` on the OLD one asynchronously; ignore it.
  const current = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!supported) return;
    // Voices load asynchronously in most browsers.
    const update = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      setVoices(voicesRef.current);
    };
    window.speechSynthesis.addEventListener('voiceschanged', update);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  const stop = useCallback(() => {
    current.current = null;
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, []);

  const speak = useCallback((text: string, opts: SpeakOptions) => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[opts.lang];
    const voice = pickVoice(voicesRef.current, opts.lang);
    if (voice) utterance.voice = voice;
    utterance.rate = opts.rate ?? 0.85; // slower than adult speech: easier for small listeners to follow
    utterance.pitch = opts.pitch ?? 1.1;
    utterance.onboundary = (e) => {
      if (current.current !== utterance || e.name !== 'word') return;
      const length = e.charLength || text.slice(e.charIndex).search(/\s|$/);
      opts.onBoundary?.(e.charIndex, e.charIndex + length);
    };
    const finish = () => {
      if (current.current !== utterance) return;
      current.current = null;
      setSpeaking(false);
      opts.onEnd?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;
    current.current = utterance;
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, []);

  useEffect(() => stop, [stop]); // never keep talking after leaving the book

  /** True when the device has a voice for this language (without one it may speak with a foreign accent). */
  const hasVoice = useCallback((lang: Lang) => pickVoice(voices, lang) !== null, [voices]);

  return { supported, speaking, speak, stop, hasVoice, voicesReady: voices.length > 0 };
}
