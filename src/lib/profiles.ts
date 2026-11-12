/**
 * Reader profiles live ONLY on the device (localStorage). A child's name and age never reach our servers,
 * which keeps the product simple for children's-privacy rules (COPPA etc.): the account belongs to the parent.
 * Everything here is pure so it can be unit-tested; storage access is isolated in `loadStore`/`saveStore`.
 */
export const MAX_PROFILES = 4;
export const MAX_NAME_LENGTH = 20;
export const MAX_AGE = 8;
/** Progress and stars for someone who has not set up a profile yet. */
export const GUEST_PROFILE = 'guest';

export const AVATARS = [
  { id: 'fox', emoji: '🦊', color: '#FFB07C' },
  { id: 'panda', emoji: '🐼', color: '#C9D6FF' },
  { id: 'bunny', emoji: '🐰', color: '#FFC7E0' },
  { id: 'lion', emoji: '🦁', color: '#FFD76A' },
  { id: 'frog', emoji: '🐸', color: '#A8E6B8' },
  { id: 'owl', emoji: '🦉', color: '#D9C2FF' },
] as const;

export interface Profile {
  id: string;
  name: string;
  avatar: string;
  age: number;
}

export interface ProfileStore {
  profiles: Profile[];
  activeId: string | null;
}

export type ProfileInput = Omit<Profile, 'id'>;

export const emptyStore: ProfileStore = { profiles: [], activeId: null };

export const avatarOf = (id: string) => AVATARS.find((a) => a.id === id) ?? AVATARS[0];

/** Returns a human message if the input cannot become a profile, otherwise null. */
export function validateProfile(input: ProfileInput, existing: readonly Profile[]): string | null {
  const name = input.name.trim();
  if (existing.length >= MAX_PROFILES) return `You can add up to ${MAX_PROFILES} readers.`;
  if (name.length === 0) return 'Please enter a name.';
  if (name.length > MAX_NAME_LENGTH) return `Names can be up to ${MAX_NAME_LENGTH} letters.`;
  if (existing.some((p) => p.name.toLowerCase() === name.toLowerCase())) return 'There is already a reader with that name.';
  if (!AVATARS.some((a) => a.id === input.avatar)) return 'Please pick a picture.';
  if (!Number.isInteger(input.age) || input.age < 0 || input.age > MAX_AGE) return `Age must be between 0 and ${MAX_AGE}.`;
  return null;
}

/** Adds a profile (the first one becomes active). Callers validate first; this stays total so it cannot throw. */
export function addProfile(store: ProfileStore, input: ProfileInput, id: string): ProfileStore {
  const profile: Profile = { id, name: input.name.trim(), avatar: input.avatar, age: input.age };
  return { profiles: [...store.profiles, profile], activeId: store.activeId ?? id };
}

export function removeProfile(store: ProfileStore, id: string): ProfileStore {
  const profiles = store.profiles.filter((p) => p.id !== id);
  const activeId = store.activeId === id ? (profiles[0]?.id ?? null) : store.activeId;
  return { profiles, activeId };
}

export function selectProfile(store: ProfileStore, id: string): ProfileStore {
  return store.profiles.some((p) => p.id === id) ? { ...store, activeId: id } : store;
}

export const activeProfile = (store: ProfileStore): Profile | null => store.profiles.find((p) => p.id === store.activeId) ?? null;

/** Defensive parse: a corrupted or hand-edited value must never break the app. */
export function parseStore(raw: string | null): ProfileStore {
  if (!raw) return emptyStore;
  try {
    const data = JSON.parse(raw) as Partial<ProfileStore>;
    const profiles = (Array.isArray(data.profiles) ? data.profiles : [])
      .filter((p): p is Profile => Boolean(p) && typeof p.id === 'string' && typeof p.name === 'string' && Number.isInteger(p.age))
      .slice(0, MAX_PROFILES);
    const activeId = profiles.some((p) => p.id === data.activeId) ? (data.activeId as string) : (profiles[0]?.id ?? null);
    return { profiles, activeId };
  } catch {
    return emptyStore;
  }
}

const KEY = 'ms:profiles';

export function loadStore(): ProfileStore {
  try {
    return parseStore(localStorage.getItem(KEY));
  } catch {
    return emptyStore;
  }
}

export function saveStore(store: ProfileStore): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* storage unavailable: profiles last for this visit only */
  }
}
