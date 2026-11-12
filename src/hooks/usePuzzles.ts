import { useCallback, useEffect, useState } from 'react';
import { completePuzzle, loadCollection, saveCollection, unlockPuzzle } from '../lib/collection';

/**
 * The active reader's puzzle album. Callers key their component on `profileId`, so a profile switch remounts
 * them and this state reloads from storage. Writes are persisted as they change.
 */
export function usePuzzleCollection(profileId: string) {
  const [collection, setCollection] = useState(() => loadCollection(profileId));

  useEffect(() => saveCollection(profileId, collection), [profileId, collection]);

  const unlock = useCallback((slug: string) => setCollection((c) => unlockPuzzle(c, slug, new Date())), []);
  const complete = useCallback((slug: string) => setCollection((c) => completePuzzle(c, slug, new Date())), []);
  return { collection, unlock, complete };
}
