import { useRef, useState } from 'react';
import type { KeyboardEvent, PointerEvent } from 'react';
import { Box } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { MAX_TITLE_CONTENT_GAP, MIN_TITLE_CONTENT_GAP, uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';
import { THEME_COLORS } from '../theme/colors';

/** The first team's visible divider is also the header-height control. */
const TitleContentGapHandle = observer(() => {
  const { t } = useTranslation();
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ pointerId: number; startY: number; startGap: number; scale: number; moved: boolean } | null>(null);
  const gap = Math.max(MIN_TITLE_CONTENT_GAP, Math.min(MAX_TITLE_CONTENT_GAP, uiConfigStore.config.titleContentGap || 0));

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    const page = event.currentTarget.closest<HTMLElement>('#main_script');
    const scale = page && page.offsetWidth ? page.getBoundingClientRect().width / page.offsetWidth : 1;
    drag.current = { pointerId: event.pointerId, startY: event.clientY, startGap: gap, scale: scale || 1, moved: false };
    event.currentTarget.focus({ preventScroll: true });
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };
  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (Math.abs(event.clientY - current.startY) >= 3 * current.scale) current.moved = true;
    if (current.moved) uiConfigStore.setTitleContentGap(current.startGap + (event.clientY - current.startY) / current.scale, { persist: false });
  };
  const finishDrag = (event: PointerEvent<HTMLElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const moved = drag.current.moved;
    drag.current = null;
    if (moved) uiConfigStore.setTitleContentGap(uiConfigStore.config.titleContentGap);
    setDragging(false);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const step = event.shiftKey ? 10 : 1;
    let next: number;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = gap - step;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = gap + step;
    else if (event.key === 'Home') next = MIN_TITLE_CONTENT_GAP;
    else if (event.key === 'End') next = MAX_TITLE_CONTENT_GAP;
    else return;
    event.preventDefault();
    event.stopPropagation();
    uiConfigStore.setTitleContentGap(next);
  };

  return <Box
    role="slider"
    tabIndex={0}
    data-header-gap-divider
    aria-label={t('ui.titleContentGap')}
    aria-orientation="vertical"
    aria-valuemin={MIN_TITLE_CONTENT_GAP}
    aria-valuemax={MAX_TITLE_CONTENT_GAP}
    aria-valuenow={gap}
    aria-valuetext={`${gap}px`}
    title={t('ui.dragTitleContentGap')}
    onPointerDown={handlePointerDown}
    onPointerMove={handlePointerMove}
    onPointerUp={finishDrag}
    onPointerCancel={finishDrag}
    onLostPointerCapture={finishDrag}
    onKeyDown={handleKeyDown}
    sx={{
      flex: 1, ml: 1.5, height: 28, position: 'relative', cursor: 'ns-resize', touchAction: 'none',
      '&::after': { content: '""', position: 'absolute', left: 0, right: 0, top: '50%', borderTop: `2px solid ${dragging ? '#607963' : THEME_COLORS.gray}` },
      '&:hover::after, &:focus-visible::after': { borderColor: '#607963', boxShadow: '0 0 0 2px rgba(96,121,99,.18)' },
      '&:focus-visible': { outline: '2px solid #607963', outlineOffset: 2 },
      '@media print': { height: 2, '&::after': { borderColor: THEME_COLORS.gray, boxShadow: 'none' } },
    }}
  />;
});

export default TitleContentGapHandle;
