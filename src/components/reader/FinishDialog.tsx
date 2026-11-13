import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money, type Book } from '../../api';
import { useAsync } from '../../hooks/useAsync';
import { bookTitle, t, type Lang } from '../../lib/i18n';
import { UnlockDialog } from '../UnlockDialog';
import { CheckIcon, Cover, Dialog, LockIcon, Mascot } from '../ui';

interface Props {
  book: Book;
  /** Language for the title and labels. */
  lang: Lang;
  stars: number;
  starTotal: number;
  /** Present when this book has a puzzle waiting. */
  puzzle?: { built: boolean; onPlay: () => void };
  /** Slugs this reader already finished, so suggestions lean towards new stories. */
  finishedSlugs: string[];
  onReadAgain: () => void;
  onClose: () => void;
}

/**
 * Shown when a full book is finished (with confetti from the reader): a short celebration, the puzzle, and what to read
 * next. Locked suggestions are shown with a lock and open the payment pop-up when tapped.
 */
export function FinishDialog({ book, lang, stars, starTotal, puzzle, finishedSlugs, onReadAgain, onClose }: Props) {
  const navigate = useNavigate();
  const [unlocking, setUnlocking] = useState<Book | null>(null);
  const next = useAsync(() => api.next(book.slug, { limit: 3, exclude: finishedSlugs }), [book.slug, finishedSlugs.join(',')]);
  const suggestions = next.data?.books ?? [];

  if (unlocking) return <UnlockDialog book={unlocking} lang={lang} onClose={() => setUnlocking(null)} />;

  const open = (b: Book) => (b.access.canRead ? navigate(`/read/${b.slug}`) : setUnlocking(b));

  return (
    <Dialog title={`${t(lang, 'youFinished')} ${bookTitle(book, lang)}`} onClose={onClose}>
      <div className="grid justify-items-center gap-1 text-center">
        <Mascot className="bob size-20" mood="cheer" />
        <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">{t(lang, 'wellDone')}</p>
        <h2 className="text-2xl font-bold leading-tight">
          {t(lang, 'youFinished')} “{bookTitle(book, lang)}”!
        </h2>
        {starTotal > 0 && (
          <p className="font-display text-lg font-semibold">
            ⭐ {stars}/{starTotal}
          </p>
        )}
      </div>

      {puzzle && (
        <button
          className="btn btn-primary mt-4 w-full"
          onClick={() => {
            puzzle.onPlay();
            onClose();
          }}
        >
          🧩 {puzzle.built ? t(lang, 'puzzleAgain') : t(lang, 'puzzleFound')}
        </button>
      )}

      {suggestions.length > 0 && (
        <section className="mt-5" aria-labelledby="up-next">
          <h3 id="up-next" className="mb-2 font-display text-lg font-bold">
            {t(lang, 'upNext')}
          </h3>
          <ul className="space-y-2">
            {suggestions.map((b, i) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => open(b)}
                  className={`sticker flex w-full items-center gap-3 rounded-2xl p-2 pr-3 text-left transition hover:-translate-y-0.5 ${i === 0 ? '!bg-lock-soft' : ''}`}
                >
                  <Cover book={b} className="w-12 shrink-0 !rounded-xl [&>span]:!text-2xl" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-semibold leading-tight">{bookTitle(b, lang)}</span>
                    <span className="text-xs font-bold text-ink-soft">
                      {b.ageMin}–{b.ageMax} · {b.readingMinutes} min
                    </span>
                  </span>
                  {b.access.canRead ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#a8f0d3] px-2.5 py-1 text-xs font-extrabold">
                      <CheckIcon className="size-3.5" /> {i === 0 ? t(lang, 'readNext') : 'Read'}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-sun px-2.5 py-1 text-xs font-extrabold">
                      <LockIcon className="size-3.5" /> {money(b.price)}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 flex gap-2">
        <button
          className="btn btn-ghost flex-1"
          onClick={() => {
            onReadAgain();
            onClose();
          }}
        >
          ↺ {t(lang, 'readAgain')}
        </button>
        <Link to="/" className="btn btn-ghost flex-1" onClick={onClose}>
          {t(lang, 'moreStories')}
        </Link>
      </div>
    </Dialog>
  );
}
