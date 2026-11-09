import { useEffect, useRef } from 'react';

/** Coalesce high-frequency pointer events into one visual update per frame. */
export function useRafPointer<T>(apply: (value: T) => void) {
  const applyRef = useRef(apply);
  applyRef.current = apply;
  const pending = useRef<T | null>(null);
  const frame = useRef<number | null>(null);
  const flush = () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    const value = pending.current; pending.current = null;
    if (value !== null) applyRef.current(value);
  };
  const schedule = (value: T) => {
    pending.current = value;
    if (frame.current === null) frame.current = requestAnimationFrame(flush);
  };
  useEffect(() => () => { if (frame.current !== null) cancelAnimationFrame(frame.current); }, []);
  return { schedule, flush };
}
