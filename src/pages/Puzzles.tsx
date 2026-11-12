import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, type Book } from '../api';
import { Avatar } from '../components/ProfileDialog';
import { PuzzleDialog } from '../components/puzzle/PuzzleDialog';
import { Cover, ErrorPanel, Mascot, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { usePuzzleCollection } from '../hooks/usePuzzles';
import { builtCount, foundCount } from '../lib/collection';
import { useProfiles } from '../profiles';

/** Each reader has their own album, so remount (and reload from storage) whenever the reader changes. */
export function Puzzles() {
  const { profileId } = useProfiles();
  return <PuzzleAlbum key={profileId} profileId={profileId} />;
}

function PuzzleAlbum({ profileId }: { profileId: string }) {
  const { active, openPicker } = useProfiles();
  const { data, error, loading, reload } = useAsync(() => api.books());
  const { collection, complete } = usePuzzleCollection(profileId);
  const [openBook, setOpenBook] = useState<Book | null>(null);

  if (loading && !data) return <Spinner label="Opening the puzzle album" />;
  if (error || !data) return <ErrorPanel message={error?.message ?? 'Could not load the album'} onRetry={reload} />;

  // Only stories this reader can actually read appear here. Paid, locked books are left out on purpose:
  // an album of tempting locked puzzles would turn a child's wish into pressure on the parent to buy.
  const stories = data.books.filter((b) => b.access.canRead && b.status === 'published');
  const found = stories.filter((b) => collection[b.slug]);
  const next = stories.find((b) => !collection[b.slug]);
  const total = stories.length;
  const foundNow = Math.min(foundCount(collection), total);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center gap-4">
        {active ? <Avatar id={active.avatar} className="size-14 text-3xl" /> : <Mascot className="size-14" />}
        <div className="min-w-0 flex-1">
          <h1 className="text-3xl font-bold sm:text-4xl">{active ? `${active.name}’s puzzles` : 'My puzzles'}</h1>
          <p className="text-ink-soft">
            {foundNow} of {total} found · {builtCount(collection)} built
          </p>
        </div>
      </header>

      {!active && (
        <p className="sticker rounded-card p-4 text-sm font-bold text-ink-soft">
          Puzzles are saved for each reader.{' '}
          <button className="text-primary underline" onClick={openPicker}>
            Add a reader
          </button>{' '}
          to keep their own album.
        </p>
      )}

      {total > 0 && (
        <div
          className="h-3 overflow-hidden rounded-full border-[3px] border-ink bg-white"
          role="img"
          aria-label={`${foundNow} of ${total} puzzles found`}
        >
          <div className="h-full bg-sun transition-all" style={{ width: `${(foundNow / total) * 100}%` }} />
        </div>
      )}

      {total === 0 && (
        <div className="sticker grid place-items-center gap-2 rounded-card p-8 text-center">
          <Mascot className="size-20" mood="sleepy" />
          <p className="font-display text-xl font-semibold">No stories to find puzzles in yet</p>
          <Link to="/" className="btn btn-primary mt-2">
            Browse stories
          </Link>
        </div>
      )}

      <ul className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {stories.map((book) => {
          const record = collection[book.slug];
          return (
            <li key={book.id}>
              {record ? (
                <button
                  type="button"
                  onClick={() => setOpenBook(book)}
                  className="wiggle group block w-full text-left"
                  aria-label={`Play the ${book.title} puzzle`}
                >
                  <div className="relative transition group-hover:-translate-y-1">
                    <Cover book={book} className="shadow-[0_6px_0_var(--color-ink)]" />
                    <span className="absolute left-2.5 top-2.5 rounded-full border-[2.5px] border-ink bg-white px-2.5 py-0.5 text-[13px] font-extrabold shadow-[0_2px_0_var(--color-ink)]">
                      {record.completedAt ? '✓ Built' : '🧩 New'}
                    </span>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold leading-tight">{book.title}</p>
                  <p className="text-sm font-bold text-ink-soft">{record.completedAt ? 'Play again' : 'Build it'}</p>
                </button>
              ) : (
                <Link to={`/books/${book.slug}`} className="group block">
                  <div className="grid aspect-[4/5] place-items-center rounded-[1.5rem] border-[3px] border-dashed border-ink/40 bg-white/60 text-center transition group-hover:border-ink">
                    <div className="px-3">
                      <span className="block text-5xl opacity-40 grayscale" aria-hidden>
                        🧩
                      </span>
                      <span className="mt-2 block text-sm font-bold text-ink-soft">Find it by reading this story</span>
                    </div>
                  </div>
                  <p className="mt-3 font-display text-lg font-semibold leading-tight">{book.title}</p>
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {next && found.length > 0 && (
        <p className="text-center text-ink-soft">
          Tonight’s idea: read{' '}
          <Link to={`/books/${next.slug}`} className="font-bold text-primary underline">
            {next.title}
          </Link>{' '}
          to find another puzzle.
        </p>
      )}

      {openBook && (
        <PuzzleDialog
          book={openBook}
          age={active?.age ?? null}
          onComplete={() => complete(openBook.slug)}
          onClose={() => setOpenBook(null)}
        />
      )}
    </div>
  );
}
