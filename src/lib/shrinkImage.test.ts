import { describe, expect, it } from 'vitest';
import { fitWithin } from './shrinkImage';

describe('fitWithin', () => {
  it('keeps a small picture as it is', () => {
    expect(fitWithin(800, 600, 1400)).toEqual({ width: 800, height: 600 });
  });
  it('scales a big landscape picture so the longest side fits, keeping the shape', () => {
    expect(fitWithin(4000, 3000, 1400)).toEqual({ width: 1400, height: 1050 });
  });
  it('scales a big portrait picture by its height', () => {
    expect(fitWithin(3000, 4000, 1400)).toEqual({ width: 1050, height: 1400 });
  });
  it('never returns a zero side', () => {
    expect(fitWithin(10000, 1, 1400).height).toBe(1);
  });
});
