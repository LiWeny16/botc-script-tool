import { Box, Typography, Paper, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { SpecialRule, I18nText } from '../types';
import { THEME_COLORS } from '../theme/colors';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';

interface StateRulesSectionProps {
  rules: SpecialRule[];
  onDelete?: (rule: SpecialRule) => void;
  onEdit?: (rule: SpecialRule) => void;
}

const StateRulesSection = ({ rules, onDelete, onEdit }: StateRulesSectionProps) => {
  const { language } = useTranslation();
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
  
  if (!rules || rules.length === 0) return null;

  // 辅助函数：获取本地化文本
  const getLocalizedText = (text: string | I18nText | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    // 优先使用当前语言，如果不存在则使用中文，再不存在则使用英文，最后返回空字符串
    return text[language] || text['zh-CN'] || text['en'] || '';
  };

  return (
    <Box sx={{ mt: 4, mb: 2 }}>
      {rules.map((rule, index) => (
        <Box
          key={rule.id || index}
          onMouseEnter={() => setHoveredRuleId(rule.id)}
          onMouseLeave={() => setHoveredRuleId(null)}
          onDoubleClick={() => onEdit && onEdit(rule)}
          sx={{
            position: 'relative',
            minHeight: uiConfigStore.titleHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            mb: 3,
            px: { xs: 2, sm: 4, md: 6 },
            cursor: onEdit ? 'pointer' : 'default',
            // 使用伪元素作为背景层
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: "url(/imgs/images/pattern.png)",
              backgroundSize: "48%",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              opacity: 0.6,
              zIndex: 1 ,
            },
            // 确保子元素在背景之上
            '& > *': {
              position: 'relative',
              zIndex: 1,
            },
          }}
        >
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(rule);
                  }}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(rule);
                  }}
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
          
          <Box sx={{ 
            width: '100%', 
            textAlign: 'center',
            py: 2,
          }}>
            {/* 规则标题 */}
            {rule.title && (
              <Typography
                variant="h5"
                sx={{
                  fontFamily: uiConfigStore.stateRuleTitleFont,
                  fontWeight: 'bold',
                  color: THEME_COLORS.paper.primary,
                  fontSize: language === 'en' 
                    ? { xs: '1.4rem', sm: '1.7rem', md: '2.4rem' }
                    : { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
                  mb: 2,
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
            
            {/* 规则内容 */}
            {rule.content && (
              <Typography
                variant="body1"
                sx={{
                  fontFamily: uiConfigStore.stateRuleContentFont,
                  fontSize: language === 'en'
                    ? { xs: '1rem', sm: '1.1rem', md: '1.2rem' }
                    : { xs: '0.9rem', sm: '1rem', md: '1.1rem' },
                  lineHeight: 1.8,
                  color: THEME_COLORS.text.primary,
                  maxWidth: '90%',
                  margin: '0 auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
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
            
            {/* 支持多个规则项 */}
            {rule.rules && rule.rules.length > 0 && (
              <Box sx={{ mt: 2 }}>
                {rule.rules.map((item, idx) => (
                  <Box key={idx} sx={{ mb: 2 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 'bold',
                        color: THEME_COLORS.paper.primary,
                        fontSize: { xs: '1rem', sm: '1.2rem', md: '1.4rem' },
                        mb: 1,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1rem' },
                        lineHeight: 1.6,
                        color: THEME_COLORS.text.secondary,
                      }}
                    >
                      {item.content}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default StateRulesSection;
