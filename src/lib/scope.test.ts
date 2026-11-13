import { describe, expect, it } from 'vitest';
import { requestScope } from './scope';

describe('requestScope', () => {
  it('changes when a different person is signed in, so old data is never shown to them', () => {
    expect(requestScope('a', ['moon'])).not.toBe(requestScope('b', ['moon']));
    expect(requestScope(null, ['moon'])).not.toBe(requestScope('a', ['moon']));
  });
  it('changes with the parameters (another book is another request)', () => {
    expect(requestScope('a', ['moon'])).not.toBe(requestScope('a', ['boat']));
  });
  it('stays the same for the same person and parameters, e.g. across a purchase', () => {
    expect(requestScope('a', ['moon'])).toBe(requestScope('a', ['moon']));
    expect(requestScope(undefined, [])).toBe(requestScope(null, []));
  });
});
