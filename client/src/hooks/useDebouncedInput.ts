import { useCallback, useEffect, useRef, useState } from 'react';

const identity = (value: string) => value;

/**
 * A text input that commits its value only after the user pauses typing. Each keystroke stays
 * instant on screen; the expensive part (a URL change and a new request) waits.
 *
 * `committed` is the value as currently applied (from the URL). If it changes for another reason,
 * such as "Clear all" or the Back button, the input follows it. The input doesn't follow the
 * echo of its own commits, so typing never gets overwritten mid-word.
 */
export function useDebouncedInput(
  committed: string,
  onCommit: (value: string) => void,
  delayMs: number,
  normalize: (value: string) => string = identity,
) {
  const [draft, setDraft] = useState(committed);
  const [seen, setSeen] = useState(committed);
  const [lastSent, setLastSent] = useState(committed);
  const timer = useRef<number | undefined>(undefined);

  // Adjusting state while rendering (not in an effect) is React's recommended way to follow a
  // prop: the input never shows a stale value, not even for one frame.
  if (committed !== seen) {
    setSeen(committed);
    if (committed !== lastSent) setDraft(committed);
  }

  // A pending commit must not fire after the input has gone.
  useEffect(() => {
    const pending = timer;
    return () => window.clearTimeout(pending.current);
  }, []);

  const send = useCallback(
    (value: string) => {
      setLastSent(normalize(value));
      onCommit(value);
    },
    [normalize, onCommit],
  );

  const change = useCallback(
    (value: string) => {
      setDraft(value);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => send(value), delayMs);
    },
    [delayMs, send],
  );

  /** Commits immediately, skipping the wait (for a clear button or Enter). */
  const commitNow = useCallback(
    (value: string) => {
      window.clearTimeout(timer.current);
      setDraft(value);
      send(value);
    },
    [send],
  );

  return { draft, change, commitNow };
}
