import type { Book } from '../../api';
import { StoryImage } from '../ui';

const LANDMARKS = [
  { x: 16, y: 10, size: 9 },
  { x: 84, y: 14, size: 6 },
  { x: 10, y: 38, size: 5 },
  { x: 90, y: 42, size: 9 },
  { x: 18, y: 68, size: 7 },
  { x: 80, y: 72, size: 5 },
  { x: 12, y: 92, size: 8 },
  { x: 52, y: 90, size: 5 },
  { x: 88, y: 94, size: 9 },
  { x: 50, y: 8, size: 5 },
];

export type PuzzleBook = Pick<Book, 'title' | 'coverEmoji' | 'coverFrom' | 'coverTo' | 'coverUrl'>;

/** The picture a puzzle is cut from: the story's cover art (or its emoji-on-gradient stand-in). */
export function PuzzleArt({ book }: { book: PuzzleBook }) {
  return (
    <div
      className="absolute inset-0 [container-type:inline-size]"
      style={{ background: `linear-gradient(150deg, ${book.coverFrom}, ${book.coverTo})` }}
    >
      <StoryImage
        src={book.coverUrl}
        className="absolute inset-0 size-full object-cover"
        fallback={
          <>
            {/* Without real art most cells would be plain gradient and impossible to tell apart, so scatter landmarks across the picture. */}
            {LANDMARKS.map((m, i) => (
              <span
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 text-white/80"
                style={{ left: `${m.x}%`, top: `${m.y}%`, fontSize: `${m.size}cqw` }}
                aria-hidden
              >
                {i % 2 === 0 ? '✦' : '●'}
              </span>
            ))}
            <span
              className="absolute inset-0 grid place-items-center drop-shadow-[0_4px_0_rgba(43,35,80,.25)]"
              style={{ fontSize: '42cqw' }}
              aria-hidden
            >
              {book.coverEmoji}
            </span>
          </>
        }
      />
    </div>
  );
}

/** One piece: a window onto the full picture, scaled so exactly its own cell shows. */
export function PuzzlePiece({
  book,
  cols,
  rows,
  index,
  className = '',
}: {
  book: PuzzleBook;
  cols: number;
  rows: number;
  index: number;
  className?: string;
}) {
  const col = index % cols;
  const row = Math.floor(index / cols);
  return (
    <div className={`relative overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute"
        style={{ width: `${cols * 100}%`, height: `${rows * 100}%`, left: `${-col * 100}%`, top: `${-row * 100}%` }}
      >
        <PuzzleArt book={book} />
      </div>
    </div>
  );
}
