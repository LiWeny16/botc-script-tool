import React, { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import FlowHandle from './FlowHandle';
import { Box, TextField, Typography, alpha } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../../utils/i18n';
import { imageGenStore } from '../../../stores/ImageGenStore';
import type { PromptFlowNode } from '../../../stores/imageGenCanvasTypes';

const PromptNodeInner = observer(function PromptNodeInner({ id, data }: NodeProps) {
  const { t } = useTranslation();
  const d = data as unknown as PromptFlowNode;

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    imageGenStore.setPromptNodeText(id, e.target.value);
  }, [id]);

  return (
    <Box
      sx={{
        width: 200,
        borderRadius: 2,
        bgcolor: '#fff',
        boxShadow: `0 0 0 2px ${alpha('#9c27b0', 0.3)}, 0 4px 16px rgba(0,0,0,0.08)`,
        p: 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <FlowHandle color="#9c27b0" type="source" />
      <Typography variant="caption" sx={{ fontWeight: 600, color: '#9c27b0', fontSize: '0.68rem', mb: 0.5, display: 'block' }}>
        {t('imageGen.node.prompt')}
      </Typography>
      <TextField
        multiline
        minRows={2}
        maxRows={5}
        size="small"
        fullWidth
        placeholder={t('imageGen.node.promptPlaceholder')}
        value={d.text}
        onChange={onChange}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': { fontSize: '0.78rem', borderRadius: 1.5 },
        }}
      />
    </Box>
  );
});

export default memo(PromptNodeInner);
