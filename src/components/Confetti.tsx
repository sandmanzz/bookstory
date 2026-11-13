import { useState } from 'react';

const EMOJI = ['⭐', '✨', '🎈', '💛', '🌙', '🎉'];
const COLORS = ['#FFC93C', '#FF6B6B', '#4CC9F0', '#5B4BDB', '#2FA37A', '#FF8FC7'];

const makeBits = (count = 72) =>
  Array.from({ length: count }, (_, n) => ({
    n,
    left: Math.random() * 100,
    duration: 2.6 + Math.random() * 2.8,
    delay: Math.random() * 1.1,
    size: 14 + Math.random() * 20,
    // One piece in three is an emoji; the rest are coloured paper, which reads as confetti at any size.
    emoji: n % 3 === 0 ? EMOJI[n % EMOJI.length] : null,
    color: COLORS[n % COLORS.length],
    rotate: Math.random() * 360,
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
          style={{ left: `${b.left}%`, animationDuration: `${b.duration}s`, animationDelay: `${b.delay}s`, fontSize: b.size }}
        >
          {b.emoji ?? (
            <span
              className="block rounded-[2px]"
              style={{ width: b.size * 0.5, height: b.size * 0.8, background: b.color, transform: `rotate(${b.rotate}deg)` }}
            />
          )}
        </span>
      ))}
    </div>
  );
}
