const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

/** Splits a remaining time into whole days, hours, minutes and seconds. Never negative. */
export function countdownParts(ms: number): CountdownParts {
  const left = Math.max(0, Math.floor(ms / SECOND) * SECOND);
  return {
    days: Math.floor(left / DAY),
    hours: Math.floor((left % DAY) / HOUR),
    minutes: Math.floor((left % HOUR) / MINUTE),
    seconds: Math.floor((left % MINUTE) / SECOND),
  };
}

/** Milliseconds until `endsAt`, judged on the server's clock (`serverNow` was true `elapsed` ms ago). Negative once it is over. */
export const remainingMs = (endsAt: string, serverNow: string, elapsed = 0): number =>
  Date.parse(endsAt) - (Date.parse(serverNow) + elapsed);

const two = (n: number) => String(n).padStart(2, '0');

/** "5d 04:12:09" for display, "04:12:09" under a day. */
export function formatCountdown(p: CountdownParts): string {
  const clock = `${two(p.hours)}:${two(p.minutes)}:${two(p.seconds)}`;
  return p.days > 0 ? `${p.days}d ${clock}` : clock;
}

/** A sentence for screen readers. A ticking timer must not be announced every second, so this is only its label. */
export function spokenCountdown(p: CountdownParts): string {
  const unit = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (p.days > 0) return `${unit(p.days, 'day')} ${unit(p.hours, 'hour')}`;
  if (p.hours > 0) return `${unit(p.hours, 'hour')} ${unit(p.minutes, 'minute')}`;
  return `${unit(p.minutes, 'minute')} ${unit(p.seconds, 'second')}`;
}
