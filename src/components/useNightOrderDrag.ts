import { useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { KeyboardEvent, PointerEvent } from 'react';
import { uiConfigStore } from '../stores/UIConfigStore';

type Side = 'first' | 'other';

/** The title moves the whole column; its character icons retain their own drag behavior. */
export function useNightOrderDrag(side: Side) {
  const drag = useRef<{ id: number; y: number; scale: number; initial: number; top: number; maximum: number; next: number; moved: boolean; column: HTMLElement; style: string } | null>(null);
  useEffect(() => () => { if (drag.current) drag.current.column.style.cssText = drag.current.style; }, []);
  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const column = event.currentTarget.closest<HTMLElement>('[data-night-order-side]');
    const paper = column?.closest<HTMLElement>('#script-preview');
    if (!column || !paper) return;
    const rect = paper.getBoundingClientRect();
    const scale = paper.offsetWidth ? rect.width / paper.offsetWidth : 1;
    const top = parseFloat(getComputedStyle(column).paddingTop) || 0;
    const titleHeight = event.currentTarget.getBoundingClientRect().height / scale;
    drag.current = { id: event.pointerId, y: event.clientY, scale, initial: uiConfigStore.config.nightOrderOffsets[side],
      top, maximum: Math.max(0, paper.clientHeight - titleHeight), next: top, moved: false, column, style: column.style.cssText };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const delta = (event.clientY - current.y) / current.scale;
    if (!current.moved && Math.abs(delta) < 3) return;
    current.moved = true;
    event.preventDefault(); event.stopPropagation();
    current.next = Math.max(0, Math.min(current.maximum, current.top + delta));
    current.column.style.paddingTop = `${current.next}px`;
  };
  const finish = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (current.moved) flushSync(() => uiConfigStore.updateConfig({ nightOrderOffsets: { ...uiConfigStore.config.nightOrderOffsets,
      [side]: Math.round(current.initial + current.next - current.top) } }));
    current.column.style.cssText = current.style;
  };
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!['ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    const current = uiConfigStore.config.nightOrderOffsets[side];
    const column = event.currentTarget.closest<HTMLElement>('[data-night-order-side]');
    const paper = column?.closest<HTMLElement>('#script-preview');
    const top = column ? parseFloat(getComputedStyle(column).paddingTop) || 0 : 0;
    const maximum = paper ? Math.max(0, paper.clientHeight - event.currentTarget.offsetHeight) : Number.POSITIVE_INFINITY;
    const requested = (event.key === 'ArrowDown' ? 1 : -1) * (event.shiftKey ? 10 : 1);
    const next = event.key === 'Home' ? 0 : current + Math.max(-top, Math.min(maximum - top, requested));
    uiConfigStore.updateConfig({ nightOrderOffsets: { ...uiConfigStore.config.nightOrderOffsets, [side]: next } });
  };
  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish, onKeyDown };
}
