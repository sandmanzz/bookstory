import { describe, expect, it } from 'vitest';
import {
  HINT_AFTER_MISSES,
  gridForAge,
  hintSlot,
  isComplete,
  pickHeadStart,
  pieceCount,
  placedCount,
  shuffledOrder,
  startPuzzle,
  tryPlace,
} from './puzzle';

describe('gridForAge', () => {
  it('uses fewer, bigger pieces for younger children and when the age is unknown', () => {
    expect(pieceCount(gridForAge(null))).toBe(4);
    expect(pieceCount(gridForAge(2))).toBe(4);
    expect(pieceCount(gridForAge(3))).toBe(4);
    expect(pieceCount(gridForAge(4))).toBe(6);
    expect(pieceCount(gridForAge(5))).toBe(6);
    expect(pieceCount(gridForAge(7))).toBe(9);
  });
});

describe('grid shape', () => {
  it('keeps pieces close to square on portrait art', () => {
    for (const age of [2, 4, 7]) {
      const { cols, rows } = gridForAge(age);
      const pieceAspect = 4 / cols / (5 / rows); // width / height of one piece when the picture is 4:5
      expect(pieceAspect).toBeGreaterThan(0.7);
      expect(pieceAspect).toBeLessThan(1.3);
    }
  });
});

describe('puzzle play', () => {
  it('starts with exactly one piece already placed', () => {
    const s = startPuzzle(4, 2);
    expect(placedCount(s)).toBe(1);
    expect(s.placed[2]).toBe(true);
  });

  it('places a piece only in its own slot', () => {
    const s = startPuzzle(4, 0);
    const wrong = tryPlace(s, 1, 3);
    expect(wrong.correct).toBe(false);
    expect(wrong.state.placed[1]).toBe(false);
    const right = tryPlace(s, 1, 1);
    expect(right.correct).toBe(true);
    expect(right.state.placed[1]).toBe(true);
  });

  it('never mutates the previous state', () => {
    const s = startPuzzle(4, 0);
    tryPlace(s, 1, 1);
    tryPlace(s, 2, 3);
    expect(placedCount(s)).toBe(1);
    expect(s.misses).toEqual([0, 0, 0, 0]);
  });

  it('ignores moves for pieces that are already placed or do not exist', () => {
    const s = startPuzzle(4, 0);
    expect(tryPlace(s, 0, 0).correct).toBe(false);
    expect(tryPlace(s, 9, 9).correct).toBe(false);
    expect(tryPlace(s, -1, 0).correct).toBe(false);
  });

  it('is complete only when every piece is home', () => {
    let s = startPuzzle(4, 0);
    for (const i of [1, 2]) s = tryPlace(s, i, i).state;
    expect(isComplete(s)).toBe(false);
    s = tryPlace(s, 3, 3).state;
    expect(isComplete(s)).toBe(true);
  });

  it('reveals the home slot only after repeated misses, and not once placed', () => {
    let s = startPuzzle(4, 0);
    expect(hintSlot(s, 1)).toBeNull();
    for (let i = 0; i < HINT_AFTER_MISSES; i++) s = tryPlace(s, 1, 2).state;
    expect(hintSlot(s, 1)).toBe(1);
    s = tryPlace(s, 1, 1).state;
    expect(hintSlot(s, 1)).toBeNull();
  });
});

describe('randomness helpers', () => {
  it('shuffles into a permutation of all pieces', () => {
    for (const r of [0, 0.3, 0.99]) {
      expect([...shuffledOrder(9, () => r)].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    }
  });
  it('picks a head-start piece inside the range', () => {
    expect(pickHeadStart(4, () => 0)).toBe(0);
    expect(pickHeadStart(4, () => 0.999)).toBe(3);
  });
});
