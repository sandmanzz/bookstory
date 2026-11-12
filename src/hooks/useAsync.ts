import { useEffect, useState } from 'react';
import type { ApiError } from '../api';
import { useAuth } from '../auth';

interface Settled<T> {
  id: string;
  scope: string;
  data: T | null;
  error: ApiError | null;
}

/**
 * Fetches data and re-fetches whenever entitlements change (login, logout, purchase) or `deps` change.
 *
 * - `scope` identifies WHAT is being fetched (who is logged in plus `deps`). Data from another scope is never
 *   returned, so logging out cannot leave a previous user's paid content on screen, and navigating to another
 *   book never flashes the old one.
 * - `reload()` refetches the same scope and keeps the current data visible meanwhile.
 * - `loading` is derived from request ids instead of being set inside the effect (no cascading renders).
 */
export function useAsync<T>(fn: () => Promise<T>, deps: readonly (string | number)[] = []) {
  const { version } = useAuth();
  const [reloadCount, setReloadCount] = useState(0);
  const [settled, setSettled] = useState<Settled<T> | null>(null);
  const scope = [version, ...deps].join('|');
  const id = `${scope}|${reloadCount}`;

  useEffect(() => {
    let live = true;
    fn().then(
      (data) => live && setSettled({ id, scope, data, error: null }),
      (error: ApiError) => live && setSettled({ id, scope, data: null, error }),
    );
    return () => {
      live = false;
    };
    // `fn` is a fresh closure every render; the request id already captures everything that should trigger a refetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const sameScope = settled?.scope === scope;
  const current = settled?.id === id;
  return {
    data: sameScope ? (settled?.data ?? null) : null,
    error: current ? (settled?.error ?? null) : null,
    loading: !current,
    reload: () => setReloadCount((n) => n + 1),
  };
}
