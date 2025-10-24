import { Box, Divider, Typography, IconButton } from '@mui/material';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { useState } from 'react';
import type { SpecialRule } from '../types';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';

interface SpecialRulesSectionProps {
  rules: SpecialRule[];
  onDelete?: (rule: SpecialRule) => void;
  onEdit?: (rule: SpecialRule) => void;
}

export default function SpecialRulesSection({ rules, onDelete, onEdit }: SpecialRulesSectionProps) {
  const { t, language } = useTranslation();
  const [hoveredRuleId, setHoveredRuleId] = useState<string | null>(null);
  
  // 如果没有自定义规则,使用默认规则
  const displayRules = rules.length > 0 ? rules : rules;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1,
        mt: { xs: 5, sm: 0.3 },
        mb: 1,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 700,
          display: 'flex',
          flexDirection: displayRules.length === 1 ? 'column' : { xs: 'column', sm: 'row' },
        }}
      >
        {displayRules.map((rule) => (
          <Box
            key={rule.id}
            onMouseEnter={() => setHoveredRuleId(rule.id)}
            onMouseLeave={() => setHoveredRuleId(null)}
            onDoubleClick={() => onEdit && onEdit(rule)}
            sx={{
              flex: 1,
              position: 'relative',
              minWidth: { xs: 250, sm: 300, md: 350 },
              maxWidth: { xs: 400, sm: 500, md: 600 },
              minHeight: { xs: 80, sm: 100, md: 120 },
              cursor: onEdit ? 'pointer' : 'default',
              userSelect: 'none',
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

            {/* 内容区域 */}
            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                px: { xs: '15%', sm: '18%', md: '20' }, // 左右留出卷轴柱子的空间
                py: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              {/* 如果有 rules 数组，显示多个规则项 */}
              {rule.rules && rule.rules.length > 0 ? (
                <>
                  {rule.rules.map((item, index) => (
                    <Box
                      key={index}
                      sx={{
                        mb: index < rule.rules!.length - 1 ? 1.5 : 0,
                      }}
                    >
                      <Typography
                        component="div"
                        sx={{
                          fontWeight: 'bold',
                          color: '#3d3226',
                          fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                          mb: 0.3,
                          lineHeight: 1.4,
                        }}
                      >
                        {item.title}
                      </Typography>
                     
                      <Typography
                        component="div"
                        sx={{
                          color: '#5a4a3a',
                          fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                          lineHeight: 1.6,
                          textAlign: 'justify',
                        }}
                      >
                        {item.content}
                      </Typography>
                    </Box>
                  ))}
                </>
              ) : (
                /* 单个规则项（向后兼容） - 包括 state/status */
                <>
                  {rule.title && (
                    <Typography
                      component="div"
                      sx={{
                        fontWeight: 'bold',
                        color: '#3d3226',
                        fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' },
                        mb: 0.3,
                        lineHeight: 1.4,
                      }}
                    >
                      {rule.title}
                    </Typography>
                  )}
                  {rule.content && (
                    <Typography
                      component="div"
                      sx={{
                        color: '#5a4a3a',
                        fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' },
                        lineHeight: 1.6,
                        textAlign: 'justify',
                      }}
                    >
                      {rule.content}
                    </Typography>
                  )}
                </>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

