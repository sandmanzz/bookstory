import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, type PageContent, type ReadResult } from '../api';
import { useAuth } from '../auth';
import { ActivityLayer } from '../components/book/ActivityLayer';
import { Book, type Sheet } from '../components/book/Book';
import { CoverFace, EndDecorationFace, IllustrationFace, PageFace, TextFace } from '../components/book/faces';
import { clamp } from '../components/book/math';
import { CheckoutDialog, type CheckoutTarget } from '../components/Checkout';
import { Confetti } from '../components/Confetti';
import { QuestionCard } from '../components/QuestionCard';
import { EndPage } from '../components/reader/EndPage';
import { PageDots } from '../components/reader/PageDots';
import { ErrorPanel, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { useSfx } from '../hooks/useSfx';
import { useSpeech } from '../hooks/useSpeech';
import { countStars, maxStars, stickersComplete } from '../lib/activity';
import { loadProgress, resumePoint, saveProgress } from '../lib/progress';
import { loadRewards, saveRewards } from '../lib/rewards';
import { useProfiles } from '../profiles';
import { usePuzzleCollection } from '../hooks/usePuzzles';
import { PuzzleDialog } from '../components/puzzle/PuzzleDialog';
import { NotFound } from './BookDetail';

/** Wide, tall-enough screens get an open two-page spread; everything else gets one page at a time. */
const SPREAD_QUERY = '(min-width: 900px) and (min-height: 560px)';
const ROUND_BUTTON =
  'grid size-16 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display text-3xl font-bold shadow-[0_5px_0_var(--color-ink)] transition active:translate-y-1 active:shadow-none disabled:opacity-30 disabled:shadow-none sm:size-20';

export function Reader() {
  const { slug = '' } = useParams();
  const { data, error, loading, reload } = useAsync(() => api.read(slug), [slug]);
  const { profileId } = useProfiles();

  if (loading && !data) return <Spinner label="Opening the book" />;
  if (error?.status === 404) return <NotFound />;
  if (error || !data) return <ErrorPanel message={error?.message ?? 'Could not open this book'} onRetry={reload} />;
  // Re-key on `locked` so buying a book remounts the reader at the right page, with the full text.
  return <ReaderView key={`${data.book.id}:${data.locked}:${profileId}`} data={data} />;
}

function ReaderView({ data }: { data: ReadResult }) {
  const { book, pages, locked, totalPages } = data;
  const { me } = useAuth();
  const navigate = useNavigate();
  const { profileId, active } = useProfiles();
  const { collection: album, unlock: unlockPuzzle, complete: completePuzzle } = usePuzzleCollection(profileId);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const speech = useSpeech();
  const spread = useMediaQuery(SPREAD_QUERY);

  const pageCount = pages.length;
  const sheetCount = pageCount + 1; // cover + one sheet per readable page
  const [flipped, setFlipped] = useState(() => resumePoint(loadProgress(profileId, book.slug), pageCount, locked));
  const [night, setNight] = useState(false);
  const sfx = useSfx();
  // Rewards live for this reading session: finding every sticker on a page, and answering its question, earn a star each.
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set(loadRewards(profileId, book.slug).found));
  const [answered, setAnswered] = useState<ReadonlySet<number>>(() => new Set(loadRewards(profileId, book.slug).answered));
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);

  const atEnd = flipped === sheetCount;
  const currentPage = flipped >= 1 && flipped <= pageCount ? pages[flipped - 1] : undefined;
  const question = currentPage?.activity?.question ?? null;
  const stars = countStars(pages, found, answered);
  const starTotal = maxStars(pages);

  const turn = useCallback(
    (to: number) => {
      speech.stop();
      const next = clamp(to, 0, sheetCount);
      setFlipped(next);
      // Reaching the last page of a full book finds its puzzle. Re-reading finds nothing new.
      if (next === sheetCount && !locked) unlockPuzzle(book.slug);
    },
    [speech, sheetCount, locked, unlockPuzzle, book.slug],
  );

  useEffect(() => saveProgress(profileId, book.slug, flipped), [profileId, book.slug, flipped]);
  useEffect(
    () => saveRewards(profileId, book.slug, { found: [...found], answered: [...answered] }),
    [profileId, book.slug, found, answered],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (checkout) return;
      if (e.key === 'ArrowRight') turn(flipped + 1);
      else if (e.key === 'ArrowLeft') turn(flipped - 1);
      else if (e.key === 'Escape') navigate(`/books/${book.slug}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn, flipped, checkout, navigate, book.slug]);

  const buy = () => (me ? setCheckout({ kind: 'book', book }) : navigate('/login', { state: { next: `/read/${book.slug}` } }));

  const handleFound = useCallback(
    (page: PageContent, key: string) => {
      if (found.has(key)) return;
      const next = new Set(found).add(key);
      setFound(next);
      if (stickersComplete(page, next)) sfx.play('star');
    },
    [found, sfx],
  );

  const sheets = useMemo<Sheet[]>(() => {
    const side = spread ? 'right' : 'single';
    const overlay = (page: PageContent) => (
      <ActivityLayer page={page} found={found} onFound={(key) => handleFound(page, key)} play={sfx.play} />
    );
    const cover: Sheet = {
      front: <CoverFace book={book} side={side} />,
      back: !spread ? (
        <div />
      ) : pages[0] ? (
        <IllustrationFace book={book} page={pages[0]} overlay={overlay(pages[0])} />
      ) : (
        <EndDecorationFace book={book} locked={locked} />
      ),
    };
    const rest = pages.map<Sheet>((page, i) => {
      const next = pages[i + 1];
      if (!spread) return { front: <PageFace book={book} page={page} overlay={overlay(page)} />, back: <div /> };
      return {
        front: <TextFace page={page} />,
        back: next ? (
          <IllustrationFace book={book} page={next} overlay={overlay(next)} />
        ) : (
          <EndDecorationFace book={book} locked={locked} />
        ),
      };
    });
    return [cover, ...rest];
  }, [book, pages, locked, spread, found, handleFound, sfx.play]);

  const endPage = (
    <EndPage
      side={spread ? 'right' : 'single'}
      book={book}
      locked={locked}
      readablePages={pageCount}
      totalPages={totalPages}
      stars={stars}
      starTotal={starTotal}
      onBuy={buy}
      onRestart={() => turn(0)}
      puzzle={locked ? undefined : { built: Boolean(album[book.slug]?.completedAt), onPlay: () => setPuzzleOpen(true) }}
    />
  );

  const background = night ? '#1b1840' : `linear-gradient(180deg, ${book.coverTo}55, #fff6e3 70%), #fff6e3`;
  // A question card takes vertical space from the book; phones stack the card, so they need more.
  const reserve = question ? (spread ? '370px' : '440px') : undefined;

  return (
    // Immersive: covers the site chrome so nothing distracts a child mid-story.
    <div
      className="fixed inset-0 z-[45] overflow-y-auto"
      style={{ background, ...(reserve ? ({ '--book-reserve': reserve } as CSSProperties) : {}) }}
    >
      <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-4">
        <div className="flex items-center gap-2">
          <Link to={`/books/${book.slug}`} className="btn btn-ghost !min-h-12 !px-4" aria-label="Close book">
            ✕<span className="hidden sm:inline"> Close</span>
          </Link>
          <span className="flex-1 sm:hidden" />
          <h1 className={`hidden min-w-0 flex-1 truncate text-center text-lg font-semibold sm:block ${night ? 'text-white' : ''}`}>
            {book.title}
          </h1>
          {starTotal > 0 && (
            <span
              key={stars}
              role="status"
              aria-label={`${stars} of ${starTotal} stars earned`}
              className="star-pop inline-flex items-center gap-1 rounded-full border-[3px] border-ink bg-sun px-3 py-1.5 font-display font-bold"
            >
              ⭐ {stars}
            </span>
          )}
          <button
            className="btn btn-ghost !min-h-12 !px-4"
            onClick={sfx.toggleMuted}
            aria-pressed={sfx.muted}
            aria-label={sfx.muted ? 'Turn sound effects on' : 'Turn sound effects off'}
          >
            {sfx.muted ? '🔇' : '🎵'}
          </button>
          <button className="btn btn-ghost !min-h-12 !px-4" onClick={() => setNight(!night)} aria-pressed={night} aria-label="Bedtime mode">
            {night ? '☀️' : '🌙'}
          </button>
        </div>

        <div className="grid flex-1 place-items-center py-3">
          <Book
            sheets={sheets}
            flipped={flipped}
            onFlip={turn}
            layout={spread ? 'spread' : 'single'}
            endPage={endPage}
            label={`${book.title}, a picture book`}
          />
        </div>

        {question && currentPage && (
          <QuestionCard
            key={currentPage.position}
            question={question}
            solved={answered.has(currentPage.position)}
            onCorrect={() => setAnswered((prev) => new Set(prev).add(currentPage.position))}
            play={sfx.play}
          />
        )}

        <p className="sr-only" aria-live="polite">
          {currentPage
            ? `Page ${flipped} of ${totalPages}. ${currentPage.text}`
            : atEnd
              ? locked
                ? 'End of the free preview.'
                : 'The end.'
              : 'Closed book. Press the next button to open it.'}
        </p>

        <div className="flex items-center gap-3 pb-2">
          <button
            className={`${ROUND_BUTTON} bg-white`}
            onClick={() => turn(flipped - 1)}
            disabled={flipped === 0}
            aria-label="Previous page"
          >
            ←
          </button>
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2">
            {speech.supported && currentPage && (
              <button
                className="btn btn-sun !min-h-12"
                onClick={() =>
                  speech.speaking ? speech.stop() : speech.speak(question ? `${currentPage.text} ${question.prompt}` : currentPage.text)
                }
                aria-pressed={speech.speaking}
              >
                {speech.speaking ? '⏹ Stop' : '🔊 Read to me'}
              </button>
            )}
            <PageDots current={flipped} readable={pageCount} total={totalPages} />
          </div>
          <button
            className={`${ROUND_BUTTON} bg-primary text-white`}
            onClick={() => turn(flipped + 1)}
            disabled={atEnd}
            aria-label={flipped === 0 ? 'Open the book' : 'Next page'}
          >
            →
          </button>
        </div>
      </div>

      {atEnd && !locked && <Confetti />}
      {puzzleOpen && (
        <PuzzleDialog
          book={book}
          age={active?.age ?? null}
          onComplete={() => completePuzzle(book.slug)}
          onClose={() => setPuzzleOpen(false)}
        />
      )}
      {checkout && <CheckoutDialog target={checkout} onClose={() => setCheckout(null)} onSuccess={() => setCheckout(null)} />}
    </div>
  );
}
