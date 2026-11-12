/** Where you are in the book. Locked pages (beyond a free preview) show a padlock instead of a dot. */
export function PageDots({ current, readable, total }: { current: number; readable: number; total: number }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-1.5"
      role="img"
      aria-label={`Page ${Math.min(current, total)} of ${total}`}
    >
      {Array.from({ length: total }, (_, n) =>
        n < readable ? (
          <span
            key={n}
            className={`size-2.5 rounded-full border-2 border-ink transition-all ${n + 1 === current ? 'w-6 bg-primary' : n + 1 < current ? 'bg-primary/40' : 'bg-white'}`}
          />
        ) : (
          <span key={n} className="text-xs leading-none opacity-60">
            🔒
          </span>
        ),
      )}
    </div>
  );
}
