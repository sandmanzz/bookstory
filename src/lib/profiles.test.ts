import { describe, expect, it } from 'vitest';
import { MAX_PROFILES, activeProfile, addProfile, emptyStore, parseStore, removeProfile, selectProfile, validateProfile } from './profiles';

const mia = { name: 'Mia', avatar: 'fox', age: 3 };
const store = addProfile(emptyStore, mia, 'a');

describe('profile validation', () => {
  it('accepts a normal profile', () => {
    expect(validateProfile(mia, [])).toBeNull();
  });
  it('rejects empty, too-long and duplicate names', () => {
    expect(validateProfile({ ...mia, name: '   ' }, [])).toMatch(/name/i);
    expect(validateProfile({ ...mia, name: 'x'.repeat(21) }, [])).toMatch(/20/);
    expect(validateProfile({ ...mia, name: 'MIA' }, store.profiles)).toMatch(/already/);
  });
  it('rejects unknown avatars and ages outside 0-8', () => {
    expect(validateProfile({ ...mia, avatar: 'dragon' }, [])).toMatch(/picture/);
    expect(validateProfile({ ...mia, age: 9 }, [])).toMatch(/Age/);
    expect(validateProfile({ ...mia, age: 2.5 }, [])).toMatch(/Age/);
  });
  it('caps the number of readers', () => {
    const full = Array.from({ length: MAX_PROFILES }, (_, i) => ({ id: String(i), name: `K${i}`, avatar: 'fox', age: 3 }));
    expect(validateProfile({ ...mia, name: 'Extra' }, full)).toMatch(/up to 4/);
  });
});

describe('profile store', () => {
  it('makes the first profile active and keeps the active one when adding more', () => {
    const two = addProfile(store, { name: 'Leo', avatar: 'lion', age: 5 }, 'b');
    expect(activeProfile(two)?.name).toBe('Mia');
    expect(two.profiles).toHaveLength(2);
  });
  it('trims names', () => {
    expect(addProfile(emptyStore, { ...mia, name: '  Mia  ' }, 'x').profiles[0]?.name).toBe('Mia');
  });
  it('switches the active profile, ignoring unknown ids', () => {
    const two = addProfile(store, { name: 'Leo', avatar: 'lion', age: 5 }, 'b');
    expect(selectProfile(two, 'b').activeId).toBe('b');
    expect(selectProfile(two, 'nope').activeId).toBe('a');
  });
  it('falls back to another profile when the active one is removed', () => {
    const two = addProfile(store, { name: 'Leo', avatar: 'lion', age: 5 }, 'b');
    expect(removeProfile(two, 'a').activeId).toBe('b');
    expect(removeProfile(removeProfile(two, 'a'), 'b').activeId).toBeNull();
  });
});

describe('parseStore', () => {
  it('round-trips a valid store', () => {
    expect(parseStore(JSON.stringify(store))).toEqual(store);
  });
  it('survives garbage and hand-edited data', () => {
    expect(parseStore(null)).toEqual(emptyStore);
    expect(parseStore('{not json')).toEqual(emptyStore);
    expect(parseStore(JSON.stringify({ profiles: [{ id: 5 }, null, 'x'], activeId: 'zzz' }))).toEqual(emptyStore);
  });
  it('repairs an active id that points nowhere', () => {
    expect(parseStore(JSON.stringify({ profiles: store.profiles, activeId: 'ghost' })).activeId).toBe('a');
  });
});
