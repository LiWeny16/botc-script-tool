import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Dispatch, PointerEvent, RefObject, SetStateAction } from 'react';

const MIN_ZOOM = 50;
const MAX_ZOOM = 500;

/** Shared zoom-at-pointer and mouse-pan behavior for both A4 viewers. */
export function usePreviewGestures(viewportRef: RefObject<HTMLDivElement | null>, enabled: boolean,
  zoom: number, setZoom: Dispatch<SetStateAction<number>>) {
  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;
  const anchor = useRef<{ x: number; y: number; fractionX: number; fractionY: number } | null>(null);
  const drag = useRef<{ id: number; x: number; y: number; left: number; top: number } | null>(null);
  const [panning, setPanning] = useState(false);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!enabled || !viewport) return;
    const wheel = (event: WheelEvent) => {
      if ((!event.ctrlKey && !event.metaKey) || !event.deltaY) return;
      event.preventDefault(); event.stopPropagation();
      const content = viewport.querySelector<HTMLElement>('[data-preview-content]');
      if (!content) return;
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? viewport.clientHeight : 1;
      const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Math.round(zoomRef.current * Math.exp(-event.deltaY * unit * 0.0015))));
      if (next === zoomRef.current) return;
      const rect = content.getBoundingClientRect();
      anchor.current = { x: event.clientX, y: event.clientY,
        fractionX: Math.max(0, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width))),
        fractionY: Math.max(0, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height))) };
      zoomRef.current = next; setZoom(next);
    };
    viewport.addEventListener('wheel', wheel, { passive: false });
    return () => viewport.removeEventListener('wheel', wheel);
  }, [enabled, setZoom, viewportRef]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current, point = anchor.current;
    if (!viewport || !point) return;
    anchor.current = null;
    const rect = viewport.querySelector<HTMLElement>('[data-preview-content]')?.getBoundingClientRect();
    if (!rect) return;
    viewport.scrollLeft += rect.left + rect.width * point.fractionX - point.x;
    viewport.scrollTop += rect.top + rect.height * point.fractionY - point.y;
  }, [zoom, viewportRef]);

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = event.currentTarget;
    if (event.pointerType !== 'mouse' || event.button !== 0 ||
      (viewport.scrollWidth <= viewport.clientWidth && viewport.scrollHeight <= viewport.clientHeight)) return;
    event.preventDefault(); viewport.setPointerCapture(event.pointerId);
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
    setPanning(true);
  };
  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    event.preventDefault();
    event.currentTarget.scrollLeft = drag.current.left - (event.clientX - drag.current.x);
    event.currentTarget.scrollTop = drag.current.top - (event.clientY - drag.current.y);
  };
  const stopPan = (event: PointerEvent<HTMLDivElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    drag.current = null; setPanning(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };
  return { panning, onPointerDown, onPointerMove, onPointerUp: stopPan, onPointerCancel: stopPan, onLostPointerCapture: stopPan };
}
