import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Box } from '@mui/material';
import { EditOutlined, MoreVert } from '@mui/icons-material';
import { layoutControlSx } from './LayoutFrame';

interface Props {
  editLabel: string;
  moreLabel: string;
  onEdit?: () => void;
  onOpenMenu: (event: MouseEvent<HTMLElement>) => void;
}

/** Rule rows share a container, so their actions must remain attached to the hovered row. */
export default function LayoutRowActions({ editLabel, moreLabel, onEdit, onOpenMenu }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [side, setSide] = useState<'left' | 'right' | 'above'>('right');
  useEffect(() => {
    const row = ref.current?.parentElement;
    if (!row) return;
    const measure = () => {
      const rect = row.getBoundingClientRect();
      const paper = row.closest<HTMLElement>('#main_script, #footer-paper-2');
      const bounds = paper?.getBoundingClientRect();
      const scale = paper?.offsetWidth && bounds ? bounds.width / paper.offsetWidth : 1;
      const needed = 64 * scale;
      const right = Math.min(window.innerWidth, bounds?.right ?? window.innerWidth) - rect.right;
      const left = rect.left - Math.max(0, bounds?.left ?? 0);
      setSide(right >= needed ? 'right' : left >= needed ? 'left' : 'above');
    };
    row.addEventListener('pointerenter', measure);
    row.addEventListener('focusin', measure);
    return () => { row.removeEventListener('pointerenter', measure); row.removeEventListener('focusin', measure); };
  }, []);
  return <Box ref={ref} className="layout-row-actions" onDoubleClick={event => event.stopPropagation()} sx={{
    position: 'absolute',
    ...(side === 'above' ? { bottom: 'calc(100% + 4px)', right: 0 }
      : { top: '50%', transform: 'translateY(-50%)', ...(side === 'right' ? { left: 'calc(100% + 4px)' } : { right: 'calc(100% + 4px)' }) }),
    zIndex: 21, display: 'flex', alignItems: 'center', gap: '4px', opacity: 0, visibility: 'hidden', pointerEvents: 'none',
    '@media (hover: none) and (pointer: coarse)': { gap: '16px' },
    '@media print': { display: 'none' },
  }}>
    {onEdit && <Box component="button" type="button" data-layout-control aria-label={editLabel} title={editLabel}
      onPointerDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); onEdit(); }}
      sx={{ ...layoutControlSx, cursor: 'pointer' }}><EditOutlined sx={{ fontSize: 16 }} /></Box>}
    <Box component="button" type="button" data-layout-control aria-label={moreLabel} title={moreLabel} aria-haspopup="menu"
      onPointerDown={event => event.stopPropagation()} onClick={onOpenMenu}
      sx={{ ...layoutControlSx, width: 24, height: 24, cursor: 'pointer' }}><MoreVert sx={{ fontSize: 17 }} /></Box>
  </Box>;
}
