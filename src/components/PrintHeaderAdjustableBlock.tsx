import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Box, Menu, MenuItem, Tooltip } from '@mui/material';
import {
  ArrowDownward as ArrowDownwardIcon,
  ArrowUpward as ArrowUpwardIcon,
  KeyboardDoubleArrowDown as KeyboardDoubleArrowDownIcon,
  KeyboardDoubleArrowUp as KeyboardDoubleArrowUpIcon,
  OpenWith as OpenWithIcon,
} from '@mui/icons-material';
import type { PrintHeaderBlockLayout } from '../stores/UIConfigStore';

interface PrintHeaderAdjustableBlockProps {
  id: string;
  layout: PrintHeaderBlockLayout;
  boundaryRef: RefObject<HTMLElement | null>;
  active?: boolean;
  editable?: boolean;
  label: string;
  children: ReactNode;
  onChange: (updates: Partial<PrintHeaderBlockLayout>) => void;
  verticalBleedPct?: number;
}

interface PrintHeaderGapHandleProps {
  topPx: number;
  value: number;
  label: string;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  testId: string;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const round1 = (value: number) => Math.round(value * 10) / 10;
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const MIN_WIDTH = 6;
const MIN_HEIGHT = 6;

const resizeHandles: Array<{ direction: ResizeDirection; sx: Record<string, unknown>; cursor: string }> = [
  { direction: 'n', sx: { top: -4, left: '50%', transform: 'translate(-50%, -50%)', width: 18, height: 8 }, cursor: 'ns-resize' },
  { direction: 's', sx: { bottom: -4, left: '50%', transform: 'translate(-50%, 50%)', width: 18, height: 8 }, cursor: 'ns-resize' },
  { direction: 'e', sx: { right: -4, top: '50%', transform: 'translate(50%, -50%)', width: 8, height: 18 }, cursor: 'ew-resize' },
  { direction: 'w', sx: { left: -4, top: '50%', transform: 'translate(-50%, -50%)', width: 8, height: 18 }, cursor: 'ew-resize' },
  { direction: 'ne', sx: { top: -6, right: -6 }, cursor: 'nesw-resize' },
  { direction: 'nw', sx: { top: -6, left: -6 }, cursor: 'nwse-resize' },
  { direction: 'se', sx: { bottom: -6, right: -6 }, cursor: 'nwse-resize' },
  { direction: 'sw', sx: { bottom: -6, left: -6 }, cursor: 'nesw-resize' },
];

export default function PrintHeaderAdjustableBlock({
  id,
  layout,
  boundaryRef,
  active = true,
  editable = false,
  label,
  children,
  onChange,
  verticalBleedPct = 0,
}: PrintHeaderAdjustableBlockProps) {
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [resizing, setResizing] = useState<ResizeDirection | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<{ mouseX: number; mouseY: number } | null>(null);
  const dragStartRef = useRef({ x: 0, y: 0, layout });
  const resizeStartRef = useRef({ x: 0, y: 0, layout });
  const rafRef = useRef<number | null>(null);

  const clampLayout = useCallback((next: PrintHeaderBlockLayout) => {
    const clampedWidth = clamp(next.width, MIN_WIDTH, Math.max(MIN_WIDTH, 100 / next.scale));
    const clampedHeight = clamp(next.height, MIN_HEIGHT, Math.max(MIN_HEIGHT, (100 + verticalBleedPct * 2) / next.scale));
    const nextEffectiveWidth = clampedWidth * next.scale;
    const nextEffectiveHeight = clampedHeight * next.scale;
    return {
      ...next,
      width: round1(clampedWidth),
      height: round1(clampedHeight),
      x: round1(clamp(next.x, 0, Math.max(0, 100 - nextEffectiveWidth))),
      y: round1(clamp(next.y, -verticalBleedPct, Math.max(-verticalBleedPct, 100 + verticalBleedPct - nextEffectiveHeight))),
    };
  }, [verticalBleedPct]);

  const handleDragStart = useCallback((event: React.PointerEvent) => {
    if (!editable || !active) return;
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
    dragStartRef.current = { x: event.clientX, y: event.clientY, layout };
  }, [active, editable, layout]);

  const handleDragMove = useCallback((event: PointerEvent) => {
    if (!dragging || !boundaryRef.current) return;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!boundaryRef.current) return;
      const rect = boundaryRef.current.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const start = dragStartRef.current;
      const deltaXPct = ((event.clientX - start.x) / rect.width) * 100;
      const deltaYPct = ((event.clientY - start.y) / rect.height) * 100;
      const next = clampLayout({
        ...start.layout,
        x: start.layout.x + deltaXPct,
        y: start.layout.y + deltaYPct,
      });
      onChange({ x: next.x, y: next.y });
    });
  }, [boundaryRef, clampLayout, dragging, onChange]);

  const handleDragEnd = useCallback(() => {
    setDragging(false);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const handleResizeStart = useCallback((direction: ResizeDirection) => (event: React.PointerEvent) => {
    if (!editable || !active) return;
    event.preventDefault();
    event.stopPropagation();
    setResizing(direction);
    resizeStartRef.current = { x: event.clientX, y: event.clientY, layout };
  }, [active, editable, layout]);

  const handleResizeMove = useCallback((event: PointerEvent) => {
    if (!resizing || !boundaryRef.current) return;
    const rect = boundaryRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const start = resizeStartRef.current;
    const deltaX = ((event.clientX - start.x) / rect.width) * 100 / start.layout.scale;
    const deltaY = ((event.clientY - start.y) / rect.height) * 100 / start.layout.scale;
    let next = { ...start.layout };

    if (resizing.includes('e')) {
      next.width = start.layout.width + deltaX;
    }
    if (resizing.includes('s')) {
      next.height = start.layout.height + deltaY;
    }
    if (resizing.includes('w')) {
      const width = start.layout.width - deltaX;
      const maxLeft = start.layout.x + start.layout.width - MIN_WIDTH;
      next.x = clamp(start.layout.x + deltaX, 0, maxLeft);
      next.width = width + (start.layout.x + deltaX - next.x);
    }
    if (resizing.includes('n')) {
      const height = start.layout.height - deltaY;
      const maxTop = start.layout.y + start.layout.height - MIN_HEIGHT;
      next.y = clamp(start.layout.y + deltaY, -verticalBleedPct, maxTop);
      next.height = height + (start.layout.y + deltaY - next.y);
    }

    next = clampLayout(next);
    onChange({ x: next.x, y: next.y, width: next.width, height: next.height });
  }, [boundaryRef, clampLayout, onChange, resizing, verticalBleedPct]);

  const handleResizeEnd = useCallback(() => {
    setResizing(null);
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent) => {
    if (!editable || !active) return;
    event.preventDefault();
    event.stopPropagation();
    setMenuAnchor({ mouseX: event.clientX + 2, mouseY: event.clientY - 6 });
  }, [active, editable]);

  const closeMenu = useCallback(() => setMenuAnchor(null), []);
  const updateLayer = useCallback((zIndex: number) => {
    onChange({ zIndex: clamp(Math.round(zIndex), 1, 99) });
    closeMenu();
  }, [closeMenu, onChange]);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('pointermove', handleDragMove);
    window.addEventListener('pointerup', handleDragEnd);
    return () => {
      window.removeEventListener('pointermove', handleDragMove);
      window.removeEventListener('pointerup', handleDragEnd);
    };
  }, [dragging, handleDragEnd, handleDragMove]);

  useEffect(() => {
    if (!resizing) return;
    window.addEventListener('pointermove', handleResizeMove);
    window.addEventListener('pointerup', handleResizeEnd);
    return () => {
      window.removeEventListener('pointermove', handleResizeMove);
      window.removeEventListener('pointerup', handleResizeEnd);
    };
  }, [handleResizeEnd, handleResizeMove, resizing]);

  useEffect(() => {
    if (!active) return;
    const clamped = clampLayout(layout);
    const changed =
      clamped.x !== layout.x ||
      clamped.y !== layout.y ||
      clamped.width !== layout.width ||
      clamped.height !== layout.height;

    if (changed) {
      onChange({
        x: clamped.x,
        y: clamped.y,
        width: clamped.width,
        height: clamped.height,
      });
    }
  }, [active, clampLayout, layout, onChange]);

  if (!active) {
    return (
      <Box data-testid={`print-header-block-${id}`} sx={{ position: 'relative', width: '100%' }}>
        {children}
      </Box>
    );
  }

  const controlsVisible = editable && (hovered || dragging || resizing || menuAnchor);

  return (
    <Box
      data-testid={`print-header-block-${id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onContextMenu={handleContextMenu}
      sx={{
        position: 'absolute',
        left: `${layout.x}%`,
        top: `${layout.y}%`,
        width: `${layout.width}%`,
        height: `${layout.height}%`,
        zIndex: layout.zIndex,
        transform: `scale(${layout.scale})`,
        transformOrigin: 'top left',
        overflow: 'visible',
        outline: controlsVisible ? '1px dashed rgba(25, 118, 210, 0.72)' : '1px dashed transparent',
        transition: dragging || resizing ? 'none' : 'outline-color 0.15s ease',
      }}
    >
      <Box sx={{ width: '100%', height: '100%' }}>
        {children}
      </Box>

      {controlsVisible && (
        <>
          <Tooltip title={label}>
            <Box
              className="print-layout-control"
              data-testid={`print-header-drag-${id}`}
              onPointerDown={handleDragStart}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.96)',
                border: '1px solid rgba(25,118,210,0.65)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'primary.main',
                cursor: dragging ? 'grabbing' : 'grab',
                zIndex: 20,
                touchAction: 'none',
              }}
            >
              <OpenWithIcon sx={{ fontSize: 17 }} />
            </Box>
          </Tooltip>

          {resizeHandles.map((handle) => (
            <Box
              key={handle.direction}
              className="print-layout-control"
              data-testid={`print-header-resize-${id}-${handle.direction}`}
              onPointerDown={handleResizeStart(handle.direction)}
              sx={{
                position: 'absolute',
                width: 10,
                height: 10,
                borderRadius: '50%',
                backgroundColor: '#fff',
                border: '1px solid rgba(25,118,210,0.8)',
                boxShadow: '0 1px 5px rgba(0,0,0,0.2)',
                cursor: handle.cursor,
                zIndex: 20,
                touchAction: 'none',
                ...handle.sx,
              }}
            />
          ))}
        </>
      )}

      <Menu
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorReference="anchorPosition"
        anchorPosition={menuAnchor ? { top: menuAnchor.mouseY, left: menuAnchor.mouseX } : undefined}
        className="print-layout-control"
      >
        <MenuItem onClick={() => updateLayer(99)}>
          <KeyboardDoubleArrowUpIcon fontSize="small" sx={{ mr: 1 }} /> 置于顶层
        </MenuItem>
        <MenuItem onClick={() => updateLayer(layout.zIndex + 1)}>
          <ArrowUpwardIcon fontSize="small" sx={{ mr: 1 }} /> 上移一层
        </MenuItem>
        <MenuItem onClick={() => updateLayer(layout.zIndex - 1)}>
          <ArrowDownwardIcon fontSize="small" sx={{ mr: 1 }} /> 下移一层
        </MenuItem>
        <MenuItem onClick={() => updateLayer(1)}>
          <KeyboardDoubleArrowDownIcon fontSize="small" sx={{ mr: 1 }} /> 置于底层
        </MenuItem>
      </Menu>
    </Box>
  );
}

export function PrintHeaderGapHandle({
  topPx,
  value,
  label,
  min = 0,
  max = 180,
  onChange,
  testId,
}: PrintHeaderGapHandleProps) {
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dragStartRef = useRef({ y: 0, value });

  const handleStart = useCallback((event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(true);
    dragStartRef.current = { y: event.clientY, value };
  }, [value]);

  const handleMove = useCallback((event: PointerEvent) => {
    if (!dragging) return;
    const next = clamp(dragStartRef.current.value + event.clientY - dragStartRef.current.y, min, max);
    onChange(Math.round(next));
  }, [dragging, max, min, onChange]);

  const handleEnd = useCallback(() => {
    setDragging(false);
  }, []);

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleEnd);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleEnd);
    };
  }, [dragging, handleEnd, handleMove]);

  return (
    <Tooltip title={label}>
      <Box
        className="print-layout-control"
        data-testid={testId}
        onPointerDown={handleStart}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          position: 'absolute',
          top: `${topPx}px`,
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: hovered || dragging ? 36 : 24,
          height: 18,
          borderRadius: 999,
          backgroundColor: hovered || dragging ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.72)',
          border: '1px solid rgba(25,118,210,0.55)',
          boxShadow: hovered || dragging ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'primary.main',
          cursor: dragging ? 'grabbing' : 'ns-resize',
          zIndex: 30,
          touchAction: 'none',
          transition: 'width 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
          '&::before': {
            content: '""',
            width: 16,
            height: 2,
            borderRadius: 999,
            backgroundColor: 'currentColor',
          },
        }}
      />
    </Tooltip>
  );
}
