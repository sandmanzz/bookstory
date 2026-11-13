/**
 * What a fetched result belongs to: WHO is asking, plus the parameters (e.g. the book slug).
 * Data is only ever shown to the scope it was fetched for, so logging out cannot leave a previous user's paid
 * content on screen. A purchase or cancellation does NOT change the scope (same person), so the page keeps showing
 * what it has while it refetches, and dialogs on top of it (like the payment confirmation) are not torn down.
 */
export const requestScope = (userId: string | null | undefined, deps: readonly (string | number)[]): string =>
  [userId ?? 'guest', ...deps].join('|');
