/**
 * Pure rules for the story puzzles. Piece `i` belongs in slot `i` (row-major order), so correctness is
 * just `piece === slot`. Designed around the research in docs/GAMIFICATION_RESEARCH.md: there is no failure
 * state, one piece starts placed (endowed progress), and a few misses reveal where the piece goes.
 */
export interface PuzzleGrid {
  cols: number;
  rows: number;
}

/** After this many wrong tries a piece's home slot glows. */
export const HINT_AFTER_MISSES = 2;

/** Fewer, bigger pieces for younger children: a touchscreen is harder than chunky wooden pieces. */
export function gridForAge(age: number | null): PuzzleGrid {
  if (age === null || age <= 3) return { cols: 2, rows: 2 };
  // Cover art is portrait (4:5), so 6 pieces are 2 wide by 3 tall: 3 wide would make tall, skinny pieces.
  if (age <= 5) return { cols: 2, rows: 3 };
  return { cols: 3, rows: 3 };
}

export const pieceCount = (g: PuzzleGrid): number => g.cols * g.rows;

export interface PuzzleState {
  /** placed[i] is true once piece i sits in its slot. */
  placed: boolean[];
  /** Wrong tries per piece, used only to decide when to hint. */
  misses: number[];
}

export function startPuzzle(count: number, headStart: number): PuzzleState {
  return { placed: Array.from({ length: count }, (_, i) => i === headStart), misses: Array<number>(count).fill(0) };
}

export function tryPlace(state: PuzzleState, piece: number, slot: number): { state: PuzzleState; correct: boolean } {
  if (piece < 0 || piece >= state.placed.length || state.placed[piece]) return { state, correct: false };
  if (piece === slot) return { state: { ...state, placed: state.placed.map((p, i) => p || i === piece) }, correct: true };
  return { state: { ...state, misses: state.misses.map((m, i) => (i === piece ? m + 1 : m)) }, correct: false };
}

export const isComplete = (state: PuzzleState): boolean => state.placed.every(Boolean);
export const placedCount = (state: PuzzleState): number => state.placed.filter(Boolean).length;

/** The slot to highlight for `piece`, once it has been tried wrongly enough times. */
export const hintSlot = (state: PuzzleState, piece: number): number | null =>
  !state.placed[piece] && (state.misses[piece] ?? 0) >= HINT_AFTER_MISSES ? piece : null;

/** A random order for the tray. Fisher-Yates; `rand` is injectable so tests are deterministic. */
export function shuffledOrder(count: number, rand: () => number = Math.random): number[] {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

export const pickHeadStart = (count: number, rand: () => number = Math.random): number => Math.floor(rand() * count);
