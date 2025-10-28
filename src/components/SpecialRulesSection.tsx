import { Box, Divider, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { SpecialRule, I18nText } from '../types';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';

interface SpecialRulesSectionProps {
  rules: SpecialRule[];
  onDelete?: (rule: SpecialRule) => void;
  onEdit?: (rule: SpecialRule) => void;
  isMobile?: boolean;
}

export default function SpecialRulesSection({ rules, onDelete, onEdit, isMobile = false }: SpecialRulesSectionProps) {
  const { t, language } = useTranslation();
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);

  // 如果没有规则则不显示
  if (!rules || rules.length === 0) return null;

  // 辅助函数：获取本地化文本
  const getLocalizedText = (text: string | I18nText | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    // 优先使用当前语言，如果不存在则使用中文，再不存在则使用英文，最后返回空字符串
    return text[language] || text['zh-CN'] || text['en'] || '';
  };

  return (
    <Box
      sx={{
        width: '100%',
        height: isMobile ? 'auto' : '100%',
        display: 'flex',
        flexDirection: 'column',
        minWidth: "350px",
        overflow: isMobile ? 'visible' : 'auto',
        gap: isMobile ? 2 : 0,
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          backgroundColor: 'rgba(0,0,0,0.2)',
          borderRadius: '4px',
        },
      }}
    >
      {rules.map((rule) => (
        <Box
          key={rule.id}
          onMouseEnter={() => setHoveredRuleId(rule.id)}
          onMouseLeave={() => setHoveredRuleId(null)}
          onDoubleClick={() => onEdit && onEdit(rule)}
          sx={{
            position: 'relative',
            width: '100%',
            minHeight: isMobile ? 120 : 150,
            cursor: onEdit ? 'pointer' : 'default',
            userSelect: 'none',
            flexShrink: 0,
          }}
        >
          {/* 卷轴背景图片 */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url(/imgs/images/卷轴.png)",
              backgroundSize: "100% 100%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              zIndex: 0,
            }}
          />

          {/* 编辑和删除按钮 */}
          {hoveredRuleId === rule.id && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                display: 'flex',
                gap: 1,
              }}
            >
              {onEdit && (
                <IconButton
                  onClick={() => onEdit(rule)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                  size="small"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              {onDelete && (
                <IconButton
                  onClick={() => onDelete(rule)}
                  sx={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 1)',
                    },
                  }}
                  size="small"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          )}

          {/* 内容区域 - 固定宽度，自动换行 */}
          <Box
            sx={{
              position: 'relative',
              zIndex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              px: { xs: '10%', sm: '15%', md: '17%' }, // 左右留出卷轴柱子的空间，移动端减少留白
              py: { xs: 1.5, sm: 2, md: 2 },
            }}
          >
            <>
              {rule.title && (
                <Typography
                  component="div"
                  sx={{
                    fontFamily: uiConfigStore.specialRuleTitleFont,
                    fontWeight: 'bold',
                    color: '#3d3226',
                    fontSize: {
                      xs: language === 'en' ? '1.1rem' : '1rem',
                      sm: language === 'en' ? '1.3rem' : '1.15rem',
                      md: language === 'en' ? '1.5rem' : '1.3rem'
                    },
                    mb: 0.3,
                    lineHeight: 1.3,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {getLocalizedText(rule.title).split(/\\n|<br\s*\/?>/).map((line, index, array) => (
                    <span key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </span>
                  ))}
                </Typography>
              )}
              <Divider></Divider>
              {rule.content && (
                <Typography
                  component="div"
                  sx={{
                    fontFamily: uiConfigStore.specialRuleContentFont,
                    color: '#5a4a3a',
                    fontSize: {
                      xs: language === 'en' ? '0.85rem' : '0.7rem',
                      sm: language === 'en' ? '0.95rem' : '0.78rem',
                      md: language === 'en' ? '1.1rem' : '0.85rem'
                    },
                    lineHeight: language === 'en' ? 1 : 1.3,
                    textAlign: 'justify',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {getLocalizedText(rule.content).split(/\\n|<br\s*\/?>/).map((line, index, array) => (
                    <span key={index}>
                      {line}
                      {index < array.length - 1 && <br />}
                    </span>
                  ))}
                </Typography>
              )}
            </>
          </Box>
        </Box>
      ))}
    </Box>
  );
}

