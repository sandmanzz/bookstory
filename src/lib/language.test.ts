import { describe, expect, it } from 'vitest';
import { defaultMode, parseMode } from './language';

describe('language preference', () => {
  it('starts Indonesian browsers in Indonesian and everyone else in English', () => {
    expect(defaultMode('id-ID')).toBe('id');
    expect(defaultMode('id')).toBe('id');
    expect(defaultMode('en-US')).toBe('en');
    expect(defaultMode(undefined)).toBe('en');
  });
  it('accepts only known modes from storage', () => {
    expect(parseMode('both', 'en')).toBe('both');
    expect(parseMode('fr', 'id')).toBe('id');
    expect(parseMode(null, 'en')).toBe('en');
  });
});
