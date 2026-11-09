import type { MouseEvent, PointerEvent } from 'react';
import LayoutFrame, { type LayoutEdge } from './LayoutFrame';

export type FooterEdge = LayoutEdge;

type PointerHandler = (event: PointerEvent<HTMLElement>) => void;

interface Props {
  labels: {
    move: string;
    resize: string;
    more: string;
  };
  onStart: (event: PointerEvent<HTMLElement>, edge: FooterEdge | 'move') => void;
  onMove: PointerHandler;
  onFinish: PointerHandler;
  editLabel?: string;
  onEdit?: () => void;
  onOpenMenu?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
  actionsInside?: boolean;
}

export default function FooterLayoutFrame({
  labels,
  onStart,
  onMove,
  onFinish,
  editLabel,
  onEdit,
  onOpenMenu,
  onContextMenu,
  actionsInside,
}: Props) {
  const handlers = {
    onPointerDown: (event: PointerEvent<HTMLElement>) => onStart(event, 'move'),
    onPointerMove: onMove,
    onPointerUp: onFinish,
    onPointerCancel: onFinish,
    onLostPointerCapture: onFinish,
  };
  return (
    <LayoutFrame
      labels={labels}
      editLabel={editLabel}
      onEdit={onEdit}
      edgeHandlers={(edge) => ({
        ...handlers,
        onPointerDown: (event) => onStart(event, edge),
      })}
      onOpenMenu={onOpenMenu}
      onContextMenu={onContextMenu}
      actionsInside={actionsInside}
      scopeClass="footer-layout-frame"
    />
  );
}
