import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Promo } from '../api';
import { countdownParts, remainingMs, spokenCountdown } from '../lib/promo';

const nowMs = () => Date.now();

/**
 * The launch-offer countdown, for grown-ups (it is shown on the landing page and the plans page, never in the reader).
 *
 * It counts down to an instant the server decided (`promo.endsAt`) and corrects for a wrong device clock using the
 * server's `serverNow`, so it can never promise time the server will not honour. When it reaches zero it asks the
 * parent to refetch, and the banner disappears along with the offer prices.
 */
export function PromoBanner({
  promo,
  serverNow,
  onExpire,
  cta = false,
}: {
  promo: Promo;
  serverNow: string;
  onExpire?: () => void;
  cta?: boolean;
}) {
  const [openedAt] = useState(nowMs);
  const [left, setLeft] = useState(() => remainingMs(promo.endsAt, serverNow));
  const expire = useRef(onExpire);
  useEffect(() => {
    expire.current = onExpire;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const ms = remainingMs(promo.endsAt, serverNow, nowMs() - openedAt);
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(id);
        expire.current?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [promo.endsAt, serverNow, openedAt]);

  if (left <= 0) return null;
  const parts = countdownParts(left);
  const ends = new Date(promo.endsAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const cells: [number, string][] = [
    [parts.days, 'days'],
    [parts.hours, 'hrs'],
    [parts.minutes, 'min'],
    [parts.seconds, 'sec'],
  ];

  return (
    <section
      aria-label={`${promo.label}: ${promo.percent}% off`}
      className="sticker flex flex-wrap items-center gap-x-6 gap-y-3 rounded-card !bg-sun p-4 sm:px-6"
    >
      <div className="min-w-0 flex-1 basis-56">
        <p className="font-display text-xl font-bold leading-tight">
          <span aria-hidden>🎁 </span>
          {promo.label}: {promo.percent}% off your first payment
        </p>
        <p className="text-sm font-semibold text-ink/80">Ends {ends}. After that, regular prices.</p>
      </div>
      <div role="timer" aria-label={`Offer ends in ${spokenCountdown(parts)}`} className="flex gap-2">
        {cells.map(([n, unit]) => (
          <div key={unit} className="min-w-14 rounded-xl border-[3px] border-ink bg-paper px-2 py-1 text-center">
            <div className="font-display text-2xl font-bold leading-none tabular-nums" aria-hidden>
              {String(n).padStart(2, '0')}
            </div>
            <div className="text-[11px] font-extrabold uppercase text-ink-soft" aria-hidden>
              {unit}
            </div>
          </div>
        ))}
      </div>
      {cta && (
        <Link to="/plans" className="btn btn-primary">
          Claim the offer
        </Link>
      )}
    </section>
  );
}
