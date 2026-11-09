import type { MouseEvent, PointerEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { EditOutlined, MoreVert } from '@mui/icons-material';

export type LayoutEdge =
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export const LAYOUT_EDGES: LayoutEdge[] = [
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
];

export interface LayoutFrameLabels {
  move: string;
  resize: string;
  more: string;
}

export interface LayoutFramePointerHandlers {
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onPointerMove: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel: (event: PointerEvent<HTMLElement>) => void;
  onLostPointerCapture: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLElement>) => void;
}

interface LayoutFrameProps {
  labels: LayoutFrameLabels;
  edgeHandlers?: (edge: LayoutEdge) => LayoutFramePointerHandlers;
  edges?: ReactNode;
  editLabel?: string;
  onEdit?: () => void;
  onOpenMenu?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
  scopeClass?: string;
  actionsInside?: boolean;
}

export const layoutControlSx = {
  width: 26,
  height: 26,
  display: 'grid',
  placeItems: 'center',
  padding: 0,
  border: '1px solid #a58d68',
  borderRadius: '5px',
  color: '#465f4c',
  background: 'rgba(251, 246, 231, 0.97)',
  boxShadow: '0 1px 4px rgba(58, 47, 28, 0.16)',
  pointerEvents: 'auto',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  position: 'relative',
  '@media (hover: none) and (pointer: coarse)': {
    '&::before': { content: '""', position: 'absolute', inset: -8 },
  },
  '&:active': { transform: 'scale(0.96)' },
  '&:focus-visible': { outline: '2px solid #3e6450', outlineOffset: 2 },
} as const;

export function layoutEdgeCursor(edge: LayoutEdge) {
  const top = edge.includes('top');
  const bottom = edge.includes('bottom');
  const left = edge.includes('left');
  const right = edge.includes('right');
  const corner = (top || bottom) && (left || right);
  return corner
    ? (top && left) || (bottom && right) ? 'nwse-resize' : 'nesw-resize'
    : top || bottom ? 'ns-resize' : 'ew-resize';
}

interface LayoutEdgeButtonProps {
  edge: LayoutEdge;
  label: string;
  handlers: LayoutFramePointerHandlers;
}

export function LayoutEdgeButton({ edge, label, handlers }: LayoutEdgeButtonProps) {
  const top = edge.includes('top');
  const bottom = edge.includes('bottom');
  const left = edge.includes('left');
  const right = edge.includes('right');
  const corner = (top || bottom) && (left || right);
  return (
    <Box
      component="button"
      type="button"
      data-layout-edge={edge}
      title={label}
      aria-label={edge === 'top-right' ? label : undefined}
      aria-hidden={edge !== 'top-right' ? true : undefined}
      tabIndex={edge === 'top-right' ? 0 : -1}
      {...handlers}
      sx={{
        position: 'absolute',
        border: 0,
        p: 0,
        background: 'transparent',
        pointerEvents: 'auto',
        touchAction: 'none',
        zIndex: 2,
        cursor: layoutEdgeCursor(edge),
        ...(corner
          ? { width: 26, height: 26 }
          : top || bottom
            ? { left: 18, right: 18, height: 16 }
            : { top: 18, bottom: 18, width: 16 }),
        ...(top ? { top: -8 } : {}),
        ...(bottom ? { bottom: -8 } : {}),
        ...(left ? { left: -8 } : {}),
        ...(right ? { right: -8 } : {}),
        ...(corner
          ? {
              '&::after': {
                content: '""',
                display: 'block',
                position: 'absolute',
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#53735a',
                left: left ? 5 : 'auto',
                right: right ? 5 : 'auto',
                top: top ? 5 : 'auto',
                bottom: bottom ? 5 : 'auto',
              },
            }
          : {}),
        '@media (hover: none) and (pointer: coarse)': corner ? { width: 36, height: 36 } : {},
        '&:focus-visible': { outline: '2px solid #3e6450', outlineOffset: 1 },
      }}
    />
  );
}

export default function LayoutFrame({
  labels,
  edgeHandlers,
  edges,
  editLabel,
  onEdit,
  onOpenMenu,
  onContextMenu,
  scopeClass,
  actionsInside = false,
}: LayoutFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const hasEdit = Boolean(onEdit);
  const [placement, setPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  useEffect(() => {
    const owner = frameRef.current?.parentElement;
    if (!owner) return;
    const measure = () => {
      if (actionsInside) return;
      const rect = owner.getBoundingClientRect();
      const root = owner.closest<HTMLElement>('#script-preview, #script-preview-2');
      const paper = owner.closest<HTMLElement>('#main_script, #footer-paper-2')
        || root?.querySelector<HTMLElement>('#main_script, #footer-paper-2');
      const paperRect = paper?.getBoundingClientRect();
      const scale = paper?.offsetWidth && paperRect ? paperRect.width / paper.offsetWidth : 1;
      const gap = 8 * scale;
      const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
      const width = (hasEdit ? 26 + (coarse ? 16 : 4) + 24 : 24) * scale;
      const height = 26 * scale;
      const candidates = [
        { side: 'top' as const, left: rect.right - width, top: rect.top - gap - height },
        { side: 'bottom' as const, left: rect.right - width, top: rect.bottom + gap },
        { side: 'left' as const, left: rect.left - gap - width, top: (rect.top + rect.bottom - height) / 2 },
        { side: 'right' as const, left: rect.right + gap, top: (rect.top + rect.bottom - height) / 2 },
      ];
      const obstacles = [...(root || paper || owner).querySelectorAll<HTMLElement>('[data-script-add-page="header"], [data-header-layout-item]')]
        .filter(other => other !== owner && !other.contains(owner) && !owner.contains(other))
        .map(other => ({ rect: other.getBoundingClientRect(), weight: other.matches('[data-script-add-page="header"]') ? 100 : 1 }));
      const limit = {
        left: Math.max(0, paperRect?.left ?? 0), right: Math.min(window.innerWidth, paperRect?.right ?? window.innerWidth),
        top: Math.max(0, paperRect?.top ?? 0), bottom: Math.min(window.innerHeight, paperRect?.bottom ?? window.innerHeight),
      };
      const penalty = (candidate: typeof candidates[number]) => {
        const right = candidate.left + width, bottom = candidate.top + height;
        const outside = Math.max(0, limit.left - candidate.left) + Math.max(0, right - limit.right)
          + Math.max(0, limit.top - candidate.top) + Math.max(0, bottom - limit.bottom);
        const overlap = obstacles.reduce((sum, other) => sum
          + Math.max(0, Math.min(right, other.rect.right) - Math.max(candidate.left, other.rect.left))
          * Math.max(0, Math.min(bottom, other.rect.bottom) - Math.max(candidate.top, other.rect.top)) * other.weight, 0);
        return outside * 1000 + overlap;
      };
      const best = candidates.reduce((a, b) => penalty(b) < penalty(a) ? b : a);
      setPlacement(best.side);
    };
    let frame: number | null = null;
    const measureAfterDrag = () => {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = null; if (owner.isConnected) measure(); });
    };
    owner.addEventListener('pointerenter', measure);
    owner.addEventListener('focusin', measure);
    owner.addEventListener('pointerup', measureAfterDrag);
    window.addEventListener('resize', measure);
    return () => {
      owner.removeEventListener('pointerenter', measure);
      owner.removeEventListener('focusin', measure);
      owner.removeEventListener('pointerup', measureAfterDrag);
      window.removeEventListener('resize', measure);
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [actionsInside, hasEdit]);
  return (
    <Box
      ref={frameRef}
      className={`layout-frame${scopeClass ? ` ${scopeClass}` : ''}`}
      data-layout-frame
      onContextMenu={onContextMenu}
      sx={{
        position: 'absolute',
        inset: -3,
        border: '1px dashed #607963',
        borderRadius: 1,
        opacity: 0,
        visibility: 'hidden',
        pointerEvents: 'none',
        zIndex: 20,
        '@media print': { display: 'none' },
      }}
    >
      {edges ?? (edgeHandlers ? LAYOUT_EDGES.map((edge) => (
        <LayoutEdgeButton key={edge} edge={edge} label={labels.resize} handlers={edgeHandlers(edge)} />
      )) : null)}
      <Box
        className="layout-actions"
        onDoubleClick={(event) => event.stopPropagation()}
        sx={{
          position: 'absolute',
          ...(actionsInside ? { right: 6, top: 6 }
            : placement === 'top' ? { right: 0, bottom: 'calc(100% + 5px)' }
            : placement === 'bottom' ? { right: 0, top: 'calc(100% + 5px)' }
            : placement === 'left' ? { right: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)' }
            : { left: 'calc(100% + 5px)', top: '50%', transform: 'translateY(-50%)' }),
          display: 'flex',
          gap: '4px',
          '@media (hover: none) and (pointer: coarse)': { gap: '16px' },
          zIndex: 3,
          pointerEvents: 'none',
        }}
      >
        {onEdit && (
          <Box
            component="button"
            type="button"
            data-layout-control
            aria-label={editLabel}
            title={editLabel}
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => { event.stopPropagation(); onEdit(); }}
            sx={{ ...layoutControlSx, cursor: 'pointer' }}
          >
            <EditOutlined sx={{ fontSize: 16 }} />
          </Box>
        )}
        {onOpenMenu && (
          <Box
            component="button"
            type="button"
            data-layout-control
            aria-label={labels.more}
            title={labels.more}
            aria-haspopup="menu"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation();
              onOpenMenu(event);
            }}
            sx={{ ...layoutControlSx, width: 24, height: 24, cursor: 'pointer', alignSelf: 'center' }}
          >
            <MoreVert sx={{ fontSize: 17 }} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
