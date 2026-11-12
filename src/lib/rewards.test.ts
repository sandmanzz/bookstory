import { describe, expect, it } from 'vitest';
import { noRewards, parseRewards } from './rewards';

describe('parseRewards', () => {
  it('reads what was saved', () => {
    expect(parseRewards(JSON.stringify({ found: ['1:0'], answered: [5] }))).toEqual({ found: ['1:0'], answered: [5] });
  });
  it('treats missing or corrupt data as no rewards', () => {
    expect(parseRewards(null)).toEqual(noRewards);
    expect(parseRewards('{oops')).toEqual(noRewards);
  });
  it('drops values of the wrong type instead of trusting them', () => {
    expect(parseRewards(JSON.stringify({ found: ['1:0', 7, null], answered: [2, 'x', 3.5] }))).toEqual({ found: ['1:0'], answered: [2] });
  });
});
