import { MODES, type LangMode } from './i18n';

const key = (profileId: string) => `ms:lang:${profileId}`;

/** A browser set to Indonesian starts in Indonesian; everyone else starts in English. */
export const defaultMode = (navigatorLanguage: string | undefined): LangMode =>
  navigatorLanguage?.toLowerCase().startsWith('id') ? 'id' : 'en';

/** Validates a stored value: anything unexpected falls back instead of breaking the reader. */
export function parseMode(raw: string | null, fallback: LangMode): LangMode {
  return MODES.find((m) => m === raw) ?? fallback;
}

export function loadMode(profileId: string, fallback: LangMode): LangMode {
  try {
    return parseMode(localStorage.getItem(key(profileId)), fallback);
  } catch {
    return fallback;
  }
}

export function saveMode(profileId: string, mode: LangMode): void {
  try {
    localStorage.setItem(key(profileId), mode);
  } catch {
    /* storage unavailable: the choice lasts for this visit only */
  }
}
