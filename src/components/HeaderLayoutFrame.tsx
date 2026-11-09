import type { MouseEvent } from 'react';
import type { HeaderLayoutTarget } from '../utils/headerLayout';
import LayoutFrame, {
  LAYOUT_EDGES,
  LayoutEdgeButton,
  layoutControlSx,
  type LayoutEdge,
} from './LayoutFrame';
import { useHeaderLayoutDrag } from './useHeaderLayoutDrag';
import type { HeaderResizeEdge } from './useHeaderLayoutDrag';

export const headerLayoutControlSx = layoutControlSx;

interface ResizeEdgeProps {
  target: HeaderLayoutTarget;
  edge: LayoutEdge;
  label: string;
  kind: 'box' | 'avatar' | 'title' | 'titleImage';
}

const ResizeEdge = ({ target, edge, label, kind }: ResizeEdgeProps) => {
  const drag = useHeaderLayoutDrag(target, 'resize', false, edge as HeaderResizeEdge, kind);
  return <LayoutEdgeButton edge={edge} label={label} handlers={drag} />;
};

interface HeaderLayoutFrameProps {
  target: HeaderLayoutTarget;
  moveLabel: string;
  resizeLabel: string;
  moreLabel: string;
  editLabel?: string;
  onEdit?: () => void;
  kind?: 'box' | 'avatar' | 'title' | 'titleImage';
  resizable?: boolean;
  onOpenMenu?: (event: MouseEvent<HTMLElement>) => void;
  onContextMenu?: (event: MouseEvent<HTMLElement>) => void;
}

const HeaderLayoutFrame = ({
  target,
  moveLabel,
  resizeLabel,
  moreLabel,
  editLabel,
  onEdit,
  kind = 'box',
  resizable = true,
  onOpenMenu,
  onContextMenu,
}: HeaderLayoutFrameProps) => {
  return (
    <LayoutFrame
      labels={{ move: moveLabel, resize: resizeLabel, more: moreLabel }}
      editLabel={editLabel}
      onEdit={onEdit}
      edges={resizable ? LAYOUT_EDGES.map((edge) => (
        <ResizeEdge key={edge} target={target} edge={edge} label={resizeLabel} kind={kind} />
      )) : null}
      onOpenMenu={onOpenMenu}
      onContextMenu={onContextMenu}
      scopeClass="header-layout-frame"
    />
  );
};

export default HeaderLayoutFrame;
