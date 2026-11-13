import type { Book, Choice, Lang, PageContent, Question, Sticker, Translations } from '../api';

export type { Lang } from '../api';

export const LANGS: readonly Lang[] = ['en', 'id'];
export const DEFAULT_LANG: Lang = 'en';

export const LANG_NAME: Record<Lang, string> = { en: 'English', id: 'Bahasa Indonesia' };
/** Short label for buttons. */
export const LANG_CODE: Record<Lang, string> = { en: 'EN', id: 'ID' };
/** BCP 47 locale handed to speech synthesis. */
export const SPEECH_LOCALE: Record<Lang, string> = { en: 'en-US', id: 'id-ID' };

/**
 * Reading mode: one language, or both together for a child who is learning (English line first, Indonesian below,
 * and each word can be tapped to hear it in its own language).
 */
export type LangMode = 'en' | 'id' | 'both';
export const MODES: readonly LangMode[] = ['en', 'id', 'both'];

/** The next mode when the language button is tapped: EN, then ID, then both. */
export const nextMode = (mode: LangMode): LangMode => MODES[(MODES.indexOf(mode) + 1) % MODES.length] ?? 'en';

/** A translation if there is one, otherwise the default-language value. Never returns an empty string by accident. */
function pick<T extends string>(base: T, translations: Translations<Record<string, string>> | undefined, key: string, lang: Lang): string {
  if (lang === DEFAULT_LANG) return base;
  const value = translations?.[lang as 'id']?.[key];
  return value && value.trim() ? value : base;
}

/** Whether `book` can be read in `lang` (the book lists the languages it fully supports). */
export const supports = (book: Pick<Book, 'languages'>, lang: Lang): boolean => lang === DEFAULT_LANG || book.languages.includes(lang);

/** The languages to actually show: the requested mode, reduced to what this book supports. */
export function activeLangs(book: Pick<Book, 'languages'>, mode: LangMode): Lang[] {
  const wanted: Lang[] = mode === 'both' ? ['en', 'id'] : [mode];
  const available = wanted.filter((l) => supports(book, l));
  return available.length > 0 ? available : [DEFAULT_LANG];
}

export const bookTitle = (b: Pick<Book, 'title' | 'i18n'>, lang: Lang) => pick(b.title, b.i18n, 'title', lang);
export const bookSummary = (b: Pick<Book, 'summary' | 'i18n'>, lang: Lang) => pick(b.summary, b.i18n, 'summary', lang);
export const pageText = (p: Pick<PageContent, 'text' | 'i18n'>, lang: Lang) => pick(p.text, p.i18n, 'text', lang);
export const stickerSound = (s: Pick<Sticker, 'sound' | 'i18n'>, lang: Lang) => pick(s.sound, s.i18n, 'sound', lang);
export const questionPrompt = (q: Pick<Question, 'prompt' | 'i18n'>, lang: Lang) => pick(q.prompt, q.i18n, 'prompt', lang);
export const choiceLabel = (c: Pick<Choice, 'label' | 'i18n'>, lang: Lang) => pick(c.label, c.i18n, 'label', lang);

/** The language used for a title, hint or button when several are shown: the first active one. */
export const primaryLang = (langs: readonly Lang[]): Lang => langs[0] ?? DEFAULT_LANG;

/** Interface strings used inside the reader, so a child reading in Indonesian sees Indonesian buttons too. */
const UI = {
  en: {
    readToMe: 'Read to me',
    readToMeShort: 'Read',
    stop: 'Stop',
    autoRead: 'Auto read',
    autoReadShort: 'Auto',
    pause: 'Pause',
    resume: 'Resume',
    close: 'Close',
    theEnd: 'The End',
    readAgain: 'Read again',
    moreStories: 'More stories',
    youFinished: 'You finished',
    wellDone: 'Well done!',
    upNext: 'Up next',
    readNext: 'Read next',
    unlockToRead: 'Unlock to read',
    tapAWord: 'Tap any word to hear it',
    correct: 'Yes! Great job!',
    tryAgain: 'Not quite. Try again!',
    autoWaiting: 'Answer the question to keep going',
    stars: 'stars',
    puzzleFound: 'You found a puzzle!',
    puzzleAgain: 'Play the puzzle again',
    noVoice: 'This device has no voice for this language, so it may sound different.',
  },
  id: {
    readToMe: 'Bacakan untukku',
    readToMeShort: 'Baca',
    stop: 'Berhenti',
    autoRead: 'Baca otomatis',
    autoReadShort: 'Otomatis',
    pause: 'Jeda',
    resume: 'Lanjut',
    close: 'Tutup',
    theEnd: 'Tamat',
    readAgain: 'Baca lagi',
    moreStories: 'Cerita lainnya',
    youFinished: 'Kamu selesai membaca',
    wellDone: 'Hebat!',
    upNext: 'Berikutnya',
    readNext: 'Baca berikutnya',
    unlockToRead: 'Buka untuk membaca',
    tapAWord: 'Sentuh kata mana saja untuk mendengarnya',
    correct: 'Ya! Hebat sekali!',
    tryAgain: 'Belum tepat. Coba lagi!',
    autoWaiting: 'Jawab pertanyaan untuk melanjutkan',
    stars: 'bintang',
    puzzleFound: 'Kamu menemukan puzzle!',
    puzzleAgain: 'Main puzzle lagi',
    noVoice: 'Perangkat ini tidak punya suara untuk bahasa ini, jadi bunyinya mungkin berbeda.',
  },
} as const;

export type UiKey = keyof (typeof UI)['en'];
export const t = (lang: Lang, key: UiKey): string => UI[lang][key];
