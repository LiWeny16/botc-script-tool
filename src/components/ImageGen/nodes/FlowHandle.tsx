import { Handle, Position, type HandleProps } from '@xyflow/react';

type FlowHandleProps = {
  color: string;
  type?: HandleProps['type'];
  position?: Position;
  id?: string;
};

/** 视觉 14px，CSS 扩大可点击热区至约 36px */
export default function FlowHandle({
  color,
  type = 'source',
  position = Position.Right,
  id = 'out',
}: FlowHandleProps) {
  const isTarget = type === 'target';
  return (
    <Handle
      type={type}
      position={position}
      id={id}
      className="image-gen-flow-handle"
      style={{
        background: color,
        width: 14,
        height: 14,
        border: '2px solid #fff',
        boxShadow: `0 0 0 1px ${color}40`,
        ...(isTarget
          ? { left: -8 }
          : { right: -8 }),
      }}
    />
  );
}
