import { useEffect, useRef, useState, type ReactNode } from 'react';
import { imageUrl, money, type Book } from '../api';

export const LockIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <rect x="4" y="11" width="16" height="10" rx="3" />
    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
  </svg>
);
export const CheckIcon = ({ className = 'size-4' }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="3.4"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="m5 12 5 5 9-10" />
  </svg>
);

/** "Twinkle", the MainStory mascot. Pure SVG so it scales crisply and ships with no asset. */
export function Mascot({ className = 'size-24', mood = 'happy' }: { className?: string; mood?: 'happy' | 'sleepy' | 'cheer' }) {
  return (
    <svg viewBox="0 0 120 120" className={className} role="img" aria-label="Twinkle the star">
      <path
        d="M60 8l14.5 31.2 34 4-25.2 23.3 6.8 33.7L60 83.6 29.9 100.2l6.8-33.7L11.5 43.2l34-4z"
        fill="#FFC93C"
        stroke="#2B2350"
        strokeWidth="5"
        strokeLinejoin="round"
      />
      {mood === 'sleepy' ? (
        <g stroke="#2B2350" strokeWidth="4.5" strokeLinecap="round" fill="none">
          <path d="M42 58q5 5 10 0" />
          <path d="M68 58q5 5 10 0" />
        </g>
      ) : (
        <g fill="#2B2350">
          <circle cx="47" cy="57" r="5.5" />
          <circle cx="73" cy="57" r="5.5" />
          <circle cx="49" cy="55" r="1.8" fill="#fff" />
          <circle cx="75" cy="55" r="1.8" fill="#fff" />
        </g>
      )}
      <circle cx="37" cy="70" r="6" fill="#FF8FC7" opacity=".8" />
      <circle cx="83" cy="70" r="6" fill="#FF8FC7" opacity=".8" />
      {mood === 'cheer' ? (
        <path d="M50 70q10 14 20 0z" fill="#2B2350" />
      ) : (
        <path d="M51 70q9 9 18 0" stroke="#2B2350" strokeWidth="4.5" strokeLinecap="round" fill="none" />
      )}
    </svg>
  );
}

/** Shows an illustration if present and loadable; otherwise renders the fallback (emoji + gradient). */
export function StoryImage({ src, className = '', fallback }: { src?: string | null; className?: string; fallback: ReactNode }) {
  // Remember *which* src failed, so a new src gets a fresh attempt without an effect to reset state.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  return <img src={imageUrl(src)} alt="" loading="lazy" draggable={false} onError={() => setFailedSrc(src)} className={className} />;
}

export function Cover({
  book,
  className = '',
}: {
  book: Pick<Book, 'coverEmoji' | 'coverFrom' | 'coverTo' | 'coverUrl' | 'title'>;
  className?: string;
}) {
  return (
    <div
      className={`relative grid aspect-[4/5] place-items-center overflow-hidden rounded-[1.5rem] border-[3px] border-ink ${className}`}
      style={{ background: `linear-gradient(150deg, ${book.coverFrom}, ${book.coverTo})` }}
      role="img"
      aria-label={`Cover of ${book.title}`}
    >
      <StoryImage
        src={book.coverUrl}
        className="absolute inset-0 size-full object-cover"
        fallback={
          <>
            <span className="absolute left-4 top-3 text-xl opacity-70 twinkle" aria-hidden>
              ✦
            </span>
            <span className="absolute bottom-5 right-4 text-lg opacity-70 twinkle" aria-hidden>
              ✦
            </span>
            <span className="bob text-[5.5rem] drop-shadow-[0_6px_0_rgba(43,35,80,.25)]" aria-hidden>
              {book.coverEmoji}
            </span>
          </>
        }
      />
      <div className="absolute inset-y-0 left-0 w-3 border-r-[3px] border-ink/60 bg-black/10" aria-hidden />
    </div>
  );
}

/** Single place that translates an access decision into what the user sees. Never colour alone: icon + text. */
export function AccessBadge({ book, currency }: { book: Book; currency: string }) {
  const { access } = book;
  const base =
    'inline-flex items-center gap-1 rounded-full border-[2.5px] border-ink px-2.5 py-0.5 text-[13px] font-extrabold shadow-[0_2px_0_var(--color-ink)]';
  if (access.canRead) {
    const label = { free: 'Free', purchased: 'Owned', subscription: 'Included', admin: 'Staff', locked: '', unavailable: '' }[
      access.reason
    ];
    return (
      <span className={`${base} bg-[#a8f0d3] text-ink`}>
        <CheckIcon className="size-3.5" /> {label}
      </span>
    );
  }
  return (
    <span className={`${base} bg-sun text-ink`}>
      <LockIcon className="size-3.5" /> {money(book.price, currency)}
    </span>
  );
}

export function StatusPill({ status }: { status: Book['status'] }) {
  const style = { published: 'bg-mint-soft text-mint', draft: 'bg-lock-soft text-[#9a5b00]', archived: 'bg-line text-ink-soft' }[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-extrabold capitalize ${style}`}>{status}</span>;
}

export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-end bg-ink/60 p-0 sm:place-items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="pop sticker max-h-[92dvh] w-full max-w-md overflow-auto rounded-t-[2rem] !bg-cream p-6 outline-none sm:rounded-[2rem]"
      >
        {children}
      </div>
    </div>
  );
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-2xl border-[2.5px] border-coral bg-[#ffe3dc] px-3.5 py-2.5 text-sm font-bold text-[#a5311a]">
      {message}
    </p>
  );
}

/** A full-section failure with a way forward: errors that only describe the problem leave a parent stuck. */
export function ErrorPanel({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="sticker mx-auto grid max-w-md place-items-center gap-3 rounded-card p-8 text-center">
      <Mascot className="size-20" mood="sleepy" />
      <p className="font-display text-xl font-semibold">Oops, that didn’t load</p>
      <p className="text-ink-soft">{message}</p>
      <button className="btn btn-primary" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" className="grid place-items-center py-16 text-ink-soft">
      <Mascot className="bob size-20" mood="sleepy" />
      <span className="mt-2 font-display text-lg">{label}…</span>
    </div>
  );
}
