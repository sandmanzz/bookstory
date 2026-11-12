import { useState } from 'react';

const PIECES = ['⭐', '✨', '🎈', '💛', '🌙'];

const makeBits = (count = 28) =>
  Array.from({ length: count }, (_, n) => ({
    n,
    left: Math.random() * 100,
    duration: 2.2 + Math.random() * 2.2,
    delay: Math.random() * 0.8,
    size: 18 + Math.random() * 18,
  }));

/** One-shot falling celebration. Motion is defined in index.css and disabled for reduced-motion users. */
export function Confetti() {
  const [bits] = useState(() => makeBits());
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {bits.map((b) => (
        <span
          key={b.n}
          className="fall absolute top-0 opacity-0"
          style={{ left: `${b.left}%`, fontSize: b.size, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s` }}
        >
          {PIECES[b.n % PIECES.length]}
        </span>
      ))}
    </div>
  );
}
