/**
 * The text a person sees for a failed request. Our API always answers `{ error: { code, message, requestId? } }`,
 * but a proxy or the platform can answer with a page that is not JSON at all, so every part is optional.
 *
 * For a server error the short reference (the first 8 characters of the request id) is added, so what someone reads
 * out or pastes into a message matches one line in the server log.
 */
export function errorMessage(status: number, error?: { message?: unknown; requestId?: unknown } | null): string {
  const message =
    typeof error?.message === 'string' && error.message
      ? error.message
      : status >= 500
        ? 'The server had a problem. Try again in a moment.'
        : 'Something went wrong';
  const ref = typeof error?.requestId === 'string' && error.requestId ? error.requestId.slice(0, 8) : null;
  return status >= 500 && ref ? `${message} (reference ${ref})` : message;
}
