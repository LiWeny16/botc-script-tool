import { Box, Typography, Paper, Divider, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { Character, Script, JinxInfo } from '../types';
import CharacterImage from './CharacterImage';
import { THEME_COLORS } from '../theme/colors';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';
import { scriptStore } from '../stores/ScriptStore';
interface JinxSectionProps {
    script: Script;
    compact?: boolean;
}

// 用于去重的相克规则接口
interface UniqueJinx {
    characterA: Character;
    characterB: Character;
    jinxInfo: JinxInfo;  // 相克信息对象
}

const JinxSection = observer(({ script, compact = false }: JinxSectionProps) => {
    const COMPACT_SCALE = compact ? 0.47 : 1;
    const { t, language } = useTranslation();
    const config = uiConfigStore.config.characterCard;
    const [hoveredJinxKey, setHoveredJinxKey] = useState<string | null>(null);

    // 从 jinx 对象中提取所有唯一的相克规则
    const getUniqueJinxes = (): UniqueJinx[] => {
        const jinxes: UniqueJinx[] = [];
        const processedPairs = new Set<string>(); // 用于追踪已处理的配对

        // 遍历所有相克规则
        Object.entries(script.jinx).forEach(([nameA, targets]) => {
            Object.entries(targets).forEach(([nameB, jinxData]) => {
                // 过滤掉 display 为 false 的相克规则
                if (jinxData.display === false) {
                    return;
                }

                // 创建一个标准化的配对键（按字母顺序排序，确保 A-B 和 B-A 被视为同一对）
                const pairKey = [nameA, nameB].sort().join('|||');

                // 如果这对已经处理过，跳过
                if (processedPairs.has(pairKey)) {
                    return;
                }

                // 查找对应的角色对象
                const characterA = script.all.find(c => c.name === nameA);
                const characterB = script.all.find(c => c.name === nameB);

                if (characterA && characterB) {
                    jinxes.push({
                        characterA,
                        characterB,
                        jinxInfo: jinxData,
                    });
                    processedPairs.add(pairKey);
                }
            });
        });

        return jinxes;
    };

    const uniqueJinxes = getUniqueJinxes().sort((a, b) => {
        // 同一角色的相克排在一起
        const nameCmp = a.characterA.name.localeCompare(b.characterA.name);
        if (nameCmp !== 0) return nameCmp;
        return a.characterB.name.localeCompare(b.characterB.name);
    });

    const handleDeleteJinx = (jinx: UniqueJinx) => {
        // 只有自定义相克才可以删除
        if (!jinx.jinxInfo.isOfficial) {
            scriptStore.removeCustomJinx(jinx.characterA, jinx.characterB);
        }
    };

    // 如果没有相克规则，不显示此区域
    if (uniqueJinxes.length === 0) {
        return null;
    }

    return (
        <Box sx={{ width: '100%', mb: 3, mt: 3, position: 'relative' }}>
            {/* 标题 */}

            <Box sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                mb: 2,
            }}>
                <CharacterImage
                    src="https://oss.gstonegames.com/data_file/clocktower/web/icons/djinn.png"
                    alt="Jinx Icon"
                    sx={{
                        width: { xs: 30 * COMPACT_SCALE, sm: 35 * COMPACT_SCALE, md: 75 * COMPACT_SCALE },
                        height: { xs: 30 * COMPACT_SCALE, sm: 35 * COMPACT_SCALE, md: 75 * COMPACT_SCALE },
                        mr: 2 * COMPACT_SCALE,
                        flexShrink: 0,
                        userDrag: 'none',
                        WebkitUserDrag: 'none',
                        pointerEvents: 'none',
                    }}
                />
                <Typography
                    variant="h5"
                    sx={{
                        fontFamily: uiConfigStore.jinxTextFont,
                        fontWeight: 'bold',
                        color: THEME_COLORS.paper.primary,
                        textAlign: 'center',
                        fontSize: { xs: `${1.2 * COMPACT_SCALE}rem`, sm: `${1.4 * COMPACT_SCALE}rem`, md: `${1.6 * COMPACT_SCALE}rem` },
                    }}
                >
                    {t('jinx.title')}
                </Typography>
                <Divider
                    sx={{
                        flex: 1,
                        ml: 1.5,
                        borderColor: THEME_COLORS.paper,
                        borderWidth: 1,
                    }}
                />
            </Box>

            {/* 相克规则列表：紧凑模式竖排3列（CSS columns 报纸式竖排） */}
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2 * COMPACT_SCALE,
                ...(compact ? {
                    display: 'block',
                    columnCount: { xs: 2, sm: 4 },
                    columnGap: '0.3rem',
                    '& > *': {
                        breakInside: 'avoid',
                        marginBottom: '0.3rem',
                    },
                } : {}),
            }}>
                {uniqueJinxes.map((jinx, index) => {
                    const jinxKey = `${jinx.characterA.id}-${jinx.characterB.id}-${index}`;
                    return (
                        <Paper
                            key={jinxKey}
                            elevation={0}
                            onMouseEnter={() => setHoveredJinxKey(jinxKey)}
                            onMouseLeave={() => setHoveredJinxKey(null)}
                            sx={{
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                p: 0.3 * COMPACT_SCALE,
                                backgroundColor: uiConfigStore.config.theme === 'sakura' ? 'rgba(255, 218, 224, 0.5)' : 'rgba(237, 228, 213, 0.6)',
                                borderRadius: 2,
                                border: '1px solid rgba(0, 0, 0, 0.1)',
                            }}
                        >
                            {/* 删除按钮（仅自定义相克显示） */}
                            {!jinx.jinxInfo.isOfficial && hoveredJinxKey === jinxKey && (
                                <IconButton
                                    onClick={() => handleDeleteJinx(jinx)}
                                    sx={{
                                        position: 'absolute',
                                        top: 4,
                                        right: 4,
                                        backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                        '&:hover': {
                                            backgroundColor: 'rgba(255, 255, 255, 1)',
                                        },
                                        zIndex: 1,
                                        '@media print': {
                                            display: 'none',
                                        },
                                    }}
                                    size="small"
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            )}

                            {/* 角色A的大图标 */}
                            <CharacterImage
                                src={jinx.characterA.image}
                                alt={jinx.characterA.name}
                                sx={{
                                    width: { xs: 40 * COMPACT_SCALE, sm: 45 * COMPACT_SCALE, md: 60 * COMPACT_SCALE },
                                    height: { xs: 40 * COMPACT_SCALE, sm: 45 * COMPACT_SCALE, md: 60 * COMPACT_SCALE },
                                    borderRadius: 1,
                                    flexShrink: 0,
                                    userDrag: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* 灯神图标 */}
                            <CharacterImage
                                src="https://oss.gstonegames.com/data_file/clocktower/web/icons/djinn.png"
                                alt="Jinx Icon"
                                sx={{
                                    width: { xs: 30 * COMPACT_SCALE, sm: 35 * COMPACT_SCALE, md: 45 * COMPACT_SCALE },
                                    height: { xs: 30 * COMPACT_SCALE, sm: 35 * COMPACT_SCALE, md: 45 * COMPACT_SCALE },
                                    borderRadius: 0.5,
                                    flexShrink: 0,
                                    userDrag: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* 角色B的小图标 */}
                            <CharacterImage
                                src={jinx.characterB.image}
                                alt={jinx.characterB.name}
                                sx={{
                                    width: { xs: 40 * COMPACT_SCALE, sm: 45 * COMPACT_SCALE, md: 60 * COMPACT_SCALE },
                                    height: { xs: 40 * COMPACT_SCALE, sm: 45 * COMPACT_SCALE, md: 60 * COMPACT_SCALE },
                                    borderRadius: 1,
                                    flexShrink: 0,
                                    userDrag: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />

                            {/* 相克规则描述 */}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        fontFamily: uiConfigStore.jinxTextFont,
                                        fontSize: { xs: `${0.85 * COMPACT_SCALE}rem`, sm: `${0.9 * COMPACT_SCALE}rem`, md: `${1.14 * COMPACT_SCALE}rem` },
                                        lineHeight: 1.6,
                                        color: THEME_COLORS.text.primary,
                                        fontStyle: 'italic',
                                    }}
                                >
                                    <strong>{jinx.characterA.name}</strong> {t('jinx.and')} <strong>{jinx.characterB.name}</strong>{t('jinx.separator')}{jinx.jinxInfo.reason}
                                </Typography>
                            </Box>
                        </Paper>
                    );
                })}
            </Box>
        </Box>
    );
});

export default JinxSection;
