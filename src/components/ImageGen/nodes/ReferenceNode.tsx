import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import { Box, Typography, alpha } from '@mui/material';
import type { ReferenceFlowNode } from '../../../stores/imageGenCanvasTypes';
import FlowHandle from './FlowHandle';

function ReferenceNode({ data }: NodeProps) {
  const d = data as unknown as ReferenceFlowNode;

  return (
    <Box
      sx={{
        width: 100,
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: `0 0 0 2px ${alpha('#2196f3', 0.35)}, 0 4px 16px rgba(0,0,0,0.1)`,
      }}
    >
      <FlowHandle color="#2196f3" type="source" />
      <Box
        component="img"
        src={d.imageUrl}
        alt={d.name}
        sx={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
        draggable={false}
      />
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          px: 0.75,
          py: 0.4,
          fontSize: '0.62rem',
          bgcolor: alpha('#2196f3', 0.08),
          color: '#1565c0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {d.name}
      </Typography>
    </Box>
  );
}

export default memo(ReferenceNode);
