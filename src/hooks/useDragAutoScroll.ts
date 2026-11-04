import { useCallback, useEffect, useRef } from 'react';

/**
 * Bounded, self-terminating page autoscroll for dnd-kit drags.
 *
 * Why this exists: dnd-kit's built-in AutoScroller treats the outer 20% of the
 * scroll container as a hot zone (≈150px on a 720px-tall window) and keeps its
 * 5ms scroll interval alive when a drop lands inside that zone. Dragging a card
 * that sits near the top of the page therefore scrolls the whole page to the very
 * top, and the scrolling can keep running after the mouse is released.
 *
 * This controller only scrolls while the pointer is inside a narrow edge band, at
 * a speed that ramps down as the pointer leaves the band, and it always stops on
 * drop, cancel, pointer release, or unmount.
 */

/** Height of the hot band at the top/bottom edge of the viewport, in CSS px. */
const EDGE_BAND_PX = 64;
/** Scroll distance per frame when the pointer just entered the band. */
const MIN_STEP_PX = 3;
/** Scroll distance per frame when the pointer sits on the very edge. */
const MAX_STEP_PX = 16;

interface PointerLike {
  clientY?: number;
  touches?: ArrayLike<{ clientY?: number }>;
  changedTouches?: ArrayLike<{ clientY?: number }>;
  nativeEvent?: PointerLike;
}

/** dnd-kit activator events wrap the native event, sometimes twice. */
export type PointerPositionSource = PointerLike | null | undefined;

type Owner = Record<string, never>;

const owners = new Set<Owner>();
let frameId: number | null = null;
let pointerY: number | null = null;
let tracking = false;

const readPointerY = (source: PointerPositionSource): number | null => {
  let current = source ?? null;
  for (let depth = 0; current && depth < 4; depth += 1) {
    if (typeof current.clientY === 'number') return current.clientY;
    const touchY = current.touches?.[0]?.clientY ?? current.changedTouches?.[0]?.clientY;
    if (typeof touchY === 'number') return touchY;
    current = current.nativeEvent ?? null;
  }
  return null;
};

const stepFor = (distanceFromEdge: number) => {
  const ratio = Math.min(1, Math.max(0, distanceFromEdge / EDGE_BAND_PX));
  return MIN_STEP_PX + (MAX_STEP_PX - MIN_STEP_PX) * (1 - ratio);
};

const trackPointer = (event: Event) => {
  const y = readPointerY(event as PointerLike);
  if (y !== null) pointerY = y;
};

const releaseTracking = () => {
  if (tracking) {
    tracking = false;
    window.removeEventListener('pointermove', trackPointer);
    window.removeEventListener('touchmove', trackPointer);
    window.removeEventListener('pointerup', releaseTracking);
    window.removeEventListener('pointercancel', releaseTracking);
    window.removeEventListener('blur', releaseTracking);
  }

  // A released pointer must never leave a frame queued, even if the drag's own
  // end handler is late (or never arrives).
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }
};

const tick = () => {
  frameId = null;

  if (owners.size === 0) {
    releaseTracking();
    return;
  }

  const y = pointerY;
  if (y !== null) {
    const viewport = window.innerHeight;
    const distanceFromTop = y;
    const distanceFromBottom = viewport - y;

    if (distanceFromTop >= 0 && distanceFromTop < EDGE_BAND_PX) {
      window.scrollBy(0, -stepFor(distanceFromTop));
    } else if (distanceFromBottom >= 0 && distanceFromBottom < EDGE_BAND_PX) {
      window.scrollBy(0, stepFor(distanceFromBottom));
    }
  }

  frameId = window.requestAnimationFrame(tick);
};

const startTracking = () => {
  if (tracking) return;
  tracking = true;
  window.addEventListener('pointermove', trackPointer, { passive: true });
  window.addEventListener('touchmove', trackPointer, { passive: true });
  window.addEventListener('pointerup', releaseTracking, { passive: true });
  window.addEventListener('pointercancel', releaseTracking, { passive: true });
  window.addEventListener('blur', releaseTracking);
};

const stopLoop = () => {
  if (frameId !== null) {
    window.cancelAnimationFrame(frameId);
    frameId = null;
  }
  releaseTracking();
};

export interface DragAutoScrollApi {
  /** Call from the drag start handler; pass the activator event to adopt its pointer position. */
  start: (source?: PointerPositionSource) => void;
  /** Call from drag end / drag cancel handlers. Safe to call repeatedly. */
  stop: () => void;
}

/**
 * Use together with `<DndContext autoScroll={false}>` so dnd-kit cannot run its own
 * hot-zone scroller. Every mounted section shares one controller, so scrolling can
 * never double up when nested DndContexts both report a drag.
 */
export function useDragAutoScroll(): DragAutoScrollApi {
  const ownerRef = useRef<Owner | null>(null);
  if (ownerRef.current === null) ownerRef.current = {};

  const stop = useCallback(() => {
    const owner = ownerRef.current;
    if (!owner) return;
    owners.delete(owner);
    if (owners.size === 0) stopLoop();
  }, []);

  const start = useCallback((source?: PointerPositionSource) => {
    const owner = ownerRef.current;
    if (!owner || typeof window === 'undefined') return;

    const y = readPointerY(source);
    // Always adopt the activator's coordinates: a keyboard drag has no pointer, so
    // a stale value from an earlier mouse drag must not keep the page scrolling.
    pointerY = y;

    owners.add(owner);
    startTracking();
    if (frameId === null) frameId = window.requestAnimationFrame(tick);
  }, []);

  // Never leave a scroll loop running when the section unmounts mid-drag.
  useEffect(() => stop, [stop]);

  return { start, stop };
}
