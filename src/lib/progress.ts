import { GUEST_PROFILE } from './profiles';

const PREFIX = 'ms:progress:';
const key = (profileId: string, slug: string) => `${PREFIX}${profileId}:${slug}`;

/** Last page a reader got to in a book (per profile, per browser). Storage can be unavailable, so never throw. */
export function loadProgress(profileId: string, slug: string): number {
  try {
    const n = Number(localStorage.getItem(key(profileId, slug)));
    return Number.isInteger(n) && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveProgress(profileId: string, slug: string, page: number): void {
  try {
    if (page > 0) localStorage.setItem(key(profileId, slug), String(page));
    else localStorage.removeItem(key(profileId, slug));
  } catch {
    /* storage unavailable (private mode, quota): resuming is a nicety, not a requirement */
  }
}

/** Pulls `{ slug }` out of a stored key for this profile, or null if the key belongs to something else. */
export function slugFromKey(profileId: string, storageKey: string): string | null {
  const prefix = `${PREFIX}${profileId}:`;
  return storageKey.startsWith(prefix) && storageKey.length > prefix.length ? storageKey.slice(prefix.length) : null;
}

/** Every book this profile has started, with the page they reached. */
export function listProgress(profileId: string): { slug: string; page: number }[] {
  const out: { slug: string; page: number }[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const slug = slugFromKey(profileId, localStorage.key(i) ?? '');
      if (slug) {
        const page = loadProgress(profileId, slug);
        if (page > 0) out.push({ slug, page });
      }
    }
  } catch {
    /* storage unavailable */
  }
  return out;
}

export const progressProfileId = (activeId: string | null | undefined): string => activeId ?? GUEST_PROFILE;

/**
 * Where to reopen a book. `pageCount` is the number of readable pages. Finishing a book restarts it
 * from the cover; stopping at a paywall resumes on the last page you could read.
 */
export function resumePoint(saved: number, pageCount: number, locked: boolean): number {
  if (saved <= pageCount) return saved;
  return locked ? pageCount : 0;
}
