import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LANG, nextMode, type Lang, type LangMode } from './lib/i18n';
import { defaultMode, loadMode, saveMode } from './lib/language';
import { useProfiles } from './profiles';

interface LanguageState {
  /** What the reader asked for: English, Indonesian, or both. Books that lack a language fall back to English. */
  mode: LangMode;
  /** The single language to use for chrome (buttons) and speech when only one is needed. */
  lang: Lang;
  setMode: (mode: LangMode) => void;
  cycle: () => void;
}

const LanguageContext = createContext<LanguageState | null>(null);

export function useLanguage(): LanguageState {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside <LanguageProvider>');
  return value;
}

/** Each reader has their own language setting, remembered on this device. */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { profileId } = useProfiles();
  const [chosen, setChosen] = useState<{ profileId: string; mode: LangMode } | null>(null);

  // A profile switch reads that profile's saved mode straight from storage: no effect, no remount.
  const mode = chosen && chosen.profileId === profileId ? chosen.mode : loadMode(profileId, defaultMode(navigator.language));

  const setMode = useCallback(
    (next: LangMode) => {
      saveMode(profileId, next);
      setChosen({ profileId, mode: next });
    },
    [profileId],
  );

  const value = useMemo<LanguageState>(
    () => ({ mode, lang: mode === 'id' ? 'id' : DEFAULT_LANG, setMode, cycle: () => setMode(nextMode(mode)) }),
    [mode, setMode],
  );
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
