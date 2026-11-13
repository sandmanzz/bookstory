import { createContext, useContext } from 'react';
import type { Highlight } from '../../hooks/useReadAloud';
import type { Lang } from '../../lib/i18n';

/**
 * What the pages need to know to draw their words: which languages to show, which word is being spoken, and what
 * to do when a word is tapped. A context keeps this out of the (memoised) book sheets: they re-render when it changes.
 */
export interface ReaderTextState {
  langs: Lang[];
  highlight: Highlight | null;
  onWord: (word: string, lang: Lang) => void;
}

const ReaderTextContext = createContext<ReaderTextState>({ langs: ['en'], highlight: null, onWord: () => {} });

export const ReaderTextProvider = ReaderTextContext.Provider;
export const useReaderText = (): ReaderTextState => useContext(ReaderTextContext);
