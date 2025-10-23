import { Box, Divider, Typography } from '@mui/material';
import type { SpecialRule } from '../types';
import { THEME_COLORS } from '../theme/colors';

interface SpecialRulesSectionProps {
  rules: SpecialRule[];
}

// 默认规则 - 可能和中毒合并在一个卡片
const DEFAULT_RULES: SpecialRule[] = [
  {
    id: 'default_basic_rules',
    title: '基础规则',
    rules: [
      {
        title: '可能',
        content: '某些事情"可能"发生。代表由说书人来决定该事情是否发生。',
      },
      {
        title: '中毒',
        content: '中毒的玩家会失去能力，但会认为自己仍具有能力，说书人会做出这些玩家仍然具有能力的行为。如果中毒玩家的角色能力会给他提供信息，说书人可能会给出错误信息，中毒的玩家不会得知自己中毒。',
      },
    ],
  },
];

export default function SpecialRulesSection({ rules }: SpecialRulesSectionProps) {
  // 如果没有自定义规则，使用默认规则
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
            sx={{
              flex: 1,
              position: 'relative',
              // minHeight: { xs: 150, sm: 180, md: 220 },
              aspectRatio: '820 / 150', // 根据卷轴图片比例设置
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
                /* 单个规则项（向后兼容） */
                <>
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

