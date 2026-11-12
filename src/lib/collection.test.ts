import { describe, expect, it } from 'vitest';
import { builtCount, completePuzzle, foundCount, parseCollection, unlockPuzzle } from './collection';

const t1 = new Date('2026-01-01T10:00:00Z');
const t2 = new Date('2026-01-02T10:00:00Z');

describe('puzzle album', () => {
  it('finds a puzzle once; reading the story again changes nothing', () => {
    const a = unlockPuzzle({}, 'moon', t1);
    const b = unlockPuzzle(a, 'moon', t2);
    expect(b).toBe(a);
    expect(foundCount(b)).toBe(1);
    expect(b.moon?.unlockedAt).toBe(t1.toISOString());
  });

  it('only completes puzzles that were found, and keeps the first completion time', () => {
    expect(completePuzzle({}, 'moon', t1)).toEqual({});
    const found = unlockPuzzle({}, 'moon', t1);
    const done = completePuzzle(found, 'moon', t1);
    expect(builtCount(done)).toBe(1);
    expect(completePuzzle(done, 'moon', t2).moon?.completedAt).toBe(t1.toISOString());
  });

  it('counts found and built separately', () => {
    let c = unlockPuzzle(unlockPuzzle({}, 'a', t1), 'b', t1);
    c = completePuzzle(c, 'a', t2);
    expect([foundCount(c), builtCount(c)]).toEqual([2, 1]);
  });

  it('parses saved data defensively', () => {
    expect(parseCollection(null)).toEqual({});
    expect(parseCollection('{oops')).toEqual({});
    const raw = JSON.stringify({
      ok: { unlockedAt: 'x', completedAt: 'y' },
      bad: { nope: 1 },
      nul: null,
      half: { unlockedAt: 'z', completedAt: 5 },
    });
    expect(parseCollection(raw)).toEqual({ ok: { unlockedAt: 'x', completedAt: 'y' }, half: { unlockedAt: 'z' } });
  });
});
