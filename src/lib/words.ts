/** Splits text into words and everything else (spaces, punctuation), keeping each piece's position in the string. */
export interface Token {
  text: string;
  isWord: boolean;
  /** Offset of the first character in the original string. */
  start: number;
  /** Offset just past the last character. */
  end: number;
}

// Letters (any script, so "mangga" and "naïve" both work) with inner apostrophes and hyphens: "can't", "kunang-kunang".
const WORD = /[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu;

export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let cursor = 0;
  for (const match of text.matchAll(WORD)) {
    const start = match.index ?? 0;
    if (start > cursor) tokens.push({ text: text.slice(cursor, start), isWord: false, start: cursor, end: start });
    const end = start + match[0].length;
    tokens.push({ text: match[0], isWord: true, start, end });
    cursor = end;
  }
  if (cursor < text.length) tokens.push({ text: text.slice(cursor), isWord: false, start: cursor, end: text.length });
  return tokens;
}

/** The word token that contains character `index`, or the next word if `index` sits on punctuation or a space. */
export function wordAt(tokens: readonly Token[], index: number): Token | null {
  return tokens.find((t) => t.isWord && t.end > index) ?? null;
}

/** Whether a speech-boundary range [start, end) touches this token. */
export const overlaps = (token: Token, start: number, end: number): boolean =>
  token.isWord && token.start < Math.max(end, start + 1) && token.end > start;
