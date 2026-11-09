import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { AVAILABLE_TOWERS, type TowerImage } from '../stores/UIConfigStore';
import FooterLayoutFrame from './FooterLayoutFrame';
import type { FooterEdge } from './FooterLayoutFrame';
import { clampRectMove, LAYOUT_DRAG_THRESHOLD_PX } from '../utils/headerAlignment';
import { useTranslation } from '../utils/i18n';
import { footerText } from '../utils/footerText';
import { useRafPointer } from './useRafPointer';
import { useContainedBottom } from './useContainedBottom';
import { createFooterDragGuides } from './footerDragGuides';
import { useLayoutContextMenu } from './LayoutContextMenu';

interface Props {
  image: TowerImage;
  onUpdate: (id: string, partial: Partial<TowerImage>) => void;
  onDelete: (id: string) => void;
  onDoubleClick?: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
  readOnly?: boolean;
}

// The preview can be remounted after a script edit. Keep known sizes so an
// unloaded image never briefly expands to the width of the entire paper.
const imageSizes = new Map<string, { width: number; height: number }>([
  ['/imgs/images/background/back_tower.png', { width: 380, height: 657 }],
  ['/imgs/images/background/back_tower2.png', { width: 1086, height: 167.5 }],
  ['/imgs/images/background/back_town.png', { width: 666, height: 181 }],
]);

export default function TowerImageOverlay({ image, onUpdate, onDelete, onDoubleClick, containerRef, readOnly = false }: Props) {
  const { t, language } = useTranslation();
  const s = footerText(language);
  const isGrayOrnament = image.url === '/imgs/images/background/back_tower2.png';
  const [draft, setDraft] = useState(image);
  const [loaded, setLoaded] = useState(() => ({ url: image.url, size: imageSizes.get(image.url) }));
  const natural = loaded.url === image.url ? loaded.size : imageSizes.get(image.url);
  const latest = useRef(image);
  const itemRef = useRef<HTMLDivElement>(null);
  const { maxBottom, paperHeight } = useContainedBottom(containerRef, itemRef);
  const drag = useRef<{ id: number; x: number; y: number; value: TowerImage; rect: DOMRect; bounds: DOMRect; edge: FooterEdge | 'move'; moved: boolean; guide: ReturnType<typeof createFooterDragGuides> | null } | null>(null);
  useEffect(() => { latest.current = image; setDraft(image); }, [image]);
  useEffect(() => () => { drag.current?.guide?.remove(); }, []);
  const update = (value: TowerImage) => { latest.current = value; setDraft(value); };
  const menu = useLayoutContextMenu(
    { edit: t('ui.edit'), reset: t('ui.resetLayout'), remove: t('ui.delete') },
    {
      edit: onDoubleClick,
      reset: () => { const defaults = AVAILABLE_TOWERS.find(item => item.id === image.id); onUpdate(image.id, { x: defaults?.x ?? 0, y: defaults?.y ?? 0, scale: defaults?.scale ?? 1 }); },
      remove: () => onDelete(image.id),
    },
  );
  const start = (event: React.PointerEvent<HTMLElement>, edge: FooterEdge | 'move') => {
    if (readOnly || (event.pointerType === 'mouse' && event.button !== 0) || (event.target as HTMLElement).closest('[data-layout-control]')) return;
    const host = event.currentTarget.closest<HTMLElement>('[data-tower-item]');
    if (!host || !containerRef.current) return;
    event.preventDefault(); event.stopPropagation(); host.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    const visibleBottom = Number.parseFloat(getComputedStyle(host).bottom) || 0;
    const rect = host.getBoundingClientRect(), bounds = containerRef.current.getBoundingClientRect();
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY,
      value: { ...latest.current, x: (rect.left - bounds.left) / bounds.width * 100,
        y: latest.current.isDefault ? 0 : visibleBottom / Math.max(1, containerRef.current.clientHeight) * 100 },
      rect, bounds, edge, moved: false,
      guide: edge === 'move' && image.id !== 'back_tower' ? createFooterDragGuides(containerRef.current, host) : null };
  };
  const raf = useRafPointer((point: { x: number; y: number }) => {
    const d = drag.current; if (!d) return;
    const dx = point.x - d.x, dy = point.y - d.y;
    if (d.edge !== 'move') {
      const left = d.edge.includes('left'), right = d.edge.includes('right');
      const top = d.edge.includes('top'), bottom = d.edge.includes('bottom');
      const parts = [left ? -dx / d.rect.width : right ? dx / d.rect.width : null,
        top ? -dy / d.rect.height : bottom ? dy / d.rect.height : null].filter((v): v is number => v !== null);
      const change = parts.reduce((sum, value) => sum + value, 0) / Math.max(parts.length, 1);
      const availableWidth = left && d.value.id !== 'back_tower' ? d.rect.right - d.bounds.left : d.bounds.right - d.rect.left;
      const max = Math.min(2, d.value.scale * availableWidth / Math.max(1, d.rect.width),
        d.value.scale * (d.rect.bottom - d.bounds.top) / Math.max(1, d.rect.height));
      const scale = Math.max(.2, Math.min(Math.max(.2, max), d.value.scale * (1 + change)));
      const widthChange = d.rect.width * (scale / d.value.scale - 1);
      update({ ...d.value, scale, x: left && d.value.id !== 'back_tower' ? Math.max(0, d.value.x - widthChange / d.bounds.width * 100) : d.value.x });
    } else {
      const moveX = d.value.id === 'back_tower' ? 0 : dx;
      const safe = d.guide?.move(d.rect, d.bounds, moveX, dy, d.value.isDefault)
        || clampRectMove(d.rect, d.bounds, moveX, d.value.isDefault ? 0 : dy);
      if (d.value.id === 'back_tower') safe.dx = 0;
      update({ ...d.value, x: d.value.id === 'back_tower' ? 0 : Math.max(0, d.value.x + safe.dx / d.bounds.width * 100),
        y: d.value.isDefault ? 0 : Math.max(0, d.value.y - safe.dy / d.bounds.height * 100) });
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
    const previous = drag.current.value; drag.current.guide?.remove(); drag.current = null;
    if (previous.x !== latest.current.x || previous.y !== latest.current.y || previous.scale !== latest.current.scale) onUpdate(image.id, latest.current);
  };
  const handlers = { onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish };
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    menu.openWithKeyboard(event);
    if (event.defaultPrevented || readOnly || event.target !== event.currentTarget) return;
    if (event.key === 'Home') {
      event.preventDefault();
      const defaults = AVAILABLE_TOWERS.find(item => item.id === image.id);
      onUpdate(image.id, { x: defaults?.x ?? 0, y: defaults?.y ?? 0, scale: defaults?.scale ?? 1 });
      return;
    }
    const paper = containerRef.current, host = itemRef.current;
    if (!paper || !host || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const bounds = paper.getBoundingClientRect(), rect = host.getBoundingClientRect();
    const scale = paper.offsetWidth ? bounds.width / paper.offsetWidth : 1;
    const step = (event.shiftKey ? 10 : 1) * scale;
    const dx = image.id === 'back_tower' ? 0 : event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0;
    const dy = image.isDefault ? 0 : event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0;
    const safe = clampRectMove(rect, bounds, dx, dy);
    onUpdate(image.id, {
      x: image.id === 'back_tower' ? 0 : Math.max(0, (rect.left - bounds.left + safe.dx) / bounds.width * 100),
      y: image.isDefault ? 0 : Math.max(0, (bounds.bottom - rect.bottom - safe.dy) / bounds.height * 100),
    });
  };
  const heightWidthLimit = Number.isFinite(paperHeight) && natural?.height ? paperHeight * natural.width / natural.height : Number.POSITIVE_INFINITY;
  const widthPx = Math.min((natural?.width || 0) * draft.scale, heightWidthLimit);
  const widthAt = (vh: number) => natural?.width && natural.height
    ? `min(100%, ${Math.max(1, widthPx)}px, ${vh * natural.width / natural.height * draft.scale}vh)` : '0px';
  const leftAt = (width: string) => image.id === 'back_tower' ? 0 : `min(${Math.max(0, draft.x)}%, max(0px, calc(100% - ${width})))`;
  const maxBottomPercent = Number.isFinite(maxBottom) && paperHeight ? maxBottom / paperHeight * 100 : 100;
  return <Box ref={itemRef} data-tower-item={image.id} data-layout-snap tabIndex={readOnly ? undefined : 0} role={readOnly ? undefined : 'group'}
    aria-label={image.id === 'back_tower' ? s.tower1 : image.id === 'back_tower2' ? s.tower2 : image.id === 'back_town' ? s.town : s.image}
    onPointerDown={(event: React.PointerEvent<HTMLElement>) => start(event, 'move')} {...handlers} onDoubleClick={() => !readOnly && onDoubleClick?.()}
    onContextMenu={readOnly ? undefined : menu.openAtPoint}
    onKeyDown={readOnly ? undefined : onKeyDown}
    sx={{ position: 'absolute', width: { xs: widthAt(35), sm: widthAt(50), md: widthAt(60) },
      left: { xs: leftAt(widthAt(35)), sm: leftAt(widthAt(50)), md: leftAt(widthAt(60)) },
      bottom: draft.isDefault ? 0 : `${Math.min(maxBottomPercent, Math.max(0, draft.y))}%`, zIndex: 'auto', cursor: readOnly ? 'default' : 'move',
      touchAction: readOnly ? undefined : 'none', userSelect: 'none',
      '&:hover .layout-frame, &:focus-within .layout-frame': { opacity: 1, visibility: 'visible' }, '@media print': { outline: 'none !important' } }}>
    <Box sx={{ position: 'relative', zIndex: 1, overflow: isGrayOrnament ? 'hidden' : undefined,
      aspectRatio: isGrayOrnament ? '2172 / 335' : undefined }}>
      <Box component="img" src={image.url} alt="" draggable={false} onLoad={(event: React.SyntheticEvent<HTMLImageElement>) => {
        const img = event.currentTarget;
        const size = isGrayOrnament ? { width: 1086, height: 167.5 } : { width: img.naturalWidth, height: img.naturalHeight };
        if (img.naturalWidth && img.naturalHeight) { imageSizes.set(image.url, size); setLoaded({ url: image.url, size }); }
      }} sx={{ display: 'block', position: isGrayOrnament ? 'absolute' : 'relative', top: 0, left: 0,
        width: '100%', height: 'auto', transform: isGrayOrnament ? 'translateY(-32.5%)' : undefined,
        opacity: draft.opacity, pointerEvents: 'none' }} />
    </Box>
    {!readOnly && <FooterLayoutFrame
      labels={{ move: s.move, resize: s.resize, more: t('ui.moreActions') }}
      editLabel={t('ui.edit')}
      onEdit={onDoubleClick}
      onStart={start}
      onMove={move}
      onFinish={finish}
      onOpenMenu={menu.openAtElement}
      onContextMenu={menu.openAtPoint}
    />}
    {menu.element}
  </Box>;
}
