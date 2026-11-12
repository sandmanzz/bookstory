import { useCallback, useRef, useState } from 'react';

export type Sound = 'tap' | 'correct' | 'wrong' | 'star' | 'win';

const MUTE_KEY = 'ms:sfx-muted';
/** C major pentatonic: any order of taps sounds pleasant, which is what a toddler's tapping will be. */
const SCALE = [523.25, 587.33, 659.25, 783.99, 880.0];
const VOLUME = 0.07;

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

function tone(ctx: AudioContext, freq: number, start: number, length: number, type: OscillatorType = 'triangle', slideTo?: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + length);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(VOLUME, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + length + 0.02);
}

/** Tiny synthesised sound effects (no audio files to load or license). Muting is remembered per browser. */
export function useSfx() {
  const [muted, setMuted] = useState(readMuted);
  const ctx = useRef<AudioContext | null>(null);

  const play = useCallback(
    (sound: Sound, variant = 0) => {
      if (muted || typeof AudioContext === 'undefined') return;
      ctx.current ??= new AudioContext();
      const c = ctx.current;
      if (c.state === 'suspended') void c.resume();
      const t = c.currentTime;
      switch (sound) {
        case 'tap':
          tone(c, SCALE[variant % SCALE.length]!, t, 0.22);
          break;
        case 'correct':
          [0, 2, 3].forEach((n, i) => tone(c, SCALE[n]!, t + i * 0.09, 0.28));
          break;
        case 'star':
          tone(c, SCALE[3]!, t, 0.18);
          tone(c, SCALE[4]! * 1.25, t + 0.1, 0.32);
          break;
        case 'win':
          [0, 1, 2, 3, 4].forEach((n, i) => tone(c, SCALE[n]!, t + i * 0.1, 0.3));
          tone(c, SCALE[4]! * 2, t + 0.55, 0.5);
          break;
        case 'wrong':
          tone(c, 300, t, 0.3, 'sine', 210);
          break;
      }
    },
    [muted],
  );

  const toggleMuted = useCallback(() => {
    setMuted((m) => {
      try {
        localStorage.setItem(MUTE_KEY, m ? '0' : '1');
      } catch {
        /* storage unavailable: the choice just won't be remembered */
      }
      return !m;
    });
  }, []);

  return { muted, play, toggleMuted };
}
