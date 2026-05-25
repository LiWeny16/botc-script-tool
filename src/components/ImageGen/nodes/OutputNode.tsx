import React, { memo } from 'react';
import { type NodeProps } from '@xyflow/react';
import FlowHandle from './FlowHandle';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  CircularProgress,
  Button,
  alpha,
  Skeleton,
} from '@mui/material';
import {
  Download as DownloadIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  AutoAwesome as AutoAwesomeIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../../utils/i18n';
import { alertSuccess, alertError } from '../../../utils/alert';
import { imageGenStore } from '../../../stores/ImageGenStore';
import type { OutputFlowNode } from '../../../stores/imageGenCanvasTypes';

const OutputNodeInner = observer(function OutputNodeInner({ id, data, selected }: NodeProps) {
  const { t } = useTranslation();
  const d = data as unknown as OutputFlowNode;
  const isSelected = selected || imageGenStore.selectedNodeIds.includes(id);
  const isThisGenerating = imageGenStore.isOutputGenerating(id);
  const showGenerating = d.status === 'generating' || isThisGenerating;
  const hasPreview = !!d.dataUrl;

  const handleGenerate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await imageGenStore.generateOutputNode(id);
    } catch {
      if (!imageGenStore.isOutputGenerating(id)) {
        alertError(t('imageGen.error.generationFailed'));
      }
    }
  };

  const handleStop = (e: React.MouseEvent) => {
    e.stopPropagation();
    imageGenStore.cancelGeneration();
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!d.dataUrl) return;
    const link = document.createElement('a');
    link.href = d.dataUrl;
    link.download = `botc-icon-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!d.dataUrl?.startsWith('data:')) return;
    try {
      const resp = await fetch(d.dataUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      alertSuccess(t('imageGen.copySuccess'));
    } catch {
      alertError(t('imageGen.copyFailed'));
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    imageGenStore.removeNode(id);
  };

  const ring = isSelected
    ? `0 0 0 2px #9c27b0, 0 12px 32px ${alpha('#9c27b0', 0.22)}`
    : `0 4px 18px rgba(0,0,0,0.1), 0 0 0 1px ${alpha('#000', 0.06)}`;

  const primaryButton = showGenerating ? (
    <Button
      size="small"
      variant="contained"
      color="error"
      startIcon={<StopIcon sx={{ fontSize: 16 }} />}
      onClick={handleStop}
      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', flex: 1 }}
    >
      {t('imageGen.stopGenerate')}
    </Button>
  ) : (
    <Button
      size="small"
      variant="contained"
      startIcon={hasPreview ? <RefreshIcon sx={{ fontSize: 16 }} /> : <AutoAwesomeIcon sx={{ fontSize: 16 }} />}
      disabled={!imageGenStore.hasApiKey || (imageGenStore.isGenerating && !isThisGenerating)}
      onClick={handleGenerate}
      sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.72rem', flex: 1 }}
    >
      {hasPreview ? t('imageGen.regenerate') : t('imageGen.generate')}
    </Button>
  );

  return (
    <Box
      className="image-gen-output-node"
      sx={{
        position: 'relative',
        width: 220,
        borderRadius: 2.5,
        overflow: 'hidden',
        bgcolor: '#fff',
        boxShadow: ring,
        transition: 'box-shadow 0.2s',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <FlowHandle color="#9c27b0" type="target" id="in" />

      {/* 已有结果：展示图片 + 常驻操作栏（含重新生成） */}
      {hasPreview && (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ position: 'relative', width: '100%', aspectRatio: '1/1', lineHeight: 0 }}>
            <Box
              component="img"
              src={d.dataUrl}
              alt="output"
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                opacity: showGenerating ? 0.45 : 1,
                transition: 'opacity 0.2s',
              }}
              draggable={false}
            />
            {showGenerating && (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: alpha('#fff', 0.35),
                }}
              >
                <CircularProgress size={32} sx={{ color: '#9c27b0' }} />
              </Box>
            )}
          </Box>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              px: 0.75,
              py: 0.75,
              borderTop: '1px solid',
              borderColor: alpha('#000', 0.06),
              bgcolor: alpha('#fafafa', 0.95),
            }}
          >
            {primaryButton}
            {!showGenerating && (
              <>
                <Tooltip title={t('imageGen.copy')} arrow>
                  <IconButton size="small" onClick={handleCopy}>
                    <CopyIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('imageGen.download')} arrow>
                  <IconButton size="small" onClick={handleDownload}>
                    <DownloadIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('imageGen.deleteImage')} arrow>
                  <IconButton size="small" onClick={handleDelete}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>
        </Box>
      )}

      {/* 空白 / 首次生成 */}
      {!hasPreview && (d.status === 'empty' || showGenerating) && (
        <Box
          sx={{
            width: '100%',
            aspectRatio: '1/1',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            bgcolor: alpha('#9c27b0', 0.04),
            border: '2px dashed',
            borderColor: showGenerating ? alpha('#9c27b0', 0.4) : alpha('#9c27b0', 0.25),
            cursor: 'default',
          }}
        >
          {showGenerating ? (
            <CircularProgress size={36} sx={{ color: '#9c27b0' }} />
          ) : (
            <Skeleton variant="rounded" width={120} height={120} sx={{ bgcolor: alpha('#9c27b0', 0.08) }} />
          )}
          <Typography variant="caption" sx={{ color: 'text.secondary', textAlign: 'center', px: 1, fontSize: '0.68rem' }}>
            {showGenerating ? t('imageGen.generatingOnCanvas') : t('imageGen.node.pressGenerate')}
          </Typography>
          {primaryButton}
        </Box>
      )}

      {d.status === 'error' && !showGenerating && !hasPreview && (
        <Box sx={{ p: 2, minHeight: 180, display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'center' }}>
          <Typography variant="caption" color="error" sx={{ flex: 1, textAlign: 'center' }}>
            {d.error ?? t('imageGen.error.generationFailed')}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AutoAwesomeIcon sx={{ fontSize: 16 }} />}
            onClick={handleGenerate}
            sx={{ borderRadius: 2, textTransform: 'none' }}
          >
            {t('imageGen.node.retry')}
          </Button>
        </Box>
      )}

      {d.status === 'error' && !showGenerating && hasPreview && (
        <Box sx={{ px: 1, py: 0.75, bgcolor: alpha('#f44336', 0.06) }}>
          <Typography variant="caption" color="error" sx={{ display: 'block', textAlign: 'center', mb: 0.5 }}>
            {d.error ?? t('imageGen.error.generationFailed')}
          </Typography>
        </Box>
      )}
    </Box>
  );
});

export default memo(OutputNodeInner);
