import { describe, expect, it } from 'vitest';
import { createChallenge, isCorrect } from './parentalGate';

describe('parental gate', () => {
  it('only produces multiplication facts from 6 to 9', () => {
    for (const r of [0, 0.25, 0.5, 0.99]) {
      const { a, b } = createChallenge(() => r);
      expect(a).toBeGreaterThanOrEqual(6);
      expect(b).toBeLessThanOrEqual(9);
    }
  });
  it('accepts the product and nothing else', () => {
    const c = { a: 7, b: 8 };
    expect(isCorrect(c, '56')).toBe(true);
    expect(isCorrect(c, '55')).toBe(false);
    expect(isCorrect(c, '')).toBe(false);
    expect(isCorrect(c, ' ')).toBe(false);
  });
});
