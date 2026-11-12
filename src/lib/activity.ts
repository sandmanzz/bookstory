import type { PageContent, Question } from '../api';

/** After this many wrong guesses the right answer gets a gentle highlight. There is no way to "fail". */
export const HINT_AFTER_WRONG = 2;

export const stickerKey = (position: number, index: number): string => `${position}:${index}`;
export const shouldHint = (wrongGuesses: number): boolean => wrongGuesses >= HINT_AFTER_WRONG;
export const correctIndex = (question: Question): number => question.choices.findIndex((c) => c.correct);

/** Has every sticker on this page been touched at least once? */
export function stickersComplete(page: PageContent, found: ReadonlySet<string>): boolean {
  const stickers = page.activity?.stickers ?? [];
  return stickers.length > 0 && stickers.every((_, i) => found.has(stickerKey(page.position, i)));
}

/** One star for finding every sticker on a page, one for answering its question. */
export function countStars(pages: readonly PageContent[], found: ReadonlySet<string>, answered: ReadonlySet<number>): number {
  return pages.reduce(
    (sum, page) => sum + (stickersComplete(page, found) ? 1 : 0) + (page.activity?.question && answered.has(page.position) ? 1 : 0),
    0,
  );
}

export function maxStars(pages: readonly PageContent[]): number {
  return pages.reduce((sum, page) => sum + ((page.activity?.stickers.length ?? 0) > 0 ? 1 : 0) + (page.activity?.question ? 1 : 0), 0);
}
