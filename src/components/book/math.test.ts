import { describe, expect, it } from 'vitest';
import {
  applyFlip,
  clamp,
  dragAngle,
  dragDirection,
  dragProgress,
  draggedSheet,
  restingAngle,
  shouldCommit,
  stackOrder,
  tapDirection,
} from './math';

describe('restingAngle / stackOrder', () => {
  it('turns only the first `flipped` sheets', () => {
    expect([0, 1, 2, 3].map((i) => restingAngle(i, 2))).toEqual([-180, -180, 0, 0]);
  });
  it('keeps the next sheet to turn on top of the right pile and the last turned on top of the left pile', () => {
    const total = 4;
    const right = [2, 3].map((i) => stackOrder(i, 2, total));
    expect(right[0]).toBeGreaterThan(right[1]!);
    const left = [0, 1].map((i) => stackOrder(i, 2, total));
    expect(left[1]).toBeGreaterThan(left[0]!);
  });
});

describe('dragDirection', () => {
  it('drags left to go forward, right to go back', () => {
    expect(dragDirection(-20, 1, 4)).toBe('next');
    expect(dragDirection(20, 1, 4)).toBe('prev');
  });
  it('refuses impossible directions at both ends', () => {
    expect(dragDirection(20, 0, 4)).toBeNull();
    expect(dragDirection(-20, 4, 4)).toBeNull();
    expect(dragDirection(0, 2, 4)).toBeNull();
  });
});

describe('drag progress and angle', () => {
  it('clamps progress to 0..1 and survives a zero-width page', () => {
    expect(dragProgress(-250, 500)).toBe(0.5);
    expect(dragProgress(900, 500)).toBe(1);
    expect(dragProgress(10, 0)).toBe(0);
  });
  it('moves the sheet from rest to turned in the right direction', () => {
    expect(dragAngle('next', 0)).toBe(0);
    expect(dragAngle('next', 1)).toBe(-180);
    expect(dragAngle('prev', 0)).toBe(-180);
    expect(dragAngle('prev', 1)).toBe(0);
  });
  it('picks the right sheet for each direction', () => {
    expect(draggedSheet('next', 2)).toBe(2);
    expect(draggedSheet('prev', 2)).toBe(1);
  });
});

describe('commit and apply', () => {
  it('commits past the threshold and springs back before it', () => {
    expect(shouldCommit(0.1)).toBe(false);
    expect(shouldCommit(0.3)).toBe(true);
  });
  it('never leaves the 0..total range', () => {
    expect(applyFlip(4, 'next', 4)).toBe(4);
    expect(applyFlip(0, 'prev', 4)).toBe(0);
    expect(applyFlip(2, 'next', 4)).toBe(3);
    expect(applyFlip(2, 'next', 4, false)).toBe(2);
  });
});

describe('tapDirection', () => {
  it('splits a spread down the middle', () => {
    expect(tapDirection(0.4, 'spread')).toBe('prev');
    expect(tapDirection(0.6, 'spread')).toBe('next');
  });
  it('favours "next" on a single page (right-handed, thumb-friendly)', () => {
    expect(tapDirection(0.2, 'single')).toBe('prev');
    expect(tapDirection(0.5, 'single')).toBe('next');
  });
  it('always opens a closed book, wherever the cover is tapped', () => {
    expect(tapDirection(0.3, 'spread', true)).toBe('next');
    expect(tapDirection(0.05, 'single', true)).toBe('next');
  });
  it('clamp helper is symmetric', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
  });
});
