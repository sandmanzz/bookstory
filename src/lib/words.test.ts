import { describe, expect, it } from 'vitest';
import { overlaps, tokenize, wordAt } from './words';

describe('tokenize', () => {
  it('separates words from punctuation and spaces without losing a character', () => {
    const text = 'The moon yawned, "I am so sleepy!"';
    const tokens = tokenize(text);
    expect(tokens.map((t) => t.text).join('')).toBe(text);
    expect(tokens.filter((t) => t.isWord).map((t) => t.text)).toEqual(['The', 'moon', 'yawned', 'I', 'am', 'so', 'sleepy']);
  });

  it('keeps contractions and hyphenated words whole', () => {
    expect(
      tokenize("I can't see kunang-kunang")
        .filter((t) => t.isWord)
        .map((t) => t.text),
    ).toEqual(['I', "can't", 'see', 'kunang-kunang']);
  });

  it('handles accented letters, digits and a trailing ellipsis', () => {
    expect(
      tokenize('Zzzz… café 10')
        .filter((t) => t.isWord)
        .map((t) => t.text),
    ).toEqual(['Zzzz', 'café', '10']);
  });

  it('handles empty text and punctuation-only text', () => {
    expect(tokenize('')).toEqual([]);
    expect(tokenize('…!').every((t) => !t.isWord)).toBe(true);
  });

  it('records offsets that index back into the string', () => {
    const text = 'Bulan menguap';
    for (const t of tokenize(text)) expect(text.slice(t.start, t.end)).toBe(t.text);
  });
});

describe('finding the spoken word', () => {
  const tokens = tokenize('Hello, big moon');
  it('finds the word at a character index', () => {
    expect(wordAt(tokens, 0)?.text).toBe('Hello');
    expect(wordAt(tokens, 7)?.text).toBe('big');
  });
  it('moves to the next word when the index sits on punctuation', () => {
    expect(wordAt(tokens, 5)?.text).toBe('big');
  });
  it('returns null past the last word', () => {
    expect(wordAt(tokens, 99)).toBeNull();
  });
  it('matches a speech boundary range, even a zero-length one', () => {
    const big = tokens.find((t) => t.text === 'big')!;
    expect(overlaps(big, 7, 10)).toBe(true);
    expect(overlaps(big, 7, 7)).toBe(true);
    expect(overlaps(big, 0, 5)).toBe(false);
  });
});
