import { Box } from '@mui/material';
import { useEffect, useMemo, useRef, useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { FooterComponent, RichTextDocument, SpecialRule } from '../types';
import { useTranslation } from '../utils/i18n';
import { clampRectMove, LAYOUT_DRAG_THRESHOLD_PX } from '../utils/headerAlignment';
import FooterLayoutFrame from './FooterLayoutFrame';
import type { FooterEdge } from './FooterLayoutFrame';
import { footerText } from '../utils/footerText';
import { useRafPointer } from './useRafPointer';
import { createFooterDragGuides } from './footerDragGuides';
import { useLayoutContextMenu } from './LayoutContextMenu';
import ExplanationRichText from './ExplanationRichText';
import { resolveExplanationDocument } from '../utils/explanationRichText';
import { DEFAULT_EXPLANATION_WIDTH } from '../utils/defaultFooterComponents';

interface InlineStateRulesSectionProps {
  rules: SpecialRule[];
  legacyLists?: FooterComponent[];
  document?: RichTextDocument | null;
  onEdit?: (value: RichTextDocument, layout: FooterComponent) => void;
  layout?: FooterComponent;
  page?: 1 | 2;
  containerRef?: React.RefObject<HTMLElement | null>;
  onLayoutSave?: (layout: FooterComponent) => void;
}

const InlineStateRulesSection = observer(({ rules, legacyLists = [], document: suppliedDocument, onEdit, layout, page = 1, containerRef, onLayoutSave }: InlineStateRulesSectionProps) => {
  const { t, language } = useTranslation();
  const s = footerText(language);
  const fallback = useMemo<FooterComponent>(() => ({ id: `state-layout-${page}`, type: 'stateLayout', page, x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH }), [page]);
  const [draft, setDraft] = useState(layout || fallback);
  const current = useRef(layout || fallback);
  const content = suppliedDocument === undefined ? resolveExplanationDocument(layout, rules, legacyLists, language) : suppliedDocument;
  const hasContent = Boolean(content);
  const sectionRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: number; x: number; y: number; value: FooterComponent; rect: DOMRect; bounds: DOMRect; paper: DOMRect; scale: number; edge: FooterEdge | 'move'; moved: boolean; guide: ReturnType<typeof createFooterDragGuides> | null } | null>(null);
  useEffect(() => () => { drag.current?.guide?.remove(); }, []);
  useEffect(() => { const next = layout || fallback; current.current = next; setDraft(next); }, [layout, fallback]);
  useEffect(() => {
    const section = sectionRef.current, paper = containerRef?.current;
    if (!section || !paper) return;
    const contain = () => {
      if (drag.current) return;
      const bounds = paper.getBoundingClientRect();
      const scale = paper.offsetWidth ? bounds.width / paper.offsetWidth : 1;
      const safe = clampRectMove(section.getBoundingClientRect(), bounds, 0, 0);
      const dx = Math.round(safe.dx / scale), dy = Math.round(safe.dy / scale);
      if (dx || dy) { const next = { ...current.current, x: current.current.x + dx, y: current.current.y + dy }; current.current = next; setDraft(next); }
    };
    contain();
    const observer = new ResizeObserver(contain); observer.observe(section); observer.observe(paper);
    return () => observer.disconnect();
  }, [containerRef, draft.x, draft.y, draft.width, draft.height, page, rules.length, legacyLists.length, hasContent]);
  const start = (event: React.PointerEvent<HTMLElement>, edge: FooterEdge | 'move') => {
    if (!onLayoutSave || (event.pointerType === 'mouse' && event.button !== 0) || (event.target as HTMLElement).closest('[data-layout-control]')) return;
    const host = event.currentTarget.closest<HTMLElement>('.inline-state-rules');
    const paper = containerRef?.current;
    if (!host || !paper) return;
    event.preventDefault(); event.stopPropagation(); host.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId);
    const bounds = paper.getBoundingClientRect(), rect = host.getBoundingClientRect();
    const value = edge === 'move' ? current.current : { ...current.current, width: rect.width / bounds.width * 100, defaultWidthAdaptive: false };
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, value, rect,
      bounds, paper: bounds, scale: paper.offsetWidth ? bounds.width / paper.offsetWidth : 1, edge, moved: false,
      guide: edge === 'move' ? createFooterDragGuides(paper, host) : null };
  };
  const raf = useRafPointer((point: { x: number; y: number }) => {
    const d = drag.current; if (!d) return;
    const dx = point.x - d.x, dy = point.y - d.y;
    let next: FooterComponent;
    if (d.edge !== 'move') {
      const left = d.edge.includes('left'), right = d.edge.includes('right'), top = d.edge.includes('top'), bottom = d.edge.includes('bottom');
      const horizontal = left ? -dx : right ? dx : 0;
      const extra = Math.max(0, left ? d.rect.left - d.bounds.left : right ? d.bounds.right - d.rect.right : 0);
      const width = Math.max(30, Math.min(100, d.value.width + Math.min(horizontal, extra) / d.paper.width * 100));
      const change = (width - d.value.width) / 100 * d.paper.width;
      const vertical = top ? -dy : bottom ? dy : 0;
      const maxHeight = (top ? d.rect.bottom - d.bounds.top : d.bounds.bottom - d.rect.top) / d.scale;
      next = { ...d.value, width, x: left ? d.value.x - change / 2 / d.scale : right ? d.value.x + change / 2 / d.scale : d.value.x,
        height: top || bottom ? Math.max(36, Math.min(maxHeight, (d.value.height || d.rect.height / d.scale) + vertical / d.scale)) : d.value.height,
        y: top ? d.value.y + dy / d.scale : d.value.y };
    } else {
      const safe = d.guide?.move(d.rect, d.bounds, dx, dy) || clampRectMove(d.rect, d.bounds, dx, dy);
      next = { ...d.value, x: d.value.x + safe.dx / d.scale, y: d.value.y + safe.dy / d.scale };
    }
    current.current = next; setDraft(next);
  });
  const move = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.id !== event.pointerId) return;
    if (!drag.current.moved && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < LAYOUT_DRAG_THRESHOLD_PX * drag.current.scale) return;
    drag.current.moved = true;
    event.preventDefault(); event.stopPropagation(); raf.schedule({ x: event.clientX, y: event.clientY });
  };
  const finish = (event: React.PointerEvent<HTMLElement>) => {
    if (drag.current?.id !== event.pointerId) return;
    if (!drag.current.moved) { drag.current.guide?.remove(); drag.current = null; return; }
    raf.flush();
    const old = drag.current.value; drag.current.guide?.remove(); drag.current = null;
    if (old.x !== current.current.x || old.y !== current.current.y || old.width !== current.current.width || old.height !== current.current.height) onLayoutSave?.(current.current);
  };
  const handlers = { onPointerMove: move, onPointerUp: finish, onPointerCancel: finish, onLostPointerCapture: finish };
  const menu = useLayoutContextMenu(
    { edit: t('ui.edit'), reset: t('ui.resetLayout'), remove: t('ui.delete') },
    {
      edit: onEdit && content ? () => onEdit(content, current.current) : undefined,
      reset: onLayoutSave ? () => onLayoutSave({ ...current.current, x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH, height: undefined, defaultWidthAdaptive: true }) : undefined,
      remove: onLayoutSave ? () => onLayoutSave({ ...current.current, hidden: true }) : undefined,
    },
  );
  const onKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    menu.openWithKeyboard(event);
    if (event.defaultPrevented || !onLayoutSave || event.target !== event.currentTarget) return;
    if (event.key === 'Home') {
      event.preventDefault();
      onLayoutSave({ ...current.current, x: 0, y: 0, width: DEFAULT_EXPLANATION_WIDTH, height: undefined, defaultWidthAdaptive: true });
      return;
    }
    const step = event.shiftKey ? 10 : 1;
    let next: FooterComponent | null = null;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      next = { ...current.current, x: current.current.x + (event.key === 'ArrowRight' ? step : -step) };
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      next = { ...current.current, y: current.current.y + (event.key === 'ArrowDown' ? step : -step) };
    }
    if (!next) return;
    event.preventDefault();
    event.stopPropagation();
    const paper = containerRef?.current, section = sectionRef.current;
    if (paper && section) {
      const bounds = paper.getBoundingClientRect();
      const scale = paper.offsetWidth ? bounds.width / paper.offsetWidth : 1;
      const safe = clampRectMove(section.getBoundingClientRect(), bounds,
        (next.x - current.current.x) * scale, (next.y - current.current.y) * scale);
      next = { ...next, x: current.current.x + safe.dx / scale, y: current.current.y + safe.dy / scale };
    }
    current.current = next;
    setDraft(next);
    onLayoutSave(next);
  };
  if (!content) return null;
  return (
    <Box ref={sectionRef} className="inline-state-rules" data-footer-item={`state-layout-${page}`} data-layout-snap tabIndex={onLayoutSave ? 0 : undefined}
      onPointerDown={(event: React.PointerEvent<HTMLElement>) => start(event, 'move')} {...handlers}
      onDoubleClick={() => onEdit?.(content, current.current)}
      onContextMenu={menu.openAtPoint} onKeyDown={onKeyDown} sx={{
      position: 'relative', zIndex: 4,
      width: draft.width === DEFAULT_EXPLANATION_WIDTH && draft.defaultWidthAdaptive !== false
        ? { xs: '90%', sm: `${DEFAULT_EXPLANATION_WIDTH}%` } : `min(${Math.max(30, Math.min(100, draft.width))}%, 100%)`, maxWidth: '100%',
      transform: `translate(${draft.x}px, ${draft.y}px)`, touchAction: onLayoutSave ? 'none' : undefined, cursor: onLayoutSave ? 'move' : undefined,
      minHeight: draft.height || undefined,
      '&:hover, &:focus-within': onLayoutSave ? { zIndex: 25 } : {},
      '&:hover .layout-frame, &:focus-within .layout-frame': { opacity: 1, visibility: 'visible' },
      mx: 'auto',
      mt: 2,
      mb: 1,
      px: { xs: 1.5, md: 2 },
      py: 1,
      border: '1px solid rgba(137, 105, 91, 0.7)',
      borderRadius: '10px',
      backgroundColor: 'rgba(244, 236, 222, 0.84)',
      boxShadow: 'inset 0 0 0 3px rgba(244, 236, 222, .9), inset 0 0 0 4px rgba(145, 113, 97, .32)',
      '&::before': { content: '"❧ ✦ ❧"', position: 'absolute', left: '50%', top: '-13px', transform: 'translateX(-50%)',
        px: .8, fontSize: '14px', lineHeight: 1, color: '#a68d7e', backgroundColor: '#f3eddf', pointerEvents: 'none' },
      breakInside: 'avoid',
      '@media print': { outline: 'none !important' },
    }}>
      {onLayoutSave && <FooterLayoutFrame
        labels={{ move: s.move, resize: s.resize, more: t('ui.moreActions') }}
        editLabel={t('ui.edit')}
        onEdit={onEdit ? () => onEdit(content, current.current) : undefined}
        actionsInside
        onStart={start}
        onMove={move}
        onFinish={finish}
        onOpenMenu={menu.openAtElement}
        onContextMenu={menu.openAtPoint}
      />}
      <ExplanationRichText document={content} reserveActions={Boolean(onLayoutSave)} />
      {menu.element}
    </Box>
  );
});

export default InlineStateRulesSection;
