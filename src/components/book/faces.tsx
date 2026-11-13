import type { CSSProperties, ReactNode } from 'react';
import type { Book, PageContent } from '../../api';
import { Mascot, StoryImage } from '../ui';
import { bookTitle } from '../../lib/i18n';
import { useReaderText } from '../reader/ReaderText';
import { PageText } from './PageText';

/** Which edge of the sheet sits on the spine. `single` is a lone page (phones). */
export type Side = 'right' | 'left' | 'single';

const FRAME: Record<Side, string> = {
  right: 'rounded-r-[1.25rem] border-[3px] border-l-0',
  left: 'rounded-l-[1.25rem] border-[3px] border-r-0',
  single: 'rounded-[1.25rem] border-[3px]',
};

/** A sheet of paper with an ink outline and a soft shadow where it meets the spine. */
export function Paper({
  side,
  children,
  className = '',
  style,
}: {
  side: Side;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  const spineOnLeft = side !== 'left';
  return (
    <div
      className={`relative size-full overflow-hidden border-ink bg-[#fffdf6] [container-type:inline-size] ${FRAME[side]} ${className}`}
      style={style}
    >
      {children}
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 w-[12%] from-ink/25 to-transparent ${spineOnLeft ? 'left-0 bg-gradient-to-r' : 'right-0 bg-gradient-to-l'}`}
      />
    </div>
  );
}

const gradient = (b: Pick<Book, 'coverFrom' | 'coverTo'>) => `linear-gradient(150deg, ${b.coverFrom}, ${b.coverTo})`;

function PageNumber({ n, side }: { n: number; side: Side }) {
  return (
    <span
      className={`absolute bottom-[3%] grid size-8 place-items-center rounded-full border-2 border-ink bg-sun font-display text-sm font-bold ${side === 'left' ? 'left-[6%]' : 'right-[6%]'}`}
    >
      {n}
    </span>
  );
}

function Illustration({ book, page, overlay }: { book: Book; page: PageContent; overlay?: ReactNode }) {
  return (
    <div className="absolute inset-0" style={{ background: gradient(book) }}>
      <StoryImage
        src={page.imageUrl}
        className="absolute inset-0 size-full object-cover"
        fallback={
          <span className="absolute inset-0 grid place-items-center" style={{ fontSize: 'clamp(5rem, 38cqw, 11rem)' }} aria-hidden>
            {page.emoji}
          </span>
        }
      />
      {overlay}
    </div>
  );
}

export function CoverFace({ book, side }: { book: Book; side: Side }) {
  const { langs } = useReaderText();
  return (
    // A closed book shows its spine edge, so the cover keeps an outline on the hinge side too.
    <Paper side={side} className="!rounded-l-[0.6rem] !border-l-[3px]" style={{ background: gradient(book) }}>
      <StoryImage
        src={book.coverUrl}
        className="absolute inset-0 size-full object-cover"
        fallback={
          <span className="absolute inset-0 grid place-items-center pb-[18%]" style={{ fontSize: 'clamp(5rem, 40cqw, 12rem)' }} aria-hidden>
            {book.coverEmoji}
          </span>
        }
      />
      <div className="absolute inset-x-0 bottom-0 border-t-[3px] border-ink bg-white/95 px-4 py-3 text-center">
        {langs.map((lang, i) => (
          <p
            key={lang}
            lang={lang}
            className={
              i === 0 ? 'font-display text-xl font-bold leading-tight sm:text-2xl' : 'font-display text-sm font-semibold text-ink-soft'
            }
          >
            {bookTitle(book, lang)}
          </p>
        ))}
        <p className="mt-0.5 animate-pulse text-sm font-bold text-primary motion-reduce:animate-none">Tap or swipe to open →</p>
      </div>
    </Paper>
  );
}

/** Left-hand page of a spread: the picture. */
export function IllustrationFace({ book, page, overlay }: { book: Book; page: PageContent; overlay?: ReactNode }) {
  return (
    <Paper side="left">
      <Illustration book={book} page={page} overlay={overlay} />
      <PageNumber n={page.position} side="left" />
    </Paper>
  );
}

/** Right-hand page of a spread: the words. */
export function TextFace({ page }: { page: PageContent }) {
  return (
    <Paper side="right">
      <div className="grid size-full place-items-center p-[10%] text-center">
        <div className="font-display font-medium leading-snug" style={{ fontSize: 'clamp(1.3rem, 7cqw, 2.6rem)' }}>
          <PageText page={page} />
        </div>
      </div>
      <PageNumber n={page.position} side="right" />
    </Paper>
  );
}

/** A whole page on a phone: picture above, words below. */
export function PageFace({ book, page, overlay }: { book: Book; page: PageContent; overlay?: ReactNode }) {
  return (
    <Paper side="single">
      <div className="absolute inset-x-0 top-0 h-[56%] border-b-[3px] border-ink">
        <Illustration book={book} page={page} overlay={overlay} />
      </div>
      <div className="absolute inset-x-0 bottom-0 grid h-[44%] place-items-center px-[9%] pb-[17%] pt-[3%] text-center">
        <div className="font-display font-medium leading-snug" style={{ fontSize: 'clamp(1.1rem, 6cqw, 1.9rem)' }}>
          <PageText page={page} />
        </div>
      </div>
      <PageNumber n={page.position} side="single" />
    </Paper>
  );
}

/** Left-hand page after the last story page: pure decoration, the message lives on the right. */
export function EndDecorationFace({ locked, book }: { locked: boolean; book: Book }) {
  return (
    <Paper side="left" style={{ background: gradient(book) }}>
      <div className="grid size-full place-items-center">
        <Mascot className="bob w-[45%]" mood={locked ? 'sleepy' : 'cheer'} />
      </div>
    </Paper>
  );
}

export function EndPanel({ side, children }: { side: Side; children: ReactNode }) {
  return (
    <Paper side={side}>
      <div className="grid size-full place-content-center justify-items-center gap-3 p-[8%] text-center">{children}</div>
    </Paper>
  );
}
