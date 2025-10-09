import { Box, Typography } from '@mui/material';
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
  const displayRules = rules.length > 0 ? rules : DEFAULT_RULES;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        zIndex: 1,
        mt: 1,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: displayRules.length === 1 ? 'column' : { xs: 'column', sm: 'row' },
          gap: 1.5,
          px: { xs: 1, sm: 2, md: 3 },
        }}
      >
        {displayRules.map((rule) => (
          <Box
            key={rule.id}
            sx={{
              flex: 1,
              border: '2px solid rgba(61, 50, 38, 0.4)',
              borderRadius: 2,
              p: { xs: 1.5, sm: 2 },
              backgroundColor: 'rgba(254, 250, 240, 0.5)',
            }}
          >
            {/* 如果有 rules 数组，显示多个规则项 */}
            {rule.rules && rule.rules.length > 0 ? (
              <>
                {rule.rules.map((item, index) => (
                  <Box key={index} sx={{ mb: index < rule.rules!.length - 1 ? 1.5 : 0 }}>
                    <Typography
                      component="span"
                      sx={{
                        fontWeight: 'bold',
                        color: THEME_COLORS.paper.secondary,
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        display: 'block',
                        mb: 0.5,
                      }}
                    >
                      {item.title}
                    </Typography>
                    <Typography
                      component="span"
                      sx={{
                        color: THEME_COLORS.paper.secondary,
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        display: 'block',
                        lineHeight: 1.6,
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
                {rule.title && (
                  <Typography
                    component="span"
                    sx={{
                      fontWeight: 'bold',
                      color: THEME_COLORS.paper.secondary,
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    {rule.title}
                  </Typography>
                )}
                {rule.content && (
                  <Typography
                    component="span"
                    sx={{
                      color: THEME_COLORS.paper.secondary,
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      display: 'block',
                      lineHeight: 1.6,
                    }}
                  >
                    {rule.content}
                  </Typography>
                )}
              </>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}

