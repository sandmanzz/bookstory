import { Link } from 'react-router-dom';
import { money, type Book } from '../../api';
import { useTrialEligible } from '../../auth';
import { EndPanel, type Side } from '../book/faces';
import { LockIcon, Mascot } from '../ui';

interface Props {
  side: Side;
  book: Book;
  locked: boolean;
  readablePages: number;
  totalPages: number;
  stars: number;
  starTotal: number;
  onBuy: () => void;
  onRestart: () => void;
  /** Present for a finished, unlocked book: its puzzle is waiting. */
  puzzle?: { built: boolean; onPlay: () => void };
}

/** The back cover: a celebration at the end of a full book, or the purchase prompt after a free preview. */
export function EndPage({ side, book, locked, readablePages, totalPages, stars, starTotal, onBuy, onRestart, puzzle }: Props) {
  const trialEligible = useTrialEligible();
  return (
    <EndPanel side={side}>
      {locked ? (
        <>
          {side === 'single' && <Mascot className="bob w-24" mood="sleepy" />}
          <h2 className="text-2xl font-bold sm:text-3xl">What happens next?</h2>
          <p className="max-w-xs text-ink-soft">
            You’ve read {readablePages} of {totalPages} pages. Ask a grown-up to unlock the rest!
          </p>
          <button className="btn btn-primary w-full max-w-xs" onClick={onBuy}>
            <LockIcon /> Buy · {money(book.price)}
          </button>
          <Link to="/plans" className="btn btn-sun w-full max-w-xs">
            {trialEligible ? 'Try everything free for 7 days' : 'Subscribe for everything'}
          </Link>
        </>
      ) : (
        <>
          {side === 'single' && <Mascot className="bob w-24" mood="cheer" />}
          <h2 className="text-3xl font-bold">The End</h2>
          {starTotal > 0 ? (
            <p className="font-display text-xl font-semibold">
              You earned {stars} of {starTotal} ⭐
            </p>
          ) : (
            <p className="text-ink-soft">Goodnight!</p>
          )}
          {puzzle && (
            <button className="btn btn-primary w-full max-w-xs" onClick={puzzle.onPlay}>
              🧩 {puzzle.built ? 'Play the puzzle again' : 'You found a puzzle!'}
            </button>
          )}
          <button className="btn btn-sun w-full max-w-xs" onClick={onRestart}>
            ↺ Read again
          </button>
          <Link to="/" className="btn btn-ghost w-full max-w-xs">
            More stories
          </Link>
        </>
      )}
    </EndPanel>
  );
}
