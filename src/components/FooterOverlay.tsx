import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { FooterComponent } from '../types';
import { clampRectMove, LAYOUT_DRAG_THRESHOLD_PX } from '../utils/headerAlignment';
import { uiConfigStore } from '../stores/UIConfigStore';
import FooterLayoutFrame from './FooterLayoutFrame';
import type { FooterEdge } from './FooterLayoutFrame';
import { useTranslation } from '../utils/i18n';
import { footerText } from '../utils/footerText';
import { useRafPointer } from './useRafPointer';
import { useContainedBottom } from './useContainedBottom';
import { createFooterDragGuides } from './footerDragGuides';
import { useLayoutContextMenu } from './LayoutContextMenu';
import { NIGHT_LEGEND_ASPECT_RATIO, NIGHT_LEGEND_CLOUD_FRACTION, normalizeLegendLayout, nudgeFooterComponentLayout, resetFooterComponentLayout } from '../utils/footerLayout';

interface Props {
  item: FooterComponent;
  containerRef: React.RefObject<HTMLElement | null>;
  readOnly: boolean;
  onSave: (item: FooterComponent) => void;
  onEdit: (item: FooterComponent) => void;
  onDelete: (id: string) => void;
}

const limit = (n: number, low: number, high: number) => Math.max(low, Math.min(high, Number.isFinite(n) ? n : low));

export default function FooterOverlay({ item, containerRef, readOnly, onSave, onEdit, onDelete }: Props) {
  const { t, language } = useTranslation();
  const s = footerText(language);
  const [draft, setDraft] = useState(() => normalizeLegendLayout(item));
  const current = useRef(normalizeLegendLayout(item));
  const itemRef = useRef<HTMLDivElement>(null);
  const { maxBottom, paperWidth } = useContainedBottom(containerRef, itemRef);
  const drag = useRef<{ id: number; x: number; y: number; item: FooterComponent; rect: DOMRect; bounds: DOMRect; mode: FooterEdge | 'move'; moved: boolean; guide: ReturnType<typeof createFooterDragGuides> | null } | null>(null);
  useEffect(() => { const next = normalizeLegendLayout(item); current.current = next; setDraft(next); }, [item]);
  useEffect(() => () => { drag.current?.guide?.remove(); }, []);
  const update = (next: FooterComponent) => { current.current = next; setDraft(next); };
  const menu = useLayoutContextMenu(
    { edit: t('ui.edit'), reset: t('ui.resetLayout'), remove: t('ui.delete') },
    {
      edit: () => onEdit(current.current),
      reset: () => {
        const next = resetFooterComponentLayout(current.current);
        current.current = next;
        setDraft(next);
        onSave(next);
      },
      remove: () => onDelete(item.id),
    },
  );

  const start = (event: React.PointerEvent<HTMLElement>, mode: FooterEdge | 'move') => {
    if (readOnly || (event.pointerType === 'mouse' && event.button !== 0)) return;
    if ((event.target as HTMLElement).closest('[data-layout-control]')) return;
    const host = event.currentTarget.closest<HTMLElement>('[data-footer-item]');
    const container = containerRef.current;
    if (!host || !container) return;
    event.preventDefault(); event.stopPropagation();
    host.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const visibleBottom = Number.parseFloat(getComputedStyle(host).bottom);
    const hostRect = host.getBoundingClientRect(), bounds = container.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      item: { ...current.current, x: (hostRect.left - bounds.left) / bounds.width * 100,
        width: hostRect.width / bounds.width * 100, y: item.type === 'nightLegend' ? 0 : visibleBottom || 0 },
      rect: hostRect, bounds, mode, moved: false, guide: mode === 'move' ? createFooterDragGuides(container, host) : null };
  };
  const raf = useRafPointer((point: { x: number; y: number }) => {
    const d = drag.current; if (!d) return;
    const dx = point.x - d.x;
    const dy = point.y - d.y;
    if (d.mode !== 'move') {
      const left = d.mode.includes('left'), right = d.mode.includes('right');
      const top = d.mode.includes('top'), bottom = d.mode.includes('bottom');
      if (d.item.type === 'nightLegend') {
        const horizontal = left ? -dx : right ? dx : 0;
        const vertical = (top ? -dy : bottom ? dy : 0) * NIGHT_LEGEND_ASPECT_RATIO;
        const maxHeightPx = d.rect.bottom - d.bounds.top;
        const maxWidthPx = Math.min(
          left ? d.rect.right - d.bounds.left : d.bounds.right - d.rect.left,
          maxHeightPx * NIGHT_LEGEND_ASPECT_RATIO,
        );
        const minWidth = Math.min(100, 95 / (containerRef.current?.clientWidth || d.bounds.width) * 100);
        const width = limit(
          d.item.width + (left || right ? horizontal : vertical) / d.bounds.width * 100,
          minWidth,
          Math.max(minWidth, maxWidthPx / d.bounds.width * 100),
        );
        const widthChange = (width - d.item.width) / 100 * d.bounds.width;
        const centerResize = !left && !right && (top || bottom);
        update({
          ...d.item,
          width,
          x: limit(d.item.x - widthChange / d.bounds.width * 100 * (left ? 1 : centerResize ? 0.5 : 0), 0, 100 - width),
          y: 0,
          height: undefined,
        });
        return;
      }
      let horizontal = left ? -dx : right ? dx : 0;
      const vertical = top ? -dy : bottom ? dy : 0;
      const scale = containerRef.current?.offsetWidth ? d.bounds.width / containerRef.current.offsetWidth : 1;
      if (d.item.type === 'image' && !left && !right && d.rect.height) horizontal = vertical * d.rect.width / d.rect.height;
      if (d.item.type === 'image' && (left || right) && (top || bottom) && d.rect.height) {
        horizontal = (horizontal + vertical * d.rect.width / d.rect.height) / 2;
      }
      const maxWidthPx = left ? d.rect.right - d.bounds.left : d.bounds.right - d.rect.left;
      const maxHeightPx = d.rect.bottom - d.bounds.top;
      let maxWidth = 100 * maxWidthPx / d.bounds.width;
      if (d.item.type === 'image' && d.rect.width && d.rect.height) maxWidth = Math.min(maxWidth, maxHeightPx * d.rect.width / d.rect.height / d.bounds.width * 100);
      const minWidth = d.item.type === 'image' ? 4 : 12;
      const width = (left || right || d.item.type === 'image') ? limit(d.item.width + horizontal / d.bounds.width * 100, minWidth, Math.max(minWidth, maxWidth)) : d.item.width;
      const widthChange = (width - d.item.width) / 100 * d.bounds.width;
      const height = d.item.type === 'image' || (!top && !bottom) ? d.item.height
        : limit((d.item.height || d.rect.height / scale) + vertical / scale, 30, Math.max(30, maxHeightPx / scale));
      update({ ...d.item, width, height,
        x: left ? limit(d.item.x - widthChange / d.bounds.width * 100, 0, 100) : d.item.x,
        y: bottom && d.item.type !== 'image' ? Math.max(0, d.item.y - (vertical / scale)) : d.item.y });
    } else {
      const safe = d.guide?.move(d.rect, d.bounds, dx, dy, d.item.type === 'nightLegend')
        || clampRectMove(d.rect, d.bounds, dx, d.item.type === 'nightLegend' ? 0 : dy);
      const scale = containerRef.current?.offsetWidth ? d.bounds.width / containerRef.current.offsetWidth : 1;
      update({ ...d.item, x: limit(d.item.x + safe.dx / d.bounds.width * 100, 0, 100),
        y: d.item.type === 'nightLegend' ? 0 : Math.max(0, d.item.y - safe.dy / scale),
        ...(d.item.type === 'list' && Math.abs(safe.dy) > 2
          ? { reserveSpace: d.item.reserveSpace ?? d.item.y + d.rect.height / scale + 12 } : {}) });
    }
  });
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    const scale = containerRef.current?.offsetWidth ? drag.current.bounds.width / containerRef.current.offsetWidth : 1;
    if (!drag.current.moved && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < LAYOUT_DRAG_THRESHOLD_PX * scale) return;
    drag.current.moved = true;
    event.preventDefault(); event.stopPropagation(); raf.schedule({ x: event.clientX, y: event.clientY });
  };
  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    if (!drag.current.moved) { drag.current.guide?.remove(); drag.current = null; return; }
    raf.flush();
    const initial = drag.current.item;
    drag.current.guide?.remove();
    drag.current = null;
    if (initial.x !== current.current.x || initial.y !== current.current.y || initial.width !== current.current.width || initial.height !== current.current.height) onSave(current.current);
  };
  const handlers = { onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    menu.openWithKeyboard(event);
    if (event.defaultPrevented || readOnly || event.target !== event.currentTarget) return;
    const paper = containerRef.current, host = itemRef.current;
    const bounds = paper?.getBoundingClientRect(), rect = host?.getBoundingClientRect();
    const scale = paper && bounds && paper.offsetWidth ? bounds.width / paper.offsetWidth : 1;
    const base = bounds && rect ? { ...current.current, x: (rect.left - bounds.left) / bounds.width * 100,
      width: rect.width / bounds.width * 100 } : current.current;
    let next = nudgeFooterComponentLayout(
      base,
      event.key,
      event.shiftKey ? 10 : 1,
      containerRef.current?.clientWidth || 0,
    );
    if (!next) return;
    if (bounds && rect && event.key !== 'Home') {
      const safe = clampRectMove(rect, bounds, (next.x - base.x) / 100 * bounds.width,
        -(next.y - base.y) * scale);
      next = { ...next, x: base.x + safe.dx / bounds.width * 100,
        y: next.type === 'nightLegend' ? 0 : base.y - safe.dy / scale };
    }
    event.preventDefault();
    event.stopPropagation();
    current.current = next;
    setDraft(next);
    onSave(next);
  };
  const width = limit(draft.width, item.type === 'image' || item.type === 'nightLegend' ? 4 : 12, 100);
  const x = limit(draft.x, 0, Math.max(0, 100 - width));
  const y = draft.type === 'nightLegend' ? 0 : Math.min(maxBottom, Math.max(0, Number.isFinite(draft.y) ? draft.y : 0));
  const actualWidth = item.type === 'nightLegend' && Number.isFinite(paperWidth) && paperWidth > 0
    ? Math.min(100, Math.max(width, 95 / paperWidth * 100)) : width;
  const actualLeft = item.type === 'nightLegend' ? limit(x + width / 2 - actualWidth / 2, 0, 100 - actualWidth) : x;
  return <Box ref={itemRef} data-footer-item={item.id} data-footer-kind={item.type} data-footer-reserve={draft.autoReserve !== false ? 'true' : 'false'}
    data-footer-reserve-space={draft.reserveSpace} data-layout-snap tabIndex={readOnly ? undefined : 0} role={readOnly ? undefined : 'group'}
    aria-label={item.type === 'nightLegend' ? s.legend : item.title || s.image}
    onPointerDown={(event: React.PointerEvent<HTMLElement>) => start(event, 'move')} {...handlers}
    onContextMenu={readOnly ? undefined : menu.openAtPoint}
    onKeyDown={readOnly ? undefined : onKeyDown}
    onDoubleClick={() => !readOnly && onEdit(current.current)}
    sx={{ position: 'absolute', left: `${actualLeft}%`, bottom: `${y}px`, width: `${actualWidth}%`, maxWidth: '100%',
      zIndex: 'auto', cursor: readOnly ? 'default' : 'move', touchAction: readOnly ? undefined : 'none',
      userSelect: 'none',
      '&:hover .layout-frame, &:focus-within .layout-frame': { opacity: 1, visibility: 'visible' },
      '@media print': { outline: 'none !important' } }}>
    {item.type === 'nightLegend' ? <Box sx={{ position: 'relative', zIndex: 4, width: '100%', aspectRatio: `${NIGHT_LEGEND_ASPECT_RATIO}`, containerType: 'inline-size', overflow: 'hidden' }}>
      <Box component="img" src="/imgs/images/sources/night-legend-cloud-v1.webp" alt="" draggable={false}
        sx={{ position: 'absolute', top: `${-63 / 596 * 100}%`, left: `${-341 / 1490 * 100}%`, display: 'block',
          width: `${2172 / 1490 * 100}%`, maxWidth: 'none', height: 'auto', pointerEvents: 'none' }} />
      <Typography component="div" sx={{ position: 'absolute', left: '6%', width: '88%', top: '67%',
        transform: 'translateY(-50%)', textAlign: 'center', color: '#fffaf0',
        fontFamily: uiConfigStore.characterNameFont, fontWeight: 700,
        fontSize: `${4 / NIGHT_LEGEND_CLOUD_FRACTION}cqw`, lineHeight: 1.1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', textWrap: 'balance', letterSpacing: 0,
        textShadow: '0 1px 1px rgba(31, 26, 23, .95), 1px 0 rgba(31, 26, 23, .7), -1px 0 rgba(31, 26, 23, .7)' }}>
        {draft.text || s.legendDefault}
      </Typography>
    </Box> : item.type === 'image' ? <Box component="img" src={draft.url} alt={draft.title || ''} draggable={false}
      sx={{ position: 'relative', zIndex: 3, width: '100%', height: 'auto', display: 'block', opacity: draft.opacity ?? 1, pointerEvents: 'none' }} /> :
      <Box sx={{ position: 'relative', zIndex: 4, p: { xs: 1, md: 1.5 }, minHeight: draft.height || undefined, boxSizing: 'border-box', background: 'rgba(213, 204, 190, .95)', border: '1px solid #9d8e7d', borderRadius: '8px', color: '#302a25' }}>
        {draft.title && <Typography sx={{ fontWeight: 700, textAlign: 'center', fontSize: '1rem', lineHeight: 1.2 }}>{draft.title}</Typography>}
        {draft.text && <Typography sx={{ fontSize: '.78rem', lineHeight: 1.3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', mb: .5 }}>{draft.text}</Typography>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: draft.columns === 2 ? 'repeat(2, minmax(0, 1fr))' : '1fr' }, gap: .5 }}>
          {(draft.rows || []).map(row => <Box key={row.id} sx={{ display: 'flex', alignItems: 'flex-start', gap: .5, minWidth: 0 }}>
            {row.icon ? <Box component="img" src={row.icon} alt="" sx={{ width: 24, height: 24, objectFit: 'contain', flexShrink: 0 }} /> : <Box component="span">○</Box>}
            <Typography sx={{ fontSize: '.78rem', lineHeight: 1.3, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{row.text}</Typography>
          </Box>)}
        </Box>
      </Box>}
    {!readOnly && <FooterLayoutFrame
      labels={{ move: s.move, resize: s.resize, more: t('ui.moreActions') }}
      editLabel={t('ui.edit')}
      onEdit={() => onEdit(current.current)}
      onStart={start}
      onMove={move}
      onFinish={finish}
      onOpenMenu={menu.openAtElement}
      onContextMenu={menu.openAtPoint}
    />}
    {menu.element}
  </Box>;
}
