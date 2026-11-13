import { useEffect, useRef, useState } from 'react';
import type { PageContent, Sticker } from '../../api';
import type { Sound } from '../../hooks/useSfx';
import { stickerKey } from '../../lib/activity';
import { stickerSound } from '../../lib/i18n';
import { useReaderText } from '../reader/ReaderText';

const BUBBLE_MS = 1200;

interface StickerProps {
  sticker: Sticker;
  /** The sound word in the reading language. */
  sound: string;
  found: boolean;
  onTap: () => void;
}

/** One touchable object. It reacts every time (so a toddler can tap it again and again) and says its sound word. */
function StickerButton({ sticker, sound, found, onTap }: StickerProps) {
  const [taps, setTaps] = useState(0);
  const [bubble, setBubble] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function handleTap() {
    setTaps((n) => n + 1);
    onTap();
    if (!sound) return;
    setBubble(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBubble(false), BUBBLE_MS);
  }

  return (
    <button
      type="button"
      onClick={handleTap}
      aria-label={sound ? `${sticker.emoji} ${sound}` : sticker.emoji}
      className="pointer-events-auto absolute grid size-[clamp(3rem,14cqw,5rem)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full touch-manipulation"
      style={{ left: `${sticker.x}%`, top: `${sticker.y}%` }}
    >
      {/* Until it is found, a soft pulsing halo says "touch me" without any words. */}
      {!found && <span aria-hidden className="absolute inset-0 animate-pulse rounded-full bg-white/55 motion-reduce:animate-none" />}
      <span
        key={taps}
        className={`relative block leading-none ${taps > 0 ? `react-${sticker.reaction}` : ''}`}
        style={{ fontSize: 'clamp(2rem, 11cqw, 3.6rem)' }}
      >
        {sticker.emoji}
      </span>
      {bubble && (
        <span
          aria-hidden
          className="bubble pointer-events-none absolute -top-[70%] left-1/2 whitespace-nowrap rounded-full border-[2.5px] border-ink bg-white px-3 py-1 font-display text-sm font-bold sm:text-base"
        >
          {sound}
        </span>
      )}
    </button>
  );
}

interface LayerProps {
  page: PageContent;
  found: ReadonlySet<string>;
  onFound: (key: string) => void;
  play: (sound: Sound, variant?: number) => void;
}

/** Touchable objects floating over a page's illustration. The empty space between them stays draggable. */
export function ActivityLayer({ page, found, onFound, play }: LayerProps) {
  const { langs } = useReaderText();
  const stickers = page.activity?.stickers ?? [];
  if (stickers.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {stickers.map((sticker, i) => {
        const key = stickerKey(page.position, i);
        return (
          <StickerButton
            key={key}
            sticker={sticker}
            sound={stickerSound(sticker, langs[0] ?? 'en')}
            found={found.has(key)}
            onTap={() => {
              play('tap', i + page.position);
              onFound(key);
            }}
          />
        );
      })}
    </div>
  );
}
