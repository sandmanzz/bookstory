import { useEffect, useRef, useState } from 'react';

interface Options {
  /** The reader pressed "Auto read". */
  enabled: boolean;
  /** Changes on every page, so each page is read once. */
  stepKey: number;
  /** A closed book opens by itself; a page is read aloud; at the end there is nothing left to do. */
  kind: 'cover' | 'page' | 'end';
  /** Re-read the page when this changes (e.g. the language mode). */
  restartKey: string;
  /** Speak the current page, then call `onDone`. */
  readPage: (onDone: () => void) => void;
  stop: () => void;
  /** An unanswered question holds auto read on this page until it is answered (or the reader turns the page). */
  hold: boolean;
  advance: () => void;
}

const COVER_DELAY_MS = 900;
const PAGE_PAUSE_MS = 1100; // a breath between pages, so the page turn and the next page do not tumble over each other

/**
 * Hands-free reading: open the book, read each page aloud, wait for a question if the page has one, then turn the page.
 * It stops by itself at the end. Turning a page by hand or pausing simply changes what this effect sees.
 */
export function useAutoRead({ enabled, stepKey, kind, restartKey, readPage, stop, hold, advance }: Options) {
  const [spokenStep, setSpokenStep] = useState<number | null>(null);
  // Always call the latest callbacks without restarting the reading every time a parent re-renders.
  const latest = useRef({ readPage, stop, advance });
  useEffect(() => {
    latest.current = { readPage, stop, advance };
  });

  useEffect(() => {
    if (!enabled || kind !== 'page') return;
    let cancelled = false;
    latest.current.readPage(() => {
      if (!cancelled) setSpokenStep(stepKey);
    });
    return () => {
      cancelled = true;
      latest.current.stop();
    };
  }, [enabled, kind, stepKey, restartKey]);

  const pageSpoken = kind === 'page' && spokenStep === stepKey;

  useEffect(() => {
    if (!enabled) return;
    const ready = kind === 'cover' || (pageSpoken && !hold);
    if (!ready) return;
    const timer = window.setTimeout(() => latest.current.advance(), kind === 'cover' ? COVER_DELAY_MS : PAGE_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [enabled, kind, pageSpoken, hold, stepKey]);

  return { waiting: enabled && pageSpoken && hold };
}
