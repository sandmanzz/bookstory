import { useRef, useState, type PointerEvent, type ReactNode } from 'react';
import {
  TAP_SLOP,
  applyFlip,
  dragAngle,
  dragDirection,
  dragProgress,
  draggedSheet,
  restingAngle,
  shouldCommit,
  stackOrder,
  tapDirection,
  type BookLayout,
  type FlipDirection,
} from './math';

export interface Sheet {
  /** Visible on the right-hand page while the sheet is unturned. */
  front: ReactNode;
  /** Visible on the left-hand page once the sheet is turned. */
  back: ReactNode;
}

interface BookProps {
  sheets: Sheet[];
  /** Number of sheets turned to the left. 0 is a closed book. */
  flipped: number;
  onFlip: (flipped: number) => void;
  layout: BookLayout;
  /** Revealed on the right once every sheet is turned (the "back cover"). */
  endPage: ReactNode;
  /** Accessible name for the whole book. */
  label: string;
}

interface Drag {
  direction: FlipDirection;
  sheet: number;
  progress: number;
}

const INTERACTIVE = 'a,button,input,textarea,select,[data-no-flip]';
/** React 18's types predate the `inert` attribute; it removes an element from focus order and the a11y tree. */
const inertIf = (inert: boolean): Record<string, unknown> => (inert ? { inert: '' } : {});
const EASE = 'ease-[cubic-bezier(.45,.05,.25,1)]';

/**
 * Presentational page-turn book. It knows nothing about stories: it renders sheets, animates them
 * with CSS 3D transforms and turns pointer gestures (tap, drag, swipe) into `onFlip` calls.
 *
 * Each sheet lives in its own perspective wrapper so ordinary z-index stacking works (z-index is
 * ignored inside a shared preserve-3d context).
 */
export function Book({ sheets, flipped, onFlip, layout, endPage, label }: BookProps) {
  const total = sheets.length;
  const spread = layout === 'spread';
  const slotRef = useRef<HTMLDivElement>(null);
  const gesture = useRef<{ startX: number; moved: boolean } | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);

  const finished = flipped === total;
  // A closed spread shows only the cover on the right, so slide the book to centre it.
  const centreCover = spread && flipped === 0 && !drag;

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.button !== 0 || (e.target as HTMLElement).closest(INTERACTIVE)) return;
    gesture.current = { startX: e.clientX, moved: false };
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.startX;
    if (Math.abs(dx) < TAP_SLOP) return;
    if (!g.moved) e.currentTarget.setPointerCapture(e.pointerId); // capture only once it is a real drag, so plain taps reach the word or button under the finger
    g.moved = true;
    const direction = dragDirection(dx, flipped, total);
    // Dragging back to the start (or in an impossible direction) cancels the turn instead of leaving stale progress.
    setDrag(
      direction
        ? { direction, sheet: draggedSheet(direction, flipped), progress: dragProgress(dx, slotRef.current?.offsetWidth ?? 0) }
        : null,
    );
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    if (drag) {
      onFlip(applyFlip(flipped, drag.direction, total, shouldCommit(drag.progress)));
      setDrag(null);
    } else if (!g.moved) {
      if ((e.target as HTMLElement).closest('[data-word]')) return; // tapping a word speaks it; it must not turn the page
      const rect = e.currentTarget.getBoundingClientRect();
      onFlip(applyFlip(flipped, tapDirection((e.clientX - rect.left) / rect.width, layout, flipped === 0), total));
    }
  }

  function onPointerCancel() {
    gesture.current = null;
    setDrag(null);
  }

  return (
    <div
      role="group"
      aria-roledescription="book"
      aria-label={label}
      className={`relative mx-auto touch-pan-y select-none ${spread ? 'aspect-[2/1]' : 'aspect-[3/4.2]'}`}
      // `--book-reserve` is the vertical space the page keeps for controls (more when a question card is showing).
      style={{
        width: spread
          ? 'min(100%, calc((100dvh - var(--book-reserve, 230px)) * 2), 1040px)'
          : 'min(100%, calc((100dvh - var(--book-reserve, 240px)) * .714), 480px)',
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div
        className={`absolute inset-0 transition-transform duration-700 ${EASE} motion-reduce:duration-1 ${spread ? '' : 'overflow-hidden rounded-[1.25rem]'}`}
        style={{ transform: centreCover ? 'translateX(-25%)' : undefined, filter: 'drop-shadow(0 7px 0 var(--color-ink))' }}
      >
        <div ref={slotRef} className={`absolute ${spread ? 'inset-y-0 right-0 w-1/2' : 'inset-0'}`}>
          {/* Back cover: revealed only when every sheet has been turned, so keep it out of the tab order until then. */}
          <div className="absolute inset-0 z-0" {...inertIf(!finished)}>
            {endPage}
          </div>

          <div>
            {sheets.map((sheet, i) => {
              // Only the faces you can actually see take part in focus and the accessibility tree.
              const frontVisible = i === flipped;
              const backVisible = spread && i === flipped - 1;
              const dragging = drag?.sheet === i;
              const angle = dragging ? dragAngle(drag.direction, drag.progress) : restingAngle(i, flipped);
              return (
                <div
                  key={i}
                  // Wrappers are transparent to the pointer: a turned sheet would otherwise sit invisibly over the back cover and swallow its clicks.
                  className="pointer-events-none absolute inset-0 [perspective-origin:0%_50%] [perspective:2400px] transition-[z-index] delay-[350ms] duration-0"
                  style={{ zIndex: dragging ? total + 2 : stackOrder(i, flipped, total), transitionDelay: dragging ? '0s' : undefined }}
                >
                  <div
                    className={`absolute inset-0 origin-left [transform-style:preserve-3d] ${dragging ? '' : `transition-transform duration-700 ${EASE} motion-reduce:duration-1`}`}
                    style={{ transform: `rotateY(${angle}deg)` }}
                  >
                    <div
                      className="pointer-events-auto absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden]"
                      {...inertIf(!frontVisible)}
                    >
                      {sheet.front}
                    </div>
                    <div
                      className="pointer-events-auto absolute inset-0 [-webkit-backface-visibility:hidden] [backface-visibility:hidden] [transform:rotateY(180deg)]"
                      {...inertIf(!backVisible)}
                    >
                      {sheet.back}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
