import { useEffect, useMemo, useState } from 'react';
import type { PageContent } from '../../api';
import type { Highlight } from '../../hooks/useReadAloud';
import { pageText, type Lang } from '../../lib/i18n';
import { overlaps, tokenize } from '../../lib/words';
import { useReaderText } from '../reader/ReaderText';

interface WordsProps {
  text: string;
  lang: Lang;
  /** The spoken range in this line, if speech is currently on it. */
  active: Pick<Highlight, 'start' | 'end'> | null;
  onWord: (word: string, lang: Lang) => void;
}

/** Text where every word is tappable and says itself aloud. Punctuation and spaces are plain text. */
function Words({ text, lang, active, onWord }: WordsProps) {
  const tokens = useMemo(() => tokenize(text), [text]);
  const [pressed, setPressed] = useState<number | null>(null);

  useEffect(() => {
    if (pressed === null) return;
    const timer = window.setTimeout(() => setPressed(null), 700);
    return () => window.clearTimeout(timer);
  }, [pressed]);

  return (
    <>
      {tokens.map((token, i) => {
        if (!token.isWord) return <span key={i}>{token.text}</span>;
        const lit = pressed === i || (active !== null && overlaps(token, active.start, active.end));
        return (
          // Tapping a word must not turn the page, so the book ignores taps that land on [data-word] (see Book.tsx).
          <span
            key={i}
            data-word
            onClick={() => {
              setPressed(i);
              onWord(token.text, lang);
            }}
            className={`cursor-pointer rounded-lg px-[0.06em] transition-colors duration-150 hover:bg-sun/45 ${lit ? 'bg-sun text-ink' : ''}`}
          >
            {token.text}
          </span>
        );
      })}
    </>
  );
}

/** A page's words in every language being shown: the first is the main line, the others sit below it, smaller. */
export function PageText({ page }: { page: PageContent }) {
  const { langs, highlight, onWord } = useReaderText();
  return (
    <>
      {langs.map((lang, i) => (
        <p key={lang} lang={lang} className={i === 0 ? '' : 'mt-[0.7em] text-[0.74em] text-ink-soft'}>
          <Words
            text={pageText(page, lang)}
            lang={lang}
            active={highlight && highlight.position === page.position && highlight.lang === lang ? highlight : null}
            onWord={onWord}
          />
        </p>
      ))}
    </>
  );
}
