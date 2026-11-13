import { useCallback, useRef, useState } from 'react';
import type { Lang } from '../lib/i18n';
import { useSpeech } from './useSpeech';

export interface Line {
  text: string;
  lang: Lang;
}

/** Where speech is right now, so the matching word can be lit up. */
export interface Highlight {
  position: number;
  lang: Lang;
  start: number;
  end: number;
}

/**
 * Speaks a page: one or more lines in order (English then Indonesian in "both" mode), lighting up each word as it is
 * spoken when the voice reports it. Also speaks single words for tap-to-hear.
 */
export function useReadAloud() {
  const speech = useSpeech();
  const [highlight, setHighlight] = useState<Highlight | null>(null);
  const run = useRef(0); // each call gets an id; anything from an older id is stale and ignored
  const { speak, stop: stopSpeech } = speech;

  const readLines = useCallback(
    (position: number, lines: readonly Line[], onDone?: () => void) => {
      const id = ++run.current;
      const step = (i: number) => {
        if (run.current !== id) return;
        const line = lines[i];
        if (!line) {
          setHighlight(null);
          onDone?.();
          return;
        }
        speak(line.text, {
          lang: line.lang,
          onBoundary: (start, end) => run.current === id && setHighlight({ position, lang: line.lang, start, end }),
          onEnd: () => step(i + 1),
        });
      };
      step(0);
    },
    [speak],
  );

  const stop = useCallback(() => {
    run.current++;
    stopSpeech();
    setHighlight(null);
  }, [stopSpeech]);

  const speakWord = useCallback(
    (word: string, lang: Lang) => {
      run.current++;
      setHighlight(null);
      speak(word, { lang, rate: 0.8 });
    },
    [speak],
  );

  return {
    supported: speech.supported,
    speaking: speech.speaking,
    hasVoice: speech.hasVoice,
    voicesReady: speech.voicesReady,
    highlight,
    readLines,
    speakWord,
    stop,
  };
}
