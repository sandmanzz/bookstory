import { describe, expect, it } from 'vitest';
import { activeLangs, bookTitle, choiceLabel, nextMode, pageText, stickerSound, supports, t } from './i18n';

const book = { title: 'Moon', i18n: { id: { title: 'Bulan', summary: 'Ringkasan' } }, languages: ['en', 'id'] as ('en' | 'id')[] };
const englishOnly = { title: 'Moon', i18n: {}, languages: ['en'] as ('en' | 'id')[] };

describe('picking a language', () => {
  it('returns the translation when there is one and English otherwise', () => {
    expect(bookTitle(book, 'id')).toBe('Bulan');
    expect(bookTitle(book, 'en')).toBe('Moon');
    expect(bookTitle(englishOnly, 'id')).toBe('Moon');
  });
  it('never returns an empty or blank translation', () => {
    expect(pageText({ text: 'Hello', i18n: { id: { text: '  ' } } }, 'id')).toBe('Hello');
  });
  it('localises sticker sounds and answer labels', () => {
    expect(stickerSound({ sound: 'Quack!', i18n: { id: { sound: 'Kwek!' } } }, 'id')).toBe('Kwek!');
    expect(choiceLabel({ label: 'A cat', i18n: {} }, 'id')).toBe('A cat');
  });
});

describe('reading mode', () => {
  it('cycles English, Indonesian, both', () => {
    expect(nextMode('en')).toBe('id');
    expect(nextMode('id')).toBe('both');
    expect(nextMode('both')).toBe('en');
  });
  it('shows both languages only when the book supports both', () => {
    expect(activeLangs(book, 'both')).toEqual(['en', 'id']);
    expect(activeLangs(englishOnly, 'both')).toEqual(['en']);
  });
  it('falls back to English when the wanted language is unavailable', () => {
    expect(activeLangs(englishOnly, 'id')).toEqual(['en']);
    expect(supports(englishOnly, 'id')).toBe(false);
    expect(supports(book, 'id')).toBe(true);
  });
});

describe('interface strings', () => {
  it('has the same keys in every language', () => {
    expect(t('id', 'readToMe')).toBe('Bacakan untukku');
    expect(t('en', 'readToMe')).toBe('Read to me');
  });
});
