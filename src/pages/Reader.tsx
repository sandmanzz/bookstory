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
import { PuzzleDialog } from '../components/puzzle/PuzzleDialog';
import { QuestionCard } from '../components/QuestionCard';
import { EndPage } from '../components/reader/EndPage';
import { FinishDialog } from '../components/reader/FinishDialog';
import { PageDots } from '../components/reader/PageDots';
import { ReaderTextProvider } from '../components/reader/ReaderText';
import { ErrorPanel, Spinner } from '../components/ui';
import { useAsync } from '../hooks/useAsync';
import { useAutoRead } from '../hooks/useAutoRead';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { usePuzzleCollection } from '../hooks/usePuzzles';
import { useReadAloud, type Line } from '../hooks/useReadAloud';
import { useSfx } from '../hooks/useSfx';
import { useLanguage } from '../language';
import { countStars, maxStars, stickersComplete } from '../lib/activity';
import { LANG_CODE, activeLangs, bookTitle, pageText, primaryLang, questionPrompt, t } from '../lib/i18n';
import { loadProgress, resumePoint, saveProgress } from '../lib/progress';
import { loadRewards, saveRewards } from '../lib/rewards';
import { useProfiles } from '../profiles';
import { NotFound } from './BookDetail';

/** Wide, tall-enough screens get an open two-page spread; everything else gets one page at a time. */
const SPREAD_QUERY = '(min-width: 900px) and (min-height: 560px)';
const ROUND_BUTTON =
  'grid size-14 shrink-0 place-items-center rounded-full border-[3px] border-ink font-display text-3xl font-bold shadow-[0_5px_0_var(--color-ink)] transition active:translate-y-1 active:shadow-none disabled:opacity-30 disabled:shadow-none sm:size-20';

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
  const { mode, cycle } = useLanguage();
  const { collection: album, unlock: unlockPuzzle, complete: completePuzzle } = usePuzzleCollection(profileId);
  const readAloud = useReadAloud();
  const spread = useMediaQuery(SPREAD_QUERY);
  const sfx = useSfx();

  // Languages shown on the pages: what the reader chose, reduced to what this book fully supports.
  const langs = useMemo(() => activeLangs(book, mode), [book, mode]);
  const ui = primaryLang(langs);

  const pageCount = pages.length;
  const sheetCount = pageCount + 1; // cover + one sheet per readable page
  const [flipped, setFlipped] = useState(() => resumePoint(loadProgress(profileId, book.slug), pageCount, locked));
  const [night, setNight] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
  const [puzzleOpen, setPuzzleOpen] = useState(false);
  const [showFinish, setShowFinish] = useState(false);
  const [checkout, setCheckout] = useState<CheckoutTarget | null>(null);
  // Rewards: finding every sticker on a page, and answering its question, earn a star each.
  const [found, setFound] = useState<ReadonlySet<string>>(() => new Set(loadRewards(profileId, book.slug).found));
  const [answered, setAnswered] = useState<ReadonlySet<number>>(() => new Set(loadRewards(profileId, book.slug).answered));

  const atEnd = flipped === sheetCount;
  const currentPage = flipped >= 1 && flipped <= pageCount ? pages[flipped - 1] : undefined;
  const question = currentPage?.activity?.question ?? null;
  const stars = countStars(pages, found, answered);
  const starTotal = maxStars(pages);
  const { stop: stopReading } = readAloud;

  const turn = useCallback(
    (to: number) => {
      stopReading();
      const next = clamp(to, 0, sheetCount);
      setFlipped(next);
      if (next === sheetCount) {
        setAutoRead(false); // auto read ends with the book
        if (!locked) {
          // Finishing a full book: its puzzle is found, there is a celebration, and "what next" appears.
          unlockPuzzle(book.slug);
          setShowFinish(true);
          sfx.play('win');
        }
      }
    },
    [stopReading, sheetCount, locked, unlockPuzzle, book.slug, sfx],
  );

  useEffect(() => saveProgress(profileId, book.slug, flipped), [profileId, book.slug, flipped]);
  useEffect(
    () => saveRewards(profileId, book.slug, { found: [...found], answered: [...answered] }),
    [profileId, book.slug, found, answered],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (checkout || showFinish || puzzleOpen) return;
      if (e.key === 'ArrowRight') turn(flipped + 1);
      else if (e.key === 'ArrowLeft') turn(flipped - 1);
      else if (e.key === 'Escape') navigate(`/books/${book.slug}`);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [turn, flipped, checkout, showFinish, puzzleOpen, navigate, book.slug]);

  // What is said for the current page: each active language in order, then the question in the main language.
  const lines = useMemo<Line[]>(() => {
    if (!currentPage) return [];
    const spoken = langs.map((lang) => ({ text: pageText(currentPage, lang), lang }));
    return question ? [...spoken, { text: questionPrompt(question, ui), lang: ui }] : spoken;
  }, [currentPage, langs, question, ui]);

  const auto = useAutoRead({
    enabled: autoRead,
    stepKey: flipped,
    kind: flipped === 0 ? 'cover' : atEnd ? 'end' : 'page',
    restartKey: langs.join('+'),
    readPage: (onDone) => currentPage && readAloud.readLines(currentPage.position, lines, onDone),
    stop: readAloud.stop,
    hold: Boolean(question && currentPage && !answered.has(currentPage.position)),
    advance: () => turn(flipped + 1),
  });

  // Tapping a word says it. That interrupts any reading, so auto read pauses rather than fighting over the speaker.
  const onWord = useCallback(
    (word: string, lang: (typeof langs)[number]) => {
      setAutoRead(false);
      readAloud.speakWord(word, lang);
    },
    [readAloud],
  );
  const textState = useMemo(() => ({ langs, highlight: readAloud.highlight, onWord }), [langs, readAloud.highlight, onWord]);

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

  const puzzle = locked ? undefined : { built: Boolean(album[book.slug]?.completedAt), onPlay: () => setPuzzleOpen(true) };

  const endPage = (
    <EndPage
      side={spread ? 'right' : 'single'}
      book={book}
      locked={locked}
      readablePages={pageCount}
      totalPages={totalPages}
      stars={stars}
      starTotal={starTotal}
      lang={ui}
      onBuy={buy}
      onRestart={() => turn(0)}
      puzzle={puzzle}
    />
  );

  const background = night ? '#1b1840' : `linear-gradient(180deg, ${book.coverTo}55, #fff6e3 70%), #fff6e3`;
  // A question card takes vertical space from the book; phones stack the card, so they need more.
  const reserve = question ? (spread ? '370px' : '440px') : undefined;
  const missingVoice = readAloud.supported && readAloud.voicesReady && langs.some((l) => !readAloud.hasVoice(l));

  return (
    <ReaderTextProvider value={textState}>
      {/* Immersive: covers the site chrome so nothing distracts a child mid-story. */}
      <div
        className="fixed inset-0 z-[45] overflow-y-auto"
        style={{ background, ...(reserve ? ({ '--book-reserve': reserve } as CSSProperties) : {}) }}
      >
        <div className="mx-auto flex min-h-full max-w-5xl flex-col px-4 py-4">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link to={`/books/${book.slug}`} className="btn btn-ghost !min-h-12 !px-4" aria-label={t(ui, 'close')}>
              ✕<span className="hidden sm:inline"> {t(ui, 'close')}</span>
            </Link>
            <span className="flex-1 sm:hidden" />
            <h1 className={`hidden min-w-0 flex-1 truncate text-center text-lg font-semibold sm:block ${night ? 'text-white' : ''}`}>
              {bookTitle(book, ui)}
            </h1>
            {starTotal > 0 && (
              <span
                key={stars}
                role="status"
                aria-label={`${stars} / ${starTotal} ${t(ui, 'stars')}`}
                className="star-pop inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border-[3px] border-ink bg-sun px-3 py-1.5 font-display font-bold"
              >
                ⭐ {stars}
              </span>
            )}
            {book.languages.length > 1 && (
              <button
                className="btn btn-ghost !min-h-12 shrink-0 whitespace-nowrap !px-2.5 !text-base"
                onClick={cycle}
                aria-label={`Language: ${langs.map((l) => LANG_CODE[l]).join(' and ')}. Tap to change`}
              >
                🌐 {langs.map((l) => LANG_CODE[l]).join('+')}
              </button>
            )}
            <button
              className="btn btn-ghost !min-h-12 shrink-0 !px-3.5"
              onClick={sfx.toggleMuted}
              aria-pressed={sfx.muted}
              aria-label={sfx.muted ? 'Turn sound effects on' : 'Turn sound effects off'}
            >
              {sfx.muted ? '🔇' : '🎵'}
            </button>
            <button
              className="btn btn-ghost !min-h-12 !px-4"
              onClick={() => setNight(!night)}
              aria-pressed={night}
              aria-label="Bedtime mode"
            >
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
              label={`${bookTitle(book, ui)}, a picture book`}
            />
          </div>

          {question && currentPage && (
            <QuestionCard
              key={currentPage.position}
              question={question}
              lang={ui}
              solved={answered.has(currentPage.position)}
              onCorrect={() => setAnswered((prev) => new Set(prev).add(currentPage.position))}
              play={sfx.play}
            />
          )}

          <p className="sr-only" aria-live="polite">
            {currentPage
              ? `Page ${flipped} of ${totalPages}.`
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
              {readAloud.supported && !atEnd && (
                <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                  {!autoRead && currentPage && (
                    <button
                      className="btn btn-sun !min-h-12 shrink-0 whitespace-nowrap !px-2.5 !text-[0.95rem] sm:!px-4 sm:!text-base"
                      onClick={() => (readAloud.speaking ? readAloud.stop() : readAloud.readLines(currentPage.position, lines))}
                      aria-pressed={readAloud.speaking}
                    >
                      {readAloud.speaking ? (
                        `⏹ ${t(ui, 'stop')}`
                      ) : (
                        <>
                          🔊 <span className="sm:hidden">{t(ui, 'readToMeShort')}</span>
                          <span className="hidden sm:inline">{t(ui, 'readToMe')}</span>
                        </>
                      )}
                    </button>
                  )}
                  <button
                    className={`btn !min-h-12 shrink-0 whitespace-nowrap !px-2.5 !text-[0.95rem] sm:!px-4 sm:!text-base ${autoRead ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAutoRead((v) => !v)}
                    aria-pressed={autoRead}
                  >
                    {autoRead ? (
                      `⏸ ${t(ui, 'pause')}`
                    ) : (
                      <>
                        ▶ <span className="sm:hidden">{t(ui, 'autoReadShort')}</span>
                        <span className="hidden sm:inline">{t(ui, 'autoRead')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
              {auto.waiting && <p className="text-center text-sm font-bold text-primary">{t(ui, 'autoWaiting')}</p>}
              {!auto.waiting && flipped === 1 && !autoRead && (
                <p className="text-center text-xs font-bold text-ink-soft">{t(ui, 'tapAWord')}</p>
              )}
              {missingVoice && <p className="text-center text-xs text-ink-soft">{t(ui, 'noVoice')}</p>}
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
        {showFinish && atEnd && !locked && (
          <FinishDialog
            book={book}
            lang={ui}
            stars={stars}
            starTotal={starTotal}
            puzzle={puzzle}
            finishedSlugs={Object.keys(album)}
            onReadAgain={() => turn(0)}
            onClose={() => setShowFinish(false)}
          />
        )}
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
    </ReaderTextProvider>
  );
}
