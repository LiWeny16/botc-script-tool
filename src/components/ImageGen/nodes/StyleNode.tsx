import React, { memo, useCallback } from 'react';
import { type NodeProps } from '@xyflow/react';
import FlowHandle from './FlowHandle';
import { Box, TextField, Typography, alpha } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../../utils/i18n';
import { imageGenStore } from '../../../stores/ImageGenStore';
import type { StyleFlowNode } from '../../../stores/imageGenCanvasTypes';

const StyleNodeInner = observer(function StyleNodeInner({ id, data }: NodeProps) {
  const { t } = useTranslation();
  const d = data as unknown as StyleFlowNode;

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    imageGenStore.setStyleNodeText(id, e.target.value);
  }, [id]);

  return (
    <Box
      sx={{
        width: 200,
        borderRadius: 2,
        bgcolor: '#fff',
        boxShadow: `0 0 0 2px ${alpha('#ff9800', 0.35)}, 0 4px 16px rgba(0,0,0,0.08)`,
        p: 1,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <FlowHandle color="#ff9800" type="source" />
      <Typography variant="caption" sx={{ fontWeight: 600, color: '#e65100', fontSize: '0.68rem', mb: 0.5, display: 'block' }}>
        {t('imageGen.node.style')}
      </Typography>
      <TextField
        multiline
        minRows={2}
        maxRows={4}
        size="small"
        fullWidth
        placeholder={t('imageGen.node.stylePlaceholder')}
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

export default memo(StyleNodeInner);
