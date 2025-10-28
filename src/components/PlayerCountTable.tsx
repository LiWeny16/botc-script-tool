import { Box, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useState } from 'react';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';

interface PlayerCountTableProps {
  type: 'table1' | 'table2';
  readOnly?: boolean;
  onDelete?: () => void;
}

/**
 * 人数配置表组件
 * type='table1': 7-15+人的标准配置
 * type='table2': 6-9人的配置建议
 */
export const PlayerCountTable = ({
  type,
  readOnly = false,
  onDelete,
}: PlayerCountTableProps) => {
  const [hover, setHover] = useState(false);
  const { t, language } = useTranslation();

  // 标准配置表数据（7-15+人）- 转置为横向
  const table1Data = {
    rows: [
      { 
        label: t('playerTable.playerCount'),
        values: ['7', '8', '9', '10', '11', '12', '13', '14', '15+']
      },
      { 
        label: t('playerTable.townsfolk'),
        values: [5, 5, 5, 7, 7, 7, 9, 9, 9],
        color: '#0078ba'
      },
      { 
        label: t('playerTable.outsider'),
        values: [0, 1, 2, 0, 1, 2, 0, 1, 2],
        color: '#0078ba'
      },
      { 
        label: t('playerTable.minion'),
        values: [1, 1, 1, 2, 2, 2, 3, 3, 3],
        color: '#a32222ff'
      },
      { 
        label: t('playerTable.demon'),
        values: [1, 1, 1, 1, 1, 1, 1, 1, 1],
        color: '#a32222ff'
      },
    ],
  };

  // 6-9人配置建议表数据 - 转置为横向
  const table2Data = {
    rows: [
      { 
        label: t('playerTable.playerCount'),
        values: ['6', '7', '8', '9']
      },
      { 
        label: t('playerTable.townsfolk'),
        values: [3, 4, 5, 5],
        color: '#0078ba'
      },
      { 
        label: t('playerTable.outsider'),
        values: [1, 1, 1, 2],
        color: '#0078ba'
      },
      { 
        label: t('playerTable.minion'),
        values: [1, 1, 1, 1],
        color: '#a32222ff'
      },
      { 
        label: t('playerTable.demon'),
        values: [1, 1, 1, 1],
        color: '#a32222ff'
      },
    ],
  };

  const tableData = type === 'table1' ? table1Data : table2Data;
  const title = type === 'table1' 
    ? t('secondPage.playerTable1')
    : t('secondPage.playerTable2');

  return (
    <Box
      sx={{
        position: 'relative',
        py: 3,
        px: 4,
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {/* 标题 */}
      {/* <Typography
        variant="h6"
        sx={{
          textAlign: 'center',
          fontWeight: 700,
          mb: 3,
          fontFamily: uiConfigStore.scriptTitleFont,
          color: 'transparent',
          background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        {title}
      </Typography> */}

      {/* 表格容器 - 横向布局 */}
      <Box
        sx={{
          maxWidth: 800,
          margin: '0 auto',
          border: '3px solid',
          borderColor: 'rgba(0, 0, 0, 0.3)',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundColor: 'rgba(255, 250, 240, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        }}
      >
        {tableData.rows.map((row, rowIndex) => (
          <Box
            key={rowIndex}
            sx={{
              display: 'grid',
              gridTemplateColumns: `140px repeat(${row.values.length}, 1fr)`,
              borderBottom: rowIndex < tableData.rows.length - 1 ? '2px solid rgba(0, 0, 0, 0.15)' : 'none',
              backgroundColor: rowIndex === 0 
                ? 'rgba(245, 235, 220, 1)' 
                : 'rgba(255, 250, 240, 0.5)',
            }}
          >
            {/* 第一列：标签 */}
            <Box
              sx={{
                padding: '14px 12px',
                textAlign: 'center',
                fontWeight: rowIndex === 0 ? 800 : 700,
                fontSize: rowIndex === 0 ? '1rem' : '0.95rem',
                borderRight: '2px solid rgba(0, 0, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: rowIndex === 0 
                  ? `url(${uiConfigStore.nightOrderBackgroundUrl})`
                  : 'transparent',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundClip: rowIndex === 0 ? 'text' : 'unset',
                WebkitBackgroundClip: rowIndex === 0 ? 'text' : 'unset',
                WebkitTextFillColor: rowIndex === 0 ? 'transparent' : row.color || '#333',
                color: row.color || '#333',
              }}
            >
              {row.label}
            </Box>

            {/* 数据列 */}
            {row.values.map((value, colIndex) => (
              <Box
                key={colIndex}
                sx={{
                  padding: '14px 8px',
                  textAlign: 'center',
                  fontWeight: rowIndex === 0 ? 800 : 600,
                  fontSize: rowIndex === 0 ? '1rem' : '0.95rem',
                  borderRight: colIndex < row.values.length - 1 ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: rowIndex === 0 ? '#333' : row.color || '#333',
                }}
              >
                {value}
              </Box>
            ))}
          </Box>
        ))}
      </Box>

      {/* 悬停时显示的删除按钮 - 使用和第一页相同的样式 */}
      {!readOnly && hover && onDelete && (
        <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
          <IconButton
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }}
            size="small"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      )}
    </Box>
  );
};

