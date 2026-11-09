import { useCallback, useEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import type { KeyboardEvent, PointerEvent } from 'react';
import { DEFAULT_TITLE_FONT_SIZE_MD, uiConfigStore } from '../stores/UIConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import { clampRectMove, LAYOUT_DRAG_THRESHOLD_PX, LAYOUT_SNAP_THRESHOLD_PX, snapHeaderMove } from '../utils/headerAlignment';
import type { HeaderRect } from '../utils/headerAlignment';
import { measureHeaderLayoutBounds } from '../utils/headerLayoutBounds';
import { defaultHeaderAdjustment, normalizeHeaderAdjustment } from '../utils/headerLayout';
import type { HeaderLayoutAdjustment, HeaderLayoutTarget } from '../utils/headerLayout';

export type HeaderResizeEdge = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
type ResizeKind = 'box' | 'avatar' | 'title' | 'titleImage';
type Point = { x: number; y: number };
interface ActiveDrag {
  pointerId: number; startX: number; startY: number; scale: number; height: number; avatarSize: number;
  initial: HeaderLayoutAdjustment; next: HeaderLayoutAdjustment; initialRect: HeaderRect; containmentRect: HeaderRect; bounds: HeaderRect;
  vertical: number[]; horizontal: number[]; item: HTMLElement; sizeElement: HTMLElement; avatar: HTMLElement | null;
  itemStyle: string; sizeStyle: string; avatarStyle: string; guide: HTMLElement | null; guideX: HTMLElement | null; guideY: HTMLElement | null;
  captured: boolean; moved: boolean; raf: number | null; pending: Point | null;
  titleElement: HTMLElement | null; titleElementStyle: string; titleSize: number; titleConfigSize: number; nextTitleSize: number;
}
const relativeRect = (element: Element, page: HTMLElement, scale: number): HeaderRect => {
  const rect = element.getBoundingClientRect(), origin = page.getBoundingClientRect();
  return { left: (rect.left - origin.left) / scale, right: (rect.right - origin.left) / scale,
    top: (rect.top - origin.top) / scale, bottom: (rect.bottom - origin.top) / scale };
};

export function useHeaderLayoutDrag(target: HeaderLayoutTarget, mode: 'move' | 'resize', deferCapture = false,
  edge: HeaderResizeEdge = 'bottom-right', resizeKind: ResizeKind = 'box') {
  const drag = useRef<ActiveDrag | null>(null);
  const suppressClick = useRef(false);
  const cleanupFallback = useRef<(() => void) | null>(null);
  const stopFallback = useCallback(() => { cleanupFallback.current?.(); cleanupFallback.current = null; }, []);

  const preview = useCallback((current: ActiveDrag, point: Point) => {
    let dx = (point.x - current.startX) / current.scale, dy = (point.y - current.startY) / current.scale;
    if (mode === 'move') {
      const snapped = snapHeaderMove(current.initialRect, dx, dy, current.vertical, current.horizontal, LAYOUT_SNAP_THRESHOLD_PX);
      const safe = clampRectMove(current.containmentRect, current.bounds, snapped.dx, snapped.dy);
      dx = safe.dx; dy = safe.dy;
      if (current.guideX) { current.guideX.style.display = snapped.vertical !== null && Math.abs(dx - snapped.dx) < .5 ? 'block' : 'none'; current.guideX.style.left = `${snapped.vertical || 0}px`; }
      if (current.guideY) { current.guideY.style.display = snapped.horizontal !== null && Math.abs(dy - snapped.dy) < .5 ? 'block' : 'none'; current.guideY.style.top = `${snapped.horizontal || 0}px`; }
    } else {
      if (edge.includes('left')) dx = Math.max(current.bounds.left - current.containmentRect.left, dx);
      if (edge.includes('right')) dx = Math.min(current.bounds.right - current.containmentRect.right, dx);
      if (edge.includes('top')) dy = Math.max(current.bounds.top - current.containmentRect.top, dy);
      if (edge.includes('bottom')) dy = Math.min(current.bounds.bottom - current.containmentRect.bottom, dy);
    }
    if (mode === 'resize' && (resizeKind === 'title' || resizeKind === 'titleImage') && current.titleElement) {
      const horizontal = edge.includes('left') ? -dx : edge.includes('right') ? dx : null;
      const vertical = edge.includes('top') ? -dy : edge.includes('bottom') ? dy : null;
      const parts = [horizontal === null ? null : horizontal / Math.max(1, current.initialRect.right - current.initialRect.left),
        vertical === null ? null : vertical / Math.max(1, current.initialRect.bottom - current.initialRect.top)].filter((v): v is number => v !== null);
      const factor = Math.max(0.25, 1 + parts.reduce((sum, value) => sum + value, 0) / Math.max(1, parts.length));
      current.nextTitleSize = Math.max(resizeKind === 'title' ? 16 : 40, Math.min(resizeKind === 'title' ? 112 : 600, current.titleConfigSize * factor));
      const previewSize = current.titleSize * current.nextTitleSize / current.titleConfigSize;
      if (resizeKind === 'title') current.titleElement.style.fontSize = `${previewSize}px`;
      else current.titleElement.style.maxHeight = `${previewSize}px`;
      return;
    }
    let updates: Partial<HeaderLayoutAdjustment>;
    if (mode === 'move') updates = { x: current.initial.x + dx, y: current.initial.y + dy };
    else {
      const horizontal = edge.includes('right') ? dx : edge.includes('left') ? -dx : 0;
      const vertical = edge.includes('bottom') ? dy : edge.includes('top') ? -dy : 0;
      if (resizeKind === 'avatar') {
        const parts = [edge.includes('left') || edge.includes('right') ? horizontal : null,
          edge.includes('top') || edge.includes('bottom') ? vertical : null].filter((v): v is number => v !== null);
        const amount = parts.reduce((sum, value) => sum + value, 0) / Math.max(1, parts.length);
        updates = { scale: current.initial.scale * (1 + amount / Math.max(current.avatarSize, 1)) };
        if (edge.includes('left')) updates.x = current.initial.x + dx;
        if (edge.includes('top')) updates.y = current.initial.y + dy;
      } else {
        updates = { widthDelta: current.initial.widthDelta + horizontal };
        if (Math.abs(vertical) >= 3) updates.minHeight = current.height + vertical;
        if (edge.includes('left')) updates.x = current.initial.x + (target.startsWith('title') ? dx / 2 : dx);
        else if (edge.includes('right') && target.startsWith('title')) updates.x = current.initial.x + dx / 2;
        if (edge.includes('top')) updates.y = current.initial.y + dy;
      }
    }
    const next = normalizeHeaderAdjustment({ ...current.initial, ...updates });
    current.next = next;
    if (target.startsWith('title')) {
      current.item.style.left = `${next.x}px`; current.item.style.top = `${next.y}px`;
    } else if (target.startsWith('rule')) {
      current.item.style.transform = `translate(${next.x - current.initial.x}px, ${next.y - current.initial.y}px)`;
    } else current.item.style.transform = `translate(${next.x}px, ${next.y}px)`;
    if (mode === 'resize' && resizeKind === 'avatar' && current.avatar) {
      const size = current.avatarSize * next.scale / current.initial.scale;
      current.avatar.style.width = `${size}px`; current.avatar.style.height = `${size}px`;
    } else if (mode === 'resize' && resizeKind === 'box') {
      const width = Math.max(120, current.initialRect.right - current.initialRect.left + next.widthDelta - current.initial.widthDelta);
      current.sizeElement.style.width = `${width}px`; current.sizeElement.style.maxWidth = 'none';
      if (next.minHeight !== current.initial.minHeight) current.sizeElement.style.minHeight = `${next.minHeight}px`;
    }
  }, [mode, edge, resizeKind, target]);
  const finishDrag = useCallback((pointerId: number) => {
    const current = drag.current;
    if (!current || current.pointerId !== pointerId) return;
    if (current.raf !== null) cancelAnimationFrame(current.raf);
    if (current.pending) preview(current, current.pending);
    drag.current = null; stopFallback(); current.guide?.remove();
    if (current.moved) flushSync(() => {
      if (mode === 'resize' && resizeKind === 'title') {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        uiConfigStore.updateConfig({ titleFontSize: { ...uiConfigStore.config.titleFontSize, md: `${Math.round(current.nextTitleSize / rootSize * 100) / 100}rem` } });
      } else if (mode === 'resize' && resizeKind === 'titleImage') scriptStore.updateTitleInfo({ titleImageSize: Math.round(current.nextTitleSize) });
      else uiConfigStore.setHeaderLayout(target, current.next);
    });
    current.item.style.cssText = current.itemStyle;
    delete current.item.dataset.headerDragging;
    if (current.sizeElement !== current.item) current.sizeElement.style.cssText = current.sizeStyle;
    if (current.avatar) current.avatar.style.cssText = current.avatarStyle;
    if (current.titleElement) current.titleElement.style.cssText = current.titleElementStyle;
  }, [mode, preview, resizeKind, stopFallback, target]);
  useEffect(() => () => { const current = drag.current; if (current) finishDrag(current.pointerId); stopFallback(); }, [finishDrag, stopFallback]);

  const onPointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    suppressClick.current = false;
    if (deferCapture && (event.target as Element).closest('button')) return;
    if (deferCapture && event.pointerType !== 'mouse') event.currentTarget.focus({ preventScroll: true });
    stopFallback();
    const root = event.currentTarget.closest<HTMLElement>('#script-preview');
    const page = root?.querySelector<HTMLElement>('#main_script');
    const item = event.currentTarget.closest<HTMLElement>('[data-header-layout-item]');
    if (!root || !page || !item) return;
    const measuredBounds = measureHeaderLayoutBounds(root, page, target);
    const scale = measuredBounds.scale;
    const avatar = item.querySelector<HTMLElement>('[data-header-avatar-image]');
    const titleElement = resizeKind === 'title' ? item.querySelector<HTMLElement>('[data-title-text]')
      : resizeKind === 'titleImage' ? item.querySelector<HTMLElement>('[data-title-image] img') : null;
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const configured = uiConfigStore.config.titleFontSize.md;
    const titleConfigSize = resizeKind === 'titleImage' ? (scriptStore.script?.titleImageSize || 160)
      : (parseFloat(configured) || parseFloat(DEFAULT_TITLE_FONT_SIZE_MD)) * (configured.endsWith('rem') ? rootSize : 1);
    const titleSize = titleElement ? parseFloat(resizeKind === 'title' ? getComputedStyle(titleElement).fontSize : getComputedStyle(titleElement).maxHeight) || titleConfigSize : titleConfigSize;
    const sizeElement = target.startsWith('rule') ? item.parentElement || item : item;
    const vertical = [page.offsetWidth / 2], horizontal: number[] = [];
    const header = page.querySelector<HTMLElement>('.script-header');
    if (header) { const r = relativeRect(header, page, scale); horizontal.push((r.top + r.bottom) / 2); }
    page.querySelectorAll<HTMLElement>('[data-header-layout-item]').forEach(other => {
      if (other === item) return;
      const r = relativeRect(other, page, scale); vertical.push(r.left, (r.left + r.right) / 2, r.right); horizontal.push(r.top, (r.top + r.bottom) / 2, r.bottom);
    });
    const initial = { ...uiConfigStore.config.headerLayout[target] };
    const initialRect = relativeRect(item, page, scale || 1);
    const containmentRect = initialRect;
    item.dataset.headerDragging = 'true';
    let guide: HTMLElement | null = null, guideX: HTMLElement | null = null, guideY: HTMLElement | null = null;
    if (mode === 'move') {
      const headerBottom = measureHeaderLayoutBounds(root, page, 'authorLine').layout.bottom;
      guide = document.createElement('div'); guide.className = 'header-drag-guides';
      guide.style.cssText = 'position:absolute;inset:0;z-index:30;pointer-events:none';
      guideX = document.createElement('div'); guideX.dataset.guideAxis = 'vertical'; guideX.style.cssText = `display:none;position:absolute;top:0;height:${headerBottom}px;border-left:1px dashed #00929f;filter:drop-shadow(0 0 1px white)`;
      guideY = document.createElement('div'); guideY.dataset.guideAxis = 'horizontal'; guideY.style.cssText = 'display:none;position:absolute;left:0;width:100%;border-top:1px dashed #00929f;filter:drop-shadow(0 0 1px white)';
      guide.append(guideX, guideY); page.appendChild(guide);
    }
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, scale: scale || 1,
      height: item.getBoundingClientRect().height / (scale || 1), avatarSize: avatar ? avatar.getBoundingClientRect().width / (scale || 1) : 0,
      initial, next: initial, initialRect, containmentRect, bounds: measuredBounds.layout, vertical, horizontal,
      item, sizeElement, avatar, itemStyle: item.style.cssText, sizeStyle: sizeElement.style.cssText, avatarStyle: avatar?.style.cssText || '',
      guide, guideX, guideY, captured: !deferCapture, moved: false, raf: null, pending: null,
      titleElement, titleElementStyle: titleElement?.style.cssText || '', titleSize, titleConfigSize, nextTitleSize: titleConfigSize };
    if (!deferCapture) { event.preventDefault(); event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); }
    else {
      const host = event.currentTarget;
      const onWindowMove = (native: globalThis.PointerEvent) => {
        const current = drag.current;
        if (!current || current.pointerId !== native.pointerId || Math.hypot(native.clientX - current.startX, native.clientY - current.startY) < LAYOUT_DRAG_THRESHOLD_PX * current.scale) return;
        processPointerMove(native, host); stopFallback();
      };
      const onWindowEnd = (native: globalThis.PointerEvent) => finishDrag(native.pointerId);
      window.addEventListener('pointermove', onWindowMove, true); window.addEventListener('pointerup', onWindowEnd, true); window.addEventListener('pointercancel', onWindowEnd, true);
      cleanupFallback.current = () => { window.removeEventListener('pointermove', onWindowMove, true); window.removeEventListener('pointerup', onWindowEnd, true); window.removeEventListener('pointercancel', onWindowEnd, true); };
    }
  };
  function processPointerMove(event: Pick<PointerEvent<HTMLElement>, 'pointerId' | 'clientX' | 'clientY' | 'preventDefault' | 'stopPropagation'>, host: HTMLElement) {
    const current = drag.current; if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < LAYOUT_DRAG_THRESHOLD_PX * current.scale) return;
    current.moved = true;
    suppressClick.current = true;
    if (!current.captured) { host.setPointerCapture(event.pointerId); current.captured = true; }
    event.preventDefault(); event.stopPropagation(); current.pending = { x: event.clientX, y: event.clientY };
    if (current.raf === null) current.raf = requestAnimationFrame(() => {
      current.raf = null; const point = current.pending; current.pending = null; if (drag.current === current && point) preview(current, point);
    });
  }
  const onPointerMove = (event: PointerEvent<HTMLElement>) => processPointerMove(event, event.currentTarget);
  const finish = (event: PointerEvent<HTMLElement>) => finishDrag(event.pointerId);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    const current = uiConfigStore.config.headerLayout[target], step = event.shiftKey ? 10 : 1;
    if (mode === 'resize' && (resizeKind === 'title' || resizeKind === 'titleImage') && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown', 'Home'].includes(event.key)) {
      event.preventDefault(); event.stopPropagation();
      const change = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? step : -step;
      if (resizeKind === 'titleImage') scriptStore.updateTitleInfo({ titleImageSize: event.key === 'Home' ? 160 : Math.max(40, Math.min(600, (scriptStore.script?.titleImageSize || 160) + change)) });
      else {
        const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        const raw = uiConfigStore.config.titleFontSize.md;
        const px = (parseFloat(raw) || parseFloat(DEFAULT_TITLE_FONT_SIZE_MD)) * (raw.endsWith('rem') ? rootSize : 1);
        uiConfigStore.updateConfig({ titleFontSize: { ...uiConfigStore.config.titleFontSize, md: event.key === 'Home' ? DEFAULT_TITLE_FONT_SIZE_MD : `${Math.round(Math.max(16, Math.min(112, px + change)) / rootSize * 100) / 100}rem` } });
      }
      return;
    }
    let updates: Partial<HeaderLayoutAdjustment>;
    if (event.key === 'Home') updates = mode === 'move' ? { x: 0, y: defaultHeaderAdjustment(target).y } : { widthDelta: 0, minHeight: 0, scale: 1 };
    else if (mode === 'move' && event.key === 'ArrowLeft') updates = { x: current.x - step };
    else if (mode === 'move' && event.key === 'ArrowRight') updates = { x: current.x + step };
    else if (mode === 'move' && event.key === 'ArrowUp') updates = { y: current.y - step };
    else if (mode === 'move' && event.key === 'ArrowDown') updates = { y: current.y + step };
    else if (mode === 'resize' && resizeKind === 'avatar' && ['ArrowLeft', 'ArrowUp', 'ArrowRight', 'ArrowDown'].includes(event.key)) updates = { scale: current.scale + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? .05 : -.05) };
    else if (mode === 'resize' && event.key === 'ArrowLeft') updates = { widthDelta: current.widthDelta - step };
    else if (mode === 'resize' && event.key === 'ArrowRight') updates = { widthDelta: current.widthDelta + step };
    else if (mode === 'resize' && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      const item = event.currentTarget.closest<HTMLElement>('[data-header-layout-item]'); updates = { minHeight: (current.minHeight || item?.offsetHeight || 0) + (event.key === 'ArrowDown' ? step : -step) };
    } else return;
    event.preventDefault(); event.stopPropagation();
    if (mode === 'move' && (updates.x !== undefined || updates.y !== undefined)) {
      const root = event.currentTarget.closest<HTMLElement>('#script-preview'), item = event.currentTarget.closest<HTMLElement>('[data-header-layout-item]');
      if (root && item) {
        const page = root.querySelector<HTMLElement>('#main_script');
        if (!page) return;
        const measuredBounds = measureHeaderLayoutBounds(root, page, target);
        const scale = measuredBounds.scale;
        const rect = item.getBoundingClientRect();
        const safe = clampRectMove(rect, measuredBounds.screen, ((updates.x ?? current.x) - current.x) * scale, ((updates.y ?? current.y) - current.y) * scale);
        updates.x = current.x + safe.dx / scale; updates.y = current.y + safe.dy / scale;
      }
    }
    uiConfigStore.setHeaderLayout(target, updates, { resetAnchor: event.key === 'Home' && mode === 'move' });
  };
  const onClickCapture = (event: React.MouseEvent<HTMLElement>) => {
    if ((event.target as Element).closest('[data-layout-control]')) { suppressClick.current = false; return; }
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.preventDefault();
    event.stopPropagation();
  };
  return { onPointerDown, onPointerMove, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish, onKeyDown, onClickCapture };
}
