import { useEffect, useState, type PointerEvent } from 'react';
import type { Sound } from '../../hooks/useSfx';
import {
  hintSlot,
  isComplete,
  pickHeadStart,
  pieceCount,
  placedCount,
  shuffledOrder,
  startPuzzle,
  tryPlace,
  type PuzzleGrid,
} from '../../lib/puzzle';
import { PuzzlePiece, type PuzzleBook } from './PuzzleArt';

interface Props {
  book: PuzzleBook;
  grid: PuzzleGrid;
  onComplete: () => void;
  play: (sound: Sound, variant?: number) => void;
}

interface Drag {
  piece: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  w: number;
  h: number;
  moved: boolean;
}

const DRAG_SLOP = 8;

/**
 * The puzzle itself. Two ways to play, so a 2-year-old and a 6-year-old both manage: drag a piece to its spot,
 * or tap a piece and then tap its spot (also works with a keyboard). A wrong try only wobbles the piece.
 */
export function PuzzleBoard({ book, grid, onComplete, play }: Props) {
  const count = pieceCount(grid);
  const [state, setState] = useState(() => startPuzzle(count, pickHeadStart(count)));
  const [order] = useState(() => shuffledOrder(count));
  const [selected, setSelected] = useState<number | null>(null);
  const [wobble, setWobble] = useState<{ piece: number; n: number } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (!wobble) return;
    const timer = window.setTimeout(() => setWobble(null), 450);
    return () => window.clearTimeout(timer);
  }, [wobble]);

  const tray = order.filter((i) => !state.placed[i]);
  const done = isComplete(state);
  // Aspect of one piece when the whole picture is 4:5, like a cover.
  const pieceAspect = `${grid.rows * 4} / ${grid.cols * 5}`;
  const hinted = new Set(order.map((i) => hintSlot(state, i)).filter((s): s is number => s !== null));

  function attempt(piece: number, slot: number) {
    const result = tryPlace(state, piece, slot);
    setState(result.state);
    setSelected(null);
    if (result.correct) {
      play('tap', placedCount(result.state));
      setAnnouncement(`Piece placed. ${placedCount(result.state)} of ${count}.`);
      if (isComplete(result.state)) onComplete();
    } else {
      setWobble((w) => ({ piece, n: (w?.n ?? 0) + 1 }));
      setAnnouncement('Not there. Try another spot.');
    }
  }

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, piece: number) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ piece, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, w: rect.width, h: rect.height, moved: false });
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    const { clientX, clientY } = e;
    setDrag((d) => d && { ...d, x: clientX, y: clientY, moved: d.moved || Math.hypot(clientX - d.startX, clientY - d.startY) > DRAG_SLOP });
  }

  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    if (!drag) return;
    const finished = drag;
    setDrag(null);
    if (!finished.moved) return setSelected((s) => (s === finished.piece ? null : finished.piece)); // a tap selects
    const slot = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-slot]');
    if (slot) attempt(finished.piece, Number(slot.dataset.slot));
  }

  return (
    <div className="space-y-4">
      <div
        className="mx-auto grid aspect-[4/5] gap-1 rounded-2xl border-[3px] border-ink bg-white p-1 shadow-[0_5px_0_var(--color-ink)]"
        // Capped by screen height so the board AND the loose pieces fit on one screen: you cannot drag from below the fold.
        style={{
          width: 'min(100%, 19rem, calc(36dvh * .8))',
          gridTemplateColumns: `repeat(${grid.cols}, 1fr)`,
          gridTemplateRows: `repeat(${grid.rows}, 1fr)`,
        }}
        role="group"
        aria-label={`Puzzle board, ${count} pieces`}
      >
        {Array.from({ length: count }, (_, slot) => {
          const placed = state.placed[slot];
          return (
            <button
              key={slot}
              type="button"
              data-slot={slot}
              disabled={placed}
              onClick={() => selected !== null && attempt(selected, slot)}
              aria-label={placed ? `Spot ${slot + 1}, filled` : `Spot ${slot + 1}, empty`}
              className={`relative overflow-hidden rounded-lg border-2 ${
                placed ? 'border-transparent' : 'border-dashed border-ink/40 bg-cream'
              } ${hinted.has(slot) ? 'animate-pulse ring-4 ring-sun motion-reduce:animate-none' : ''} ${
                selected !== null && !placed ? 'cursor-pointer hover:border-primary' : ''
              }`}
            >
              <PuzzlePiece
                book={book}
                cols={grid.cols}
                rows={grid.rows}
                index={slot}
                className={`size-full ${placed ? '' : 'opacity-20 grayscale'}`}
              />
            </button>
          );
        })}
      </div>

      {!done && (
        <>
          <p className="text-center text-sm font-bold text-ink-soft">Drag a piece to its spot, or tap a piece and then its spot.</p>
          <div className="flex flex-wrap items-center justify-center gap-3" aria-label="Loose pieces">
            {tray.map((piece) => (
              <button
                key={piece}
                type="button"
                aria-label={`Puzzle piece ${piece + 1}`}
                aria-pressed={selected === piece}
                onPointerDown={(e) => onPointerDown(e, piece)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                onClick={(e) => e.detail === 0 && setSelected((s) => (s === piece ? null : piece))}
                className={`touch-none select-none overflow-hidden rounded-xl border-[3px] border-ink shadow-[0_3px_0_var(--color-ink)] ${
                  selected === piece ? 'ring-4 ring-primary ring-offset-2' : ''
                } ${wobble?.piece === piece ? 'shake' : ''} ${drag?.piece === piece ? 'opacity-30' : ''}`}
                style={{ width: `${Math.min(5.2, 15 / grid.cols)}rem`, aspectRatio: pieceAspect }}
              >
                <PuzzlePiece book={book} cols={grid.cols} rows={grid.rows} index={piece} className="size-full" />
              </button>
            ))}
          </div>
        </>
      )}

      {drag?.moved && (
        <div
          className="pointer-events-none fixed z-[90] -translate-x-1/2 -translate-y-1/2 scale-110 overflow-hidden rounded-xl border-[3px] border-ink shadow-[0_8px_0_rgba(43,35,80,.35)]"
          style={{ left: drag.x, top: drag.y, width: drag.w, height: drag.h }}
          aria-hidden
        >
          <PuzzlePiece book={book} cols={grid.cols} rows={grid.rows} index={drag.piece} className="size-full" />
        </div>
      )}

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  );
}
