/**
 * Pure maths for the page-turn engine. No DOM, no React: everything here is unit-tested.
 *
 * Model: a book is a stack of `total` sheets hinged on the spine. `flipped` is how many sheets
 * have been turned over to the left (0 = closed book, `total` = every sheet turned).
 */

export type FlipDirection = 'next' | 'prev';
export type BookLayout = 'spread' | 'single';

export const FLIPPED_ANGLE = -180;
/** Fraction of a page width the user must drag before the turn completes on release. */
export const COMMIT_THRESHOLD = 0.28;
/** Pointer travel (px) below which a gesture counts as a tap, not a drag. */
export const TAP_SLOP = 6;

export const clamp = (n: number, min: number, max: number): number => Math.min(max, Math.max(min, n));

/** Angle a sheet rests at when `flipped` sheets have been turned. */
export const restingAngle = (index: number, flipped: number): number => (index < flipped ? FLIPPED_ANGLE : 0);

/**
 * Stacking order. Unflipped sheets stack with the lowest index on top; flipped sheets with the highest
 * index on top, so the sheet you just turned lands on top of the left-hand pile.
 */
export const stackOrder = (index: number, flipped: number, total: number): number => (index < flipped ? index + 1 : total - index);

/** Which way a horizontal drag turns the book, or null if that direction is impossible. */
export function dragDirection(dx: number, flipped: number, total: number): FlipDirection | null {
  if (dx < 0) return flipped < total ? 'next' : null;
  if (dx > 0) return flipped > 0 ? 'prev' : null;
  return null;
}

/** 0 (untouched) to 1 (fully turned): how far the drag has travelled across one page. */
export const dragProgress = (dx: number, pageWidth: number): number => (pageWidth > 0 ? clamp(Math.abs(dx) / pageWidth, 0, 1) : 0);

/** Live angle of the sheet being dragged. A "next" turn goes 0 to -180; a "prev" turn goes -180 to 0. */
export function dragAngle(direction: FlipDirection, progress: number): number {
  const turned = direction === 'next' ? progress : 1 - progress;
  return turned === 0 ? 0 : FLIPPED_ANGLE * turned; // avoid a negative zero
}

/** Should the turn complete (true) or spring back (false) when the finger lifts? */
export const shouldCommit = (progress: number): boolean => progress >= COMMIT_THRESHOLD;

/** The sheet that a drag in `direction` moves. */
export const draggedSheet = (direction: FlipDirection, flipped: number): number => (direction === 'next' ? flipped : flipped - 1);

/** New `flipped` count after a gesture. `commit=false` leaves it unchanged. */
export function applyFlip(flipped: number, direction: FlipDirection, total: number, commit = true): number {
  if (!commit) return flipped;
  return clamp(flipped + (direction === 'next' ? 1 : -1), 0, total);
}

/**
 * Which way a tap at horizontal `ratio` (0 left to 1 right) of the book turns it. A closed book only
 * opens: the cover is centred on screen, so a tap on its left half must not be read as "back".
 */
export function tapDirection(ratio: number, layout: BookLayout, closed = false): FlipDirection {
  if (closed) return 'next';
  const leftZone = layout === 'spread' ? 0.5 : 0.3;
  return ratio < leftZone ? 'prev' : 'next';
}
