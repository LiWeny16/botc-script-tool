import { useRef, useState, useMemo, useCallback } from 'react';
import { Box, Paper, Typography, IconButton, useMediaQuery } from '@mui/material';
import { Edit as EditIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { Script, Character, SecondPageComponentType } from '../types';
import CharacterSection from './CharacterSection';
import NightOrder from './NightOrder';
import SpecialRulesSection from './SpecialRulesSection';
import StateRulesSection from './StateRulesSection';
import JinxSection from './JinxSection';
import CharacterImage from './CharacterImage';
import { SecondPageTitle } from './SecondPageTitle';
import { PlayerCountTable } from './PlayerCountTable';
import { SecondPageAddButton } from './SecondPageAddButton';
import { SecondPageSortableItem } from './SecondPageSortableItem';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';
import { configStore } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export interface ScriptRendererProps {
    script: Script;
    theme: any; // MUI theme

    // 编辑模式配置
    readOnly?: boolean; // 是否只读模式

    // 事件回调（编辑模式下使用）
    onReorderCharacters?: (team: string, newOrder: string[]) => void;
    onUpdateCharacter?: (characterId: string, updates: Partial<Character>) => void;
    onEditCharacter?: (character: Character) => void;
    onDeleteCharacter?: (character: Character) => void;
    onReplaceCharacter?: (character: Character, position: { x: number; y: number }) => void;
    onTitleEdit?: () => void;
    onSecondPageTitleEdit?: () => void;  // 第二页标题编辑
    onSpecialRuleEdit?: (rule: any) => void;
    onSpecialRuleDelete?: (rule: any) => void;
    onNightOrderReorder?: (nightType: 'first' | 'other', oldIndex: number, newIndex: number) => void;
}

/**
 * 剧本渲染器组件
 * 用于渲染剧本的核心内容，支持编辑模式和只读模式
 */
const ScriptRenderer = observer(({
    script,
    theme,
    readOnly = false,
    onReorderCharacters = () => { },
    onUpdateCharacter = () => { },
    onEditCharacter = () => { },
    onDeleteCharacter = () => { },
    onReplaceCharacter = () => { },
    onTitleEdit = () => { },
    onSecondPageTitleEdit = () => { },
    onSpecialRuleEdit = () => { },
    onSpecialRuleDelete = () => { },
    onNightOrderReorder = () => { },
}: ScriptRendererProps) => {
    const { t } = useTranslation();
    const scriptRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [titleHovered, setTitleHovered] = useState<boolean>(false);

    // 第二页拖拽传感器
    const secondPageSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: readOnly ? { distance: 999999 } : { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 获取第二页所有可用的组件 ID
    const getAvailableSecondPageComponents = useCallback(() => {
        const components: string[] = [];
        // 顶部装饰图片
        components.push('top_image');
        // 第二页标题
        if (script.secondPageTitle) components.push('title');
        // 人数配置表
        if (script.secondPagePplTable1) components.push('ppl_table1');
        if (script.secondPagePplTable2) components.push('ppl_table2');
        // 传奇和旅行者
        if (script.characters.fabled && script.characters.fabled.length > 0) components.push('fabled');
        if (script.characters.traveler && script.characters.traveler.length > 0) components.push('traveler');
        // 未知团队
        Object.keys(script.characters)
            .filter(team => !['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].includes(team))
            .forEach(team => {
                if (script.characters[team] && script.characters[team].length > 0) {
                    components.push(`team_${team}`);
                }
            });
        // 相克规则
        if (script.jinx && Object.keys(script.jinx).length > 0) components.push('jinx');
        // 特殊规则
        if (script.secondPageRules && script.secondPageRules.length > 0) components.push('secondPageRules');
        return components;
    }, [script]);

    // 获取第二页组件的排序顺序
    const secondPageComponentOrder = useMemo(() => {
        const available = getAvailableSecondPageComponents();
        if (script.secondPageOrder && script.secondPageOrder.length > 0) {
            // 过滤出存在的组件，并添加新增的组件
            const existing = script.secondPageOrder.filter(id => available.includes(id));
            const newOnes = available.filter(id => !existing.includes(id));
            return [...existing, ...newOnes];
        }
        return available;
    }, [script.secondPageOrder, getAvailableSecondPageComponents]);

    // 处理第二页组件拖拽结束
    const handleSecondPageDragEnd = useCallback((event: DragEndEvent) => {
        if (readOnly) return;

        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = secondPageComponentOrder.indexOf(active.id as string);
        const newIndex = secondPageComponentOrder.indexOf(over.id as string);

        if (oldIndex !== -1 && newIndex !== -1) {
            const newOrder = arrayMove(secondPageComponentOrder, oldIndex, newIndex);
            scriptStore.updateSecondPageOrder(newOrder);
        }
    }, [secondPageComponentOrder, readOnly]);

    // 渲染第二页的单个组件
    const renderSecondPageComponent = useCallback((componentId: string) => {
        switch (componentId) {
            case 'top_image':
                return (
                    <CharacterImage
                        key="top_image"
                        id="second_page_top"
                        component="img"
                        src={"/imgs/images/back_4.png"}
                        alt="Decorative torn paper"
                        sx={{
                            position: "relative",
                            top: "0%",
                            width: "30%",
                            height: "auto",
                            zIndex: 1,
                            pointerEvents: 'none',
                            opacity: 0.95,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                            margin: '0 auto',
                            display: 'block',
                        }}
                    />
                );

            case 'title':
                return script.secondPageTitle ? (
                    <SecondPageTitle
                        key="title"
                        title={script.secondPageTitleText || script.title}
                        titleImage={script.secondPageTitleImage}
                        useImage={script.useSecondPageTitleImage}
                        fontSize={script.secondPageTitleFontSize}
                        imageSize={script.secondPageTitleImageSize}
                        author={script.author}
                        playerCount={script.playerCount}
                        readOnly={readOnly}
                        onDelete={() => scriptStore.removeSecondPageComponent('title')}
                        onEdit={onSecondPageTitleEdit}
                    />
                ) : null;

            case 'ppl_table1':
                return script.secondPagePplTable1 ? (
                    <PlayerCountTable
                        key="ppl_table1"
                        type="table1"
                        readOnly={readOnly}
                        onDelete={() => scriptStore.removeSecondPageComponent('ppl_table1')}
                    />
                ) : null;

            case 'ppl_table2':
                return script.secondPagePplTable2 ? (
                    <PlayerCountTable
                        key="ppl_table2"
                        type="table2"
                        readOnly={readOnly}
                        onDelete={() => scriptStore.removeSecondPageComponent('ppl_table2')}
                    />
                ) : null;

            case 'fabled':
                return script.characters.fabled && script.characters.fabled.length > 0 ? (
                    <CharacterSection
                        key="fabled"
                        team="fabled"
                        characters={script.characters.fabled}
                        script={script}
                        onReorder={readOnly ? () => { } : onReorderCharacters}
                        onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                        onEditCharacter={readOnly ? () => { } : onEditCharacter}
                        onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                        onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                        disableDrag={readOnly}
                    />
                ) : null;

            case 'traveler':
                return script.characters.traveler && script.characters.traveler.length > 0 ? (
                    <CharacterSection
                        key="traveler"
                        team="traveler"
                        characters={script.characters.traveler}
                        script={script}
                        onReorder={readOnly ? () => { } : onReorderCharacters}
                        onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                        onEditCharacter={readOnly ? () => { } : onEditCharacter}
                        onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                        onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                        disableDrag={readOnly}
                    />
                ) : null;

            case 'jinx':
                return script.jinx && Object.keys(script.jinx).length > 0 ? (
                    <JinxSection key="jinx" script={script} />
                ) : null;

            case 'secondPageRules':
                return script.secondPageRules && script.secondPageRules.length > 0 ? (
                    <StateRulesSection
                        key="secondPageRules"
                        rules={script.secondPageRules}
                        onDelete={readOnly ? () => { } : onSpecialRuleDelete}
                        onEdit={readOnly ? () => { } : onSpecialRuleEdit}
                    />
                ) : null;

            default:
                // 处理未知团队 (team_xxx)
                if (componentId.startsWith('team_')) {
                    const team = componentId.substring(5); // 移除 'team_' 前缀
                    return script.characters[team] && script.characters[team].length > 0 ? (
                        <CharacterSection
                            key={componentId}
                            team={team}
                            characters={script.characters[team]}
                            script={script}
                            onReorder={readOnly ? () => { } : onReorderCharacters}
                            onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                            onEditCharacter={readOnly ? () => { } : onEditCharacter}
                            onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                            onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                            disableDrag={readOnly}
                        />
                    ) : null;
                }
                return null;
        }
    }, [script, readOnly, onSecondPageTitleEdit, onReorderCharacters, onUpdateCharacter, onEditCharacter, onDeleteCharacter, onReplaceCharacter, onSpecialRuleEdit, onSpecialRuleDelete]);

    return (
        <>
            {/* 第一页 - 主要剧本内容 */}
            <Box
                id="script-preview"
                ref={scriptRef}
                sx={{
                    display: "flex",
                    userSelect: "none",
                    width: "100%",
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                        height: "100%",
                        justifyContent: "center",
                        position: 'relative',
                    }}
                >
                    {/* 装饰花纹 */}
                    <CharacterImage
                        src="/imgs/images/flower3_2.png"
                        alt="左下角装饰花纹"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: 2,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src="/imgs/images/flower4.png"
                        alt="右下角装饰花纹"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: 2,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src="/imgs/images/flower7.png"
                        alt="右上角装饰花纹"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: -5,
                            maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: 2,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src="/imgs/images/flower4_2.png"
                        alt="左上角装饰花纹"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transform: "rotate(180deg)",
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: 2,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />

                    {/* 美术设计盒子 - 仅在非只读模式下显示 */}
                    {!readOnly && (
                        <Box sx={{
                            position: 'absolute',
                            top: { xs: 12, sm: 16, md: 95 },
                            left: { xs: 12, sm: 16, md: 140 },
                            zIndex: 5,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            pointerEvents: 'none',
                        }}>
                            <Box
                                component="img"
                                src="/imgs/icons/fabled/onion.png"
                                alt="Onion Avatar"
                                sx={{
                                    width: { xs: 50, sm: 60, md: 70 },
                                    height: { xs: 50, sm: 60, md: 70 },
                                    borderRadius: '50%',
                                    border: '2px solid #d4af37',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                                    objectFit: 'cover',
                                    mb: { xs: -1, sm: -1.5, md: -2 },
                                    position: 'relative',
                                    zIndex: 2,
                                }}
                            />
                            <Box sx={{
                                pt: { xs: 1.5, sm: 2, md: 2.5 },
                                pb: { xs: 0.75, sm: 1, md: 1.25 },
                                position: 'relative',
                                zIndex: 1,
                                minWidth: { xs: '80px', sm: '90px', md: '100px' },
                            }}>
                                <Typography sx={{
                                    fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                                    color: '#404040ff',
                                    fontWeight: 700,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {t('credits.designTitle')}: {t('credits.designers')}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* 左侧 - 首个夜晚 */}
                    {!isMobile && (
                        <Box sx={{
                            padding: 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: '30%',
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 3,
                            }
                        }}>
                            <NightOrder
                                title={t('night.first')}
                                actions={script.firstnight}
                                disabled={readOnly || configStore.config.officialIdParseMode}
                                onReorder={(oldIndex, newIndex) => onNightOrderReorder('first', oldIndex, newIndex)}
                            />
                        </Box>
                    )}

                    {/* 中间 - 主要内容区域 */}
                    <Paper
                        id="main_script"
                        elevation={0}
                        sx={{
                            pt: 2,
                            flex: 1,
                            backgroundImage: 'url(/imgs/images/main_back.jpg)',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: 0,
                            position: 'relative',
                            boxShadow: 'none',
                        }}
                    >
                        {/* 标题区域 */}
                        <Box sx={{
                            textAlign: 'center',
                            mb: 0,
                            position: 'relative',
                            zIndex: 1,
                            px: { xs: 2, sm: 3, md: 4 },
                        }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    height: { xs: 'auto', md: uiConfigStore.titleHeight },
                                    width: '100%',
                                    minWidth: { xs: '300px', md: '500px' },
                                    display: { xs: 'flex', md: 'block' },
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: { xs: 'center', md: 'unset' },
                                    gap: { xs: 2, md: 0 },
                                    py: { xs: 2, md: 0 },
                                    '&::before': {
                                        content: '""',
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundImage: "url(/imgs/images/pattern.png)",
                                        backgroundSize: { xs: "80%", md: "48%" },
                                        backgroundPosition: "center",
                                        backgroundRepeat: "no-repeat",
                                        opacity: 0.6,
                                        zIndex: 0,
                                    },
                                }}
                            >
                                {/* 标题 */}
                                <Box
                                    sx={{
                                        position: { xs: 'relative', md: 'absolute' },
                                        top: { xs: 'auto', md: '50%' },
                                        left: { xs: 'auto', md: script?.specialRules && script.specialRules.length > 0 ? '33.33%' : '50%' },
                                        transform: { xs: 'none', md: 'translate(-50%, -50%)' },
                                        zIndex: 1,
                                        maxWidth: {
                                            xs: '100%',
                                            md: script?.specialRules && script.specialRules.length > 0 ? '32%' : '70%'
                                        },
                                        width: {
                                            xs: '100%',
                                            md: script?.specialRules && script.specialRules.length > 0 ? 'auto' : '100%'
                                        },
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    {script.useTitleImage && script.titleImage ? (
                                        <Box
                                            onMouseEnter={() => !readOnly && setTitleHovered(true)}
                                            onMouseLeave={() => !readOnly && setTitleHovered(false)}
                                            onDoubleClick={() => !readOnly && onTitleEdit()}
                                            sx={{
                                                position: 'relative',
                                                cursor: readOnly ? 'default' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                userSelect: 'none',
                                                width: '100%',
                                            }}
                                        >
                                            <CharacterImage
                                                src={script.titleImage}
                                                alt={script.title}
                                                sx={{
                                                    maxWidth: '100%',
                                                        maxHeight: { 
                                                            xs: `${(script.titleImageSize || 160) * 0.75}px`, 
                                                            sm: `${(script.titleImageSize || 160) * 0.875}px`, 
                                                            md: `${script.titleImageSize || 160}px` 
                                                        },
                                                    width: 'auto',
                                                    height: 'auto',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                            {!readOnly && titleHovered && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); onTitleEdit(); }}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }}
                                                        size="small"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    ) : (
                                        <Box
                                            onMouseEnter={() => !readOnly && setTitleHovered(true)}
                                            onMouseLeave={() => !readOnly && setTitleHovered(false)}
                                            onDoubleClick={() => !readOnly && onTitleEdit()}
                                            sx={{
                                                position: 'relative',
                                                cursor: readOnly ? 'default' : 'pointer',
                                                display: 'flex',
                                                padding: { xs: 1, sm: 1.5, md: 2 },
                                                borderRadius: 2,
                                                userSelect: 'none',
                                                width: '100%',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <Typography
                                                variant="h3"
                                                component="div"
                                                sx={{
                                                    fontFamily: uiConfigStore.scriptTitleFont,
                                                    fontWeight: 'bold',
                                                    fontSize: {
                                                        xs: uiConfigStore.titleFontSizeXs,
                                                        sm: uiConfigStore.titleFontSizeSm,
                                                        md: uiConfigStore.titleFontSizeMd
                                                    },
                                                    lineHeight: 1.38,
                                                    m: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    textAlign: 'center',
                                                    wordBreak: 'break-word',
                                                    background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                {script.title.split(/\\n|<br\s*\/?>/).map((line, index, array) => (
                                                    <span key={index}>{line}{index < array.length - 1 && <br />}</span>
                                                ))}
                                            </Typography>
                                            {!readOnly && titleHovered && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); onTitleEdit(); }}
                                                        sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: 'rgba(255,255,255,1)' } }}
                                                        size="small"
                                                    >
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            )}
                                        </Box>
                                    )}
                                </Box>

                                {/* 特殊规则 */}
                                {script?.specialRules && script.specialRules.length > 0 && (
                                    <Box sx={{
                                        position: { xs: 'relative', md: 'absolute' },
                                        top: { xs: 'auto', md: '50%' },
                                        left: { xs: 'auto', md: '66.67%' },
                                        transform: { xs: 'none', md: 'translate(-50%, -50%)' },
                                        zIndex: 1,
                                        overflow: 'hidden',
                                        width: { xs: '100%', md: 'auto' },
                                        maxWidth: { xs: '100%', md: '32%' },
                                    }}>
                                        <SpecialRulesSection
                                            rules={script.specialRules}
                                            onDelete={readOnly ? () => { } : onSpecialRuleDelete}
                                            onEdit={readOnly ? () => { } : onSpecialRuleEdit}
                                            isMobile={isMobile}
                                        />
                                    </Box>
                                )}
                            </Box>

                            {/* 标题下方作者与支持人数 */}
                            {(script?.author || script?.playerCount) && (
                                <Typography
                                    sx={{
                                        color: THEME_COLORS.paper.secondary,
                                        fontSize: { xs: '0.75rem', sm: '0.95rem' },
                                        mt: 0.5,
                                    }}
                                >
                                    {script.author ? `${t('script.author2')}：${script.author}` : ''}
                                    {script.author && script.playerCount ? ' · ' : ''}
                                    {script.playerCount ? `${t('script.playerCount')}：${script.playerCount}` : ''}
                                </Typography>
                            )}
                        </Box>

                        {/* 角色区域 */}
                        <Box sx={{ width: "100%" }}>
                            <Box sx={{ px: 3 }}>
                                {/* 按固定顺序显示标准团队 */}
                                {['townsfolk', 'outsider', 'minion', 'demon'].map(team => (
                                    script.characters[team] && script.characters[team].length > 0 && (
                                        <CharacterSection
                                            key={team}
                                            team={team}
                                            characters={script.characters[team]}
                                            script={script}
                                            onReorder={readOnly ? () => { } : onReorderCharacters}
                                            onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                                            onEditCharacter={readOnly ? () => { } : onEditCharacter}
                                            onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                                            onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                                            disableDrag={readOnly}
                                        />
                                    )
                                ))}

                                {/* 在非双页面模式下显示传奇和旅行者 */}
                                {!uiConfigStore.config.enableTwoPageMode && ['fabled', 'traveler'].map(team => (
                                    script.characters[team] && script.characters[team].length > 0 && (
                                        <CharacterSection
                                            key={team}
                                            team={team}
                                            characters={script.characters[team]}
                                            script={script}
                                            onReorder={readOnly ? () => { } : onReorderCharacters}
                                            onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                                            onEditCharacter={readOnly ? () => { } : onEditCharacter}
                                            onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                                            onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                                            disableDrag={readOnly}
                                        />
                                    )
                                ))}

                                {/* 显示所有未知团队（非双页面模式） */}
                                {!uiConfigStore.config.enableTwoPageMode && Object.keys(script.characters)
                                    .filter(team => !['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].includes(team))
                                    .map(team => (
                                        <CharacterSection
                                            key={team}
                                            team={team}
                                            characters={script.characters[team]}
                                            script={script}
                                            onReorder={readOnly ? () => { } : onReorderCharacters}
                                            onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                                            onEditCharacter={readOnly ? () => { } : onEditCharacter}
                                            onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                                            onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                                            disableDrag={readOnly}
                                        />
                                    ))
                                }
                            </Box>
                        </Box>

                        {/* 移动端夜晚行动顺序 */}
                        {isMobile && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1.5, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <NightOrder
                                        title={t('night.first')}
                                        actions={script.firstnight}
                                        isMobile={true}
                                        disabled={readOnly || configStore.config.officialIdParseMode}
                                        onReorder={(oldIndex, newIndex) => onNightOrderReorder('first', oldIndex, newIndex)}
                                    />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <NightOrder
                                        title={t('night.other')}
                                        actions={script.othernight}
                                        isMobile={true}
                                        disabled={readOnly || configStore.config.officialIdParseMode}
                                        onReorder={(oldIndex, newIndex) => onNightOrderReorder('other', oldIndex, newIndex)}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* 背景装饰 */}
                        <CharacterImage
                            component="img"
                            src={"/imgs/images/back_tower.png"}
                            alt={"back_tower"}
                            sx={{
                                position: "absolute",
                                left: "0%",
                                bottom: "0",
                                display: "flex",
                                width: "20%",
                                zIndex: 0,
                                opacity: 0.4,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            component="img"
                            src={"/imgs/images/back_tower2.png"}
                            alt={"back_tower2"}
                            sx={{
                                position: "absolute",
                                left: "36%",
                                bottom: "0%",
                                display: "flex",
                                width: "50%",
                                zIndex: 0,
                                opacity: 0.8,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />

                        <Box sx={{ height: "20vh" }}></Box>
                    </Paper>

                    {/* 右侧 - 其他夜晚 */}
                    {!isMobile && (
                        <Box sx={{
                            padding: 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: '30%',
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 3,
                            }
                        }}>
                            <NightOrder
                                title={t('night.other')}
                                actions={script?.othernight || []}
                                disabled={readOnly || configStore.config.officialIdParseMode}
                                onReorder={(oldIndex, newIndex) => onNightOrderReorder('other', oldIndex, newIndex)}
                            />
                        </Box>
                    )}
                </Box>
            </Box>

            {/* 第二页 - 双页面模式下显示相克规则、传奇、旅行者 */}
            {script && uiConfigStore.config.enableTwoPageMode && (
                <Box
                    id="script-preview-2"
                    sx={{
                        display: "flex",
                        width: "100%",
                        mt: 4,
                        '@media print': {
                            mt: 0,
                        }
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            width: "100%",
                            height: "100%",
                            minHeight: '100vh',
                            justifyContent: "center",
                            position: 'relative',
                            '@media print': {
                                height: '100vh !important',
                                minHeight: '100vh !important',
                            }
                        }}
                    >
                        {/* 装饰花纹 */}
                        <CharacterImage
                            src="/imgs/images/flower3_2.png"
                            alt="左下角装饰花纹"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: 2,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src="/imgs/images/flower4.png"
                            alt="右下角装饰花纹"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: 2,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src="/imgs/images/flower7.png"
                            alt="右上角装饰花纹"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: -5,
                                maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: 2,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src="/imgs/images/flower4_2.png"
                            alt="左上角装饰花纹"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                transform: "rotate(180deg)",
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: 2,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />

                        {/* 左侧占位 */}
                        {!isMobile && (
                            <Box sx={{
                                padding: 1.5,
                                flexShrink: 0,
                                position: 'relative',
                                backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                width: '200px',
                                boxShadow: 'none',
                            }}>
                            </Box>
                        )}

                        {/* 中间 - 第二页内容区域 */}
                        <Paper
                            elevation={0}
                            sx={{
                                pt: 2,
                                flex: 1,
                                backgroundImage: 'url(/imgs/images/main_back.jpg)',
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                borderRadius: 0,
                                position: 'relative',
                                boxShadow: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100vh',
                                '@media print': {
                                    height: '100vh !important',
                                    minHeight: '100vh !important',
                                }
                            }}
                        >
                            {/* 第二页可配置组件区域 - 使用拖拽排序 */}
                            <DndContext
                                sensors={secondPageSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleSecondPageDragEnd}
                            >
                                <SortableContext
                                    items={secondPageComponentOrder}
                                    strategy={verticalListSortingStrategy}
                                >
                            <Box sx={{
                                position: 'relative',
                                zIndex: 1,
                                px: { xs: 2, sm: 3, md: 4 },
                                        pt: { xs: 2, sm: 3, md: 4 },
                                    }}>
                                        {secondPageComponentOrder.map((componentId) => {
                                            const component = renderSecondPageComponent(componentId);
                                            return component ? (
                                                <SecondPageSortableItem key={componentId} id={componentId} disabled={readOnly}>
                                                    {component}
                                                </SecondPageSortableItem>
                                            ) : null;
                                        })}

                                        {/* 添加组件按钮（仅编辑模式） */}
                                        {!readOnly && (
                                            <SecondPageAddButton
                                                onAddComponent={(componentType) => {
                                                    if (componentType === 'title' || componentType === 'ppl_table1' || componentType === 'ppl_table2') {
                                                        scriptStore.addSecondPageComponent(componentType);
                                                    }
                                                }}
                                    />
                                )}

                                {/* 背景装饰 */}
                                <CharacterImage
                                    component="img"
                                    src={"/imgs/images/back_tower.png"}
                                    alt={"back_tower"}
                                    sx={{
                                        position: "absolute",
                                        left: "0%",
                                        bottom: "0",
                                        display: "flex",
                                        width: "20%",
                                        zIndex: -1,
                                        opacity: 0.4,
                                        userSelect: 'none',
                                        WebkitUserDrag: 'none',
                                                pointerEvents: 'none',
                                    }}
                                />
                                <CharacterImage
                                    component="img"
                                    src={"/imgs/images/back_tower2.png"}
                                    alt={"back_tower2"}
                                    sx={{
                                        position: "absolute",
                                        left: "36%",
                                        bottom: "0%",
                                        display: "flex",
                                        width: "50%",
                                        zIndex: -1,
                                        opacity: 0.8,
                                        userSelect: 'none',
                                        WebkitUserDrag: 'none',
                                                pointerEvents: 'none',
                                    }}
                                />
                            </Box>
                                </SortableContext>
                            </DndContext>
                        </Paper>

                        {/* 右侧占位 */}
                        {!isMobile && (
                            <Box sx={{
                                padding: 1.5,
                                flexShrink: 0,
                                position: 'relative',
                                backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                width: '200px',
                                boxShadow: 'none',
                            }}>
                            </Box>
                        )}
                    </Box>
                </Box>
            )}
        </>
    );
});

export default ScriptRenderer;