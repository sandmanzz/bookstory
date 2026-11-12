/**
 * A child's puzzle album: which story puzzles they have found and built. Per profile, on this device only.
 * Deliberately plain: no points, levels, streaks or expiry (see docs/GAMIFICATION_RESEARCH.md).
 */
export interface PuzzleRecord {
  unlockedAt: string;
  completedAt?: string;
}
export type Collection = Record<string, PuzzleRecord>;

const key = (profileId: string) => `ms:puzzles:${profileId}`;

/** Reading a story to the end finds its puzzle. Finding it again (re-reading) changes nothing. */
export function unlockPuzzle(c: Collection, slug: string, now: Date): Collection {
  return c[slug] ? c : { ...c, [slug]: { unlockedAt: now.toISOString() } };
}

/** Building a puzzle marks it done once; the first completion time is kept. */
export function completePuzzle(c: Collection, slug: string, now: Date): Collection {
  const existing = c[slug];
  if (!existing || existing.completedAt) return c;
  return { ...c, [slug]: { ...existing, completedAt: now.toISOString() } };
}

export const foundCount = (c: Collection): number => Object.keys(c).length;
export const builtCount = (c: Collection): number => Object.values(c).filter((r) => r.completedAt).length;

/** Defensive parse: anything malformed is dropped rather than trusted. */
export function parseCollection(raw: string | null): Collection {
  if (!raw) return {};
  try {
    const data = JSON.parse(raw) as Record<string, Partial<PuzzleRecord> | null>;
    const out: Collection = {};
    for (const [slug, rec] of Object.entries(data)) {
      if (!rec || typeof rec.unlockedAt !== 'string') continue;
      out[slug] = { unlockedAt: rec.unlockedAt, ...(typeof rec.completedAt === 'string' ? { completedAt: rec.completedAt } : {}) };
    }
    return out;
  } catch {
    return {};
  }
}

export function loadCollection(profileId: string): Collection {
  try {
    return parseCollection(localStorage.getItem(key(profileId)));
  } catch {
    return {};
  }
}

export function saveCollection(profileId: string, c: Collection): void {
  try {
    localStorage.setItem(key(profileId), JSON.stringify(c));
  } catch {
    /* storage unavailable: the album lasts for this visit only */
  }
}
