import { describe, expect, it } from 'vitest';
import { errorMessage } from './apiError';

describe('errorMessage', () => {
  it('uses the message the API sent', () => {
    expect(errorMessage(409, { message: 'You already own this book' })).toBe('You already own this book');
  });
  it('adds a short reference to a server error that has a request id', () => {
    expect(errorMessage(500, { message: 'Something went wrong on our side', requestId: '3f2a9c1e-aaaa-bbbb-cccc-123456789012' })).toBe(
      'Something went wrong on our side (reference 3f2a9c1e)',
    );
  });
  it('does not add a reference to a client error', () => {
    expect(errorMessage(422, { message: 'Request validation failed', requestId: 'abcdef12-0000' })).toBe('Request validation failed');
  });
  it('falls back to a plain sentence when the answer was not our JSON (for example a platform error page)', () => {
    expect(errorMessage(502, undefined)).toBe('The server had a problem. Try again in a moment.');
    expect(errorMessage(404, null)).toBe('Something went wrong');
    expect(errorMessage(500, { message: 42 as unknown as string })).toBe('The server had a problem. Try again in a moment.');
  });
});
