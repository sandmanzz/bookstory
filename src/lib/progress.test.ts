import { describe, expect, it } from 'vitest';
import { progressProfileId, resumePoint, slugFromKey } from './progress';

describe('resumePoint', () => {
  it('reopens mid-book where the reader stopped', () => {
    expect(resumePoint(3, 6, false)).toBe(3);
  });
  it('restarts a finished book from the cover', () => {
    expect(resumePoint(7, 6, false)).toBe(0);
  });
  it('after a paywall, resumes on the last readable page (e.g. just after buying)', () => {
    expect(resumePoint(3, 2, true)).toBe(2);
  });
  it('treats no saved progress as the cover', () => {
    expect(resumePoint(0, 6, false)).toBe(0);
  });
});

describe('progress keys', () => {
  it('reads the slug for the right profile only', () => {
    expect(slugFromKey('mia', 'ms:progress:mia:moon-wants-a-nap')).toBe('moon-wants-a-nap');
    expect(slugFromKey('mia', 'ms:progress:leo:moon-wants-a-nap')).toBeNull();
    expect(slugFromKey('mia', 'ms:profiles')).toBeNull();
    expect(slugFromKey('mia', 'ms:progress:mia:')).toBeNull();
  });
  it('falls back to a guest profile when nobody is selected', () => {
    expect(progressProfileId(null)).toBe('guest');
    expect(progressProfileId('mia')).toBe('mia');
  });
});
