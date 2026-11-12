import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSfx } from '../../hooks/useSfx';
import { gridForAge } from '../../lib/puzzle';
import { Confetti } from '../Confetti';
import { Dialog, Mascot } from '../ui';
import type { PuzzleBook } from './PuzzleArt';
import { PuzzleBoard } from './PuzzleBoard';

interface Props {
  book: PuzzleBook;
  /** The reader's age, to choose how many pieces. Null when no reader is selected. */
  age: number | null;
  onComplete: () => void;
  onClose: () => void;
}

/** Build a story's puzzle. One short celebration when it is done, then everything stays calm. */
export function PuzzleDialog({ book, age, onComplete, onClose }: Props) {
  const sfx = useSfx();
  const [done, setDone] = useState(false);
  const [round, setRound] = useState(0); // bumping this remounts the board: a fresh shuffle for "play again"

  return (
    <Dialog title={`Puzzle: ${book.title}`} onClose={onClose}>
      <h2 className="text-center text-2xl font-bold">{done ? 'You did it!' : book.title}</h2>
      <p className="mb-4 text-center text-sm font-bold text-ink-soft">{done ? 'The picture is back together.' : 'Puzzle time'}</p>

      <PuzzleBoard
        key={round}
        book={book}
        grid={gridForAge(age)}
        play={sfx.play}
        onComplete={() => {
          setDone(true);
          sfx.play('win');
          onComplete();
        }}
      />

      {done && (
        <div className="mt-5 grid justify-items-center gap-3 text-center">
          <Mascot className="size-16" mood="cheer" />
          <p className="font-display text-lg font-semibold">It’s in your puzzle album.</p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Link to="/puzzles" className="btn btn-sun flex-1" onClick={onClose}>
              🧩 My puzzles
            </Link>
            <button
              className="btn btn-ghost flex-1"
              onClick={() => {
                setDone(false);
                setRound((r) => r + 1);
              }}
            >
              Play again
            </button>
          </div>
          <button className="text-sm font-bold text-ink-soft underline" onClick={onClose}>
            Close
          </button>
        </div>
      )}
      {!done && (
        <button className="btn btn-ghost mt-4 w-full" onClick={onClose}>
          Close
        </button>
      )}
      {done && <Confetti />}
    </Dialog>
  );
}
