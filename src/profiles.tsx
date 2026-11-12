import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ProfileDialog } from './components/ProfileDialog';
import {
  GUEST_PROFILE,
  activeProfile,
  addProfile,
  loadStore,
  removeProfile,
  saveStore,
  selectProfile,
  validateProfile,
  type Profile,
  type ProfileInput,
} from './lib/profiles';

interface ProfilesState {
  profiles: Profile[];
  active: Profile | null;
  /** Key for per-reader progress and stars: the active profile, or a shared "guest" bucket. */
  profileId: string;
  /** Returns an error message, or null when the reader was added. */
  add: (input: ProfileInput) => string | null;
  remove: (id: string) => void;
  select: (id: string) => void;
  openPicker: () => void;
}

const ProfilesContext = createContext<ProfilesState | null>(null);

export function useProfiles(): ProfilesState {
  const value = useContext(ProfilesContext);
  if (!value) throw new Error('useProfiles must be used inside <ProfilesProvider>');
  return value;
}

export function ProfilesProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState(loadStore);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => saveStore(store), [store]);

  const add = useCallback(
    (input: ProfileInput) => {
      const error = validateProfile(input, store.profiles);
      if (!error) setStore((s) => addProfile(s, input, crypto.randomUUID()));
      return error;
    },
    [store.profiles],
  );

  const active = activeProfile(store);
  const value = useMemo<ProfilesState>(
    () => ({
      profiles: store.profiles,
      active,
      profileId: active?.id ?? GUEST_PROFILE,
      add,
      remove: (id) => setStore((s) => removeProfile(s, id)),
      select: (id) => {
        setStore((s) => selectProfile(s, id));
        setPickerOpen(false);
      },
      openPicker: () => setPickerOpen(true),
    }),
    [store.profiles, active, add],
  );

  return (
    <ProfilesContext.Provider value={value}>
      {children}
      {pickerOpen && <ProfileDialog onClose={() => setPickerOpen(false)} />}
    </ProfilesContext.Provider>
  );
}
