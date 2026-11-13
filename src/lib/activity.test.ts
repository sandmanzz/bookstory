import { describe, expect, it } from 'vitest';
import type { PageContent } from '../api';
import { correctIndex, countStars, maxStars, shouldHint, stickerKey, stickersComplete } from './activity';

const sticker = { emoji: '⭐', x: 50, y: 50, sound: '', reaction: 'hop' as const, i18n: {} };
const question = {
  prompt: 'Which?',
  i18n: {},
  choices: [
    { emoji: 'a', label: 'A', correct: false, i18n: {} },
    { emoji: 'b', label: 'B', correct: true, i18n: {} },
  ],
};
const page = (position: number, activity: PageContent['activity']): PageContent => ({
  position,
  text: '',
  emoji: '',
  imageUrl: null,
  i18n: {},
  activity,
});

const pages = [page(1, { stickers: [sticker, sticker], question: null }), page(2, null), page(3, { stickers: [], question })];

describe('activity rewards', () => {
  it('needs every sticker on a page before it counts', () => {
    expect(stickersComplete(pages[0]!, new Set([stickerKey(1, 0)]))).toBe(false);
    expect(stickersComplete(pages[0]!, new Set([stickerKey(1, 0), stickerKey(1, 1)]))).toBe(true);
  });
  it('a page with no stickers is never "complete"', () => {
    expect(stickersComplete(pages[1]!, new Set())).toBe(false);
    expect(stickersComplete(pages[2]!, new Set())).toBe(false);
  });
  it('counts a star per finished sticker page and per answered question', () => {
    const found = new Set([stickerKey(1, 0), stickerKey(1, 1)]);
    expect(countStars(pages, found, new Set())).toBe(1);
    expect(countStars(pages, found, new Set([3]))).toBe(2);
    expect(countStars(pages, new Set(), new Set([2]))).toBe(0); // answering a page that has no question earns nothing extra
  });
  it('reports the maximum so the UI can show "2 of 2"', () => {
    expect(maxStars(pages)).toBe(2);
    expect(maxStars([])).toBe(0);
  });
});

describe('question helpers', () => {
  it('only hints after repeated wrong guesses', () => {
    expect(shouldHint(0)).toBe(false);
    expect(shouldHint(1)).toBe(false);
    expect(shouldHint(2)).toBe(true);
  });
  it('finds the correct choice', () => {
    expect(correctIndex(question)).toBe(1);
  });
});
