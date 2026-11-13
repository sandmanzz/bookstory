import { describe, expect, it } from 'vitest';
import { countdownParts, formatCountdown, remainingMs, spokenCountdown } from './promo';

const S = 1000;
const M = 60 * S;
const H = 60 * M;
const D = 24 * H;

describe('countdownParts', () => {
  it('splits into days, hours, minutes and seconds', () => {
    expect(countdownParts(5 * D + 4 * H + 12 * M + 9 * S)).toEqual({ days: 5, hours: 4, minutes: 12, seconds: 9 });
  });
  it('drops fractions of a second and never goes negative', () => {
    expect(countdownParts(1999)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 1 });
    expect(countdownParts(-5000)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  });
});

describe('remainingMs', () => {
  it('counts down on the server clock, not the device clock', () => {
    // server says it is 10:00:00 now; the offer ends at 10:30:00
    expect(remainingMs('2026-11-30T10:30:00Z', '2026-11-30T10:00:00Z')).toBe(30 * M);
    expect(remainingMs('2026-11-30T10:30:00Z', '2026-11-30T10:00:00Z', 5 * M)).toBe(25 * M);
  });
  it('is zero or negative once the end has passed', () => {
    expect(remainingMs('2026-11-30T10:30:00Z', '2026-11-30T10:30:00Z')).toBe(0);
    expect(remainingMs('2026-11-30T10:30:00Z', '2026-11-30T11:00:00Z')).toBeLessThan(0);
  });
});

describe('formatCountdown', () => {
  it('shows days only when there are some, and pads the clock', () => {
    expect(formatCountdown({ days: 5, hours: 4, minutes: 2, seconds: 9 })).toBe('5d 04:02:09');
    expect(formatCountdown({ days: 0, hours: 0, minutes: 7, seconds: 5 })).toBe('00:07:05');
  });
});

describe('spokenCountdown', () => {
  it('uses the two largest units and singular words', () => {
    expect(spokenCountdown({ days: 1, hours: 4, minutes: 2, seconds: 9 })).toBe('1 day 4 hours');
    expect(spokenCountdown({ days: 0, hours: 2, minutes: 1, seconds: 9 })).toBe('2 hours 1 minute');
    expect(spokenCountdown({ days: 0, hours: 0, minutes: 0, seconds: 1 })).toBe('0 minutes 1 second');
  });
});
