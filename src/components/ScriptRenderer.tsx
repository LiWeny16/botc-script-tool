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
import StorytellerNightOrderSheet from './StorytellerNightOrderSheet';
import EditablePageTitle from './EditablePageTitle';


const backgroundIndex = 2
export interface ScriptRendererProps {
    script: Script;
    theme: any; // MUI theme

    // 编辑模式配置
    readOnly?: boolean; // 是否只读模式
    compact?: boolean;  // 超紧凑模式（全角色一览）

    // 事件回调（编辑模式下使用）
    onReorderCharacters?: (team: string, newOrder: string[], columnLeftCount?: number) => void;
    onUpdateCharacter?: (characterId: string, updates: Partial<Character>) => void;
    onEditCharacter?: (character: Character) => void;
    onDeleteCharacter?: (character: Character) => void;
    onReplaceCharacter?: (character: Character, position: { x: number; y: number }) => void;
    onAddCustomCharacter?: (team: string) => void;
    onTitleEdit?: (mode: 'main' | 'firstNight' | 'otherNight') => void;
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
    compact = false,
    onReorderCharacters = () => { },
    onUpdateCharacter = () => { },
    onEditCharacter = () => { },
    onDeleteCharacter = () => { },
    onReplaceCharacter = () => { },
    onAddCustomCharacter,
    onTitleEdit = () => { },
    onSecondPageTitleEdit = () => { },
    onSpecialRuleEdit = () => { },
    onSpecialRuleDelete = () => { },
    onNightOrderReorder = () => { },
    

}: ScriptRendererProps) => {
    const COMPACT_SCALE = compact ? 0.47 : 1;
    const { t, language } = useTranslation();
    const scriptRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [titleHovered, setTitleHovered] = useState<boolean>(false);

    // 按语言选择展示标题：英文优先使用 titleEn；否则回退到第二页标题文本或主标题
    const displayedTitle = useMemo(() => {
        const titleEn = (script as any).titleEn as string | undefined;
        const base = script.secondPageTitleText || script.title;
        if (language !== 'cn' && titleEn && titleEn.trim()) return titleEn.trim();
        return base;
    }, [language, script]);
    const allCharacters = useMemo<Character[]>(() => {
        return Object.values(script.characters).flat();
    }, [script.characters]);
    // 第二页拖拽传感器
    const secondPageSensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: readOnly ? { distance: 999999 } : { distance: 5 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const displayedFirstNightTitle =
        script.storytellerFirstNight || t('firstNight');

    const displayedOtherNightTitle =
        script.storytellerOtherNight || t('otherNight');
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
        // 传奇、奇遇和旅行者
        if (script.characters.fabled && script.characters.fabled.length > 0) components.push('fabled');
        if (script.characters.loric && script.characters.loric.length > 0) components.push('loric');
        if (script.characters.traveler && script.characters.traveler.length > 0) components.push('traveler');
        // 未知团队
        Object.keys(script.characters)
            .filter(team => !['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'loric', 'traveler'].includes(team))
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
                        src={"/imgs/images/sources/back_4.png"}
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
                        title={displayedTitle}
                        titleImage={script.secondPageTitleImage}
                        useImage={script.useSecondPageTitleImage}
                        fontSize={script.secondPageTitleFontSize ?? '5.3rem'}
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
                        onAddCustomCharacter={onAddCustomCharacter}
                        disableDrag={readOnly}
                        readOnly={readOnly}
                    />
                ) : null;

            case 'loric':
                return script.characters.loric && script.characters.loric.length > 0 ? (
                    <CharacterSection
                        key="loric"
                        team="loric"
                        characters={script.characters.loric}
                        script={script}
                        onReorder={readOnly ? () => { } : onReorderCharacters}
                        onUpdateCharacter={readOnly ? () => { } : onUpdateCharacter}
                        onEditCharacter={readOnly ? () => { } : onEditCharacter}
                        onDeleteCharacter={readOnly ? () => { } : onDeleteCharacter}
                        onReplaceCharacter={readOnly ? () => { } : onReplaceCharacter}
                        onAddCustomCharacter={onAddCustomCharacter}
                        disableDrag={readOnly}
                        readOnly={readOnly}
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
                        onAddCustomCharacter={onAddCustomCharacter}
                        disableDrag={readOnly}
                        readOnly={readOnly}
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
                            onAddCustomCharacter={onAddCustomCharacter}
                            disableDrag={readOnly}
                            readOnly={readOnly}
                        />
                    ) : null;
                }
                return null;
        }
    }, [script, readOnly, onSecondPageTitleEdit, onTitleEdit, onReorderCharacters, onUpdateCharacter, onEditCharacter, onDeleteCharacter, onReplaceCharacter, onAddCustomCharacter, onSpecialRuleEdit, onSpecialRuleDelete]);
    
    return (
        <>
            {/* 第一页 - 主要剧本内容 */}
            <Paper
                id="script-preview"
                ref={scriptRef}
                elevation={16}
                sx={{
                    '@media print': {
                        boxShadow: 'none !important',
                        height: '100vh !important',
                        minHeight: '100vh !important',
                    },
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
                    {/* 装饰花纹（紧凑模式隐藏） */}
                    {!compact && (() => {
                      const cf = uiConfigStore.cornerFlowers;
                      const blSrc = cf?.bl || '/imgs/images/sources/flowers/flower3_2.png';
                      const brSrc = cf?.br || '/imgs/images/sources/flowers/flower4.png';
                      const trSrc = cf?.tr || '/imgs/images/sources/flowers/flower7.png';
                      const tlSrc = cf?.tl || '/imgs/images/sources/flowers/flower4_2.png';
                      const blTransform = cf ? 'scaleX(-1)' : 'none';
                      const tlTransform = cf ? 'scaleX(-1) scaleY(-1)' : 'rotate(180deg)';
                      return <>
                    <CharacterImage
                        src={blSrc}
                        alt="左下角装饰花纹"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            transform: blTransform,
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: backgroundIndex,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src={brSrc}
                        alt="右下角装饰花纹"
                        sx={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: backgroundIndex,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src={trSrc}
                        alt="右上角装饰花纹"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: backgroundIndex,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    <CharacterImage
                        src={tlSrc}
                        alt="左上角装饰花纹"
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            transform: tlTransform,
                            maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                            opacity: 1,
                            pointerEvents: 'none',
                            zIndex: backgroundIndex,
                            userSelect: 'none',
                            WebkitUserDrag: 'none',
                        }}
                    />
                    </>})()}

                    {/* 左侧 - 首个夜晚 */}
                    {!isMobile && (
                        <Box id="night-order-left" sx={{
                            padding: compact ? 0.3 : 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: compact ? '2%' : (uiConfigStore.config.nightOrderTopSpacingAuto ? '25%' : `${uiConfigStore.config.nightOrderTopSpacing}vh`),
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 1,
                            }
                        }}>
                            <NightOrder
                                title={t('firstNight')}
                                actions={script.firstnight}
                                disabled={readOnly || configStore.config.officialIdParseMode}
                                onReorder={(oldIndex, newIndex) => onNightOrderReorder('first', oldIndex, newIndex)}
                                compact={compact}
                            />
                        </Box>
                    )}

                    {/* 中间 - 主要内容区域 */}
                    <Paper
                        id="main_script"
                        elevation={0}
                        sx={{
                            pt: compact ? 0 : 2,
                            flex: 1,
                            backgroundImage: compact ? 'none' : `url(${uiConfigStore.mainBackgroundUrl})`,
                            backgroundColor: compact ? '#EDE4D5' : 'transparent',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'top center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: 0,
                            zIndex: 1,
                            position: 'relative',
                            boxShadow: 'none',
                        }}
                    >
                        {/* 标题区域 */}
                        <Box sx={{
                            textAlign: 'center',
                            mb: 0,
                            mt: compact ? 0.3 : 8,
                            position: 'relative',
                            zIndex: 1,
                            px: { xs: 2, sm: 3, md: 4 },
                        }}>
                            <Box
                                sx={{
                                    position: 'relative',
                                    height: { xs: 'auto', md: compact ? 90 : uiConfigStore.titleHeight },
                                    width: '100%',
                                    minWidth: { xs: '300px', md: '500px' },
                                    display: { xs: 'flex', md: 'block' },
                                    flexDirection: { xs: 'column', md: 'row' },
                                    alignItems: { xs: 'center', md: 'unset' },
                                    gap: { xs: 2, md: 0 },
                                    py: { xs: compact ? 0.5 : 2, md: 0 },
                                    '&::before': (compact || scriptStore.script?.showTitleFlourish === false) ? { display: 'none' } : {
                                        content: '""',
                                        position: 'absolute',
                                        top: '50%',
                                        left: script?.specialRules && script.specialRules.length > 0 ? '33.33%' : '50%',
                                        transform: 'translate(-50%, -50%)',
                                        width: { xs: "80%", md: "48%" },
                                        height: '100%',
                                        backgroundImage: "url(/imgs/images/sources/pattern.png)",
                                        backgroundSize: 'contain',
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
                                        justifyContent: (script as any).textAlignment === 'left' ? 'flex-start' : (script as any).textAlignment === 'right' ? 'flex-end' : 'center',
                                    }}
                                >
                                    {script.useTitleImage && script.titleImage ? (
                                        <Box
                                            onMouseEnter={() => !readOnly && setTitleHovered(true)}
                                            onMouseLeave={() => !readOnly && setTitleHovered(false)}
                                            onDoubleClick={() => !readOnly && onTitleEdit?.('main')}
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
                                                alt={displayedTitle}
                                                sx={{
                                                    maxWidth: '100%',
                                                    maxHeight: {
                                                        xs: `${(script.titleImageSize || 160) * 0.75 * COMPACT_SCALE}px`,
                                                        sm: `${(script.titleImageSize || 160) * 0.875 * COMPACT_SCALE}px`,
                                                        md: `${(script.titleImageSize || 160) * COMPACT_SCALE}px`
                                                    },
                                                    width: 'auto',
                                                    height: 'auto',
                                                    objectFit: 'contain',
                                                }}
                                            />
                                            {!readOnly && titleHovered && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); onTitleEdit?.('main'); }}
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
                                            onDoubleClick={() => !readOnly && onTitleEdit?.('main')}
                                            sx={{

                                                position: 'relative',
                                                cursor: readOnly ? 'default' : 'pointer',
                                                display: 'flex',
                                                padding: { xs: 1, sm: 1.5, md: 2 },
                                                borderRadius: 2,
                                                userSelect: 'none',
                                                width: '100%',
                                                justifyContent: (script as any).textAlignment === 'left' ? 'flex-start' : (script as any).textAlignment === 'right' ? 'flex-end' : 'center'
                                            }}
                                        >
                                            <Typography
                                                variant="h3"
                                                component="div"
                                                sx={{
                                                    fontFamily: uiConfigStore.scriptTitleFont,
                                                    fontWeight: 'bold',
                                                    fontSize: compact
                                                        ? { xs: '1.1rem', sm: '1.4rem', md: '1.6rem' }
                                                        : {
                                                            xs: `${2.3 * COMPACT_SCALE}rem`,
                                                            sm: `${3.4 * COMPACT_SCALE}rem`,
                                                            md: `calc(${uiConfigStore.titleFontSizeMd} * ${COMPACT_SCALE})`
                                                          },
                                                    lineHeight: 1.38,
                                                    m: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    textAlign: (script as any).textAlignment || 'center',
                                                    wordBreak: 'break-word',
                                                    background: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                    backgroundClip: 'text',
                                                    WebkitBackgroundClip: 'text',
                                                    WebkitTextFillColor: 'transparent',
                                                }}
                                            >
                                                {displayedTitle.split(/\n|<br\s*\/?>(?=)/).map((line, index, array) => (
                                                    <span key={index}>{line}{index < array.length - 1 && <br />}</span>
                                                ))}
                                            </Typography>
                                            {!readOnly && titleHovered && (
                                                <Box sx={{ position: 'absolute', top: 8, right: 8, zIndex: 3, display: 'flex', gap: 1 }}>
                                                    <IconButton
                                                        onClick={(e) => { e.stopPropagation(); onTitleEdit?.('main'); }}
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

                                {/* Description + Author credit in compact mode */}
                                {compact && (
                                  <>
                                    {/* Left: special mode description */}
                                    <Box sx={{
                                      position: 'absolute',
                                      left: { xs: '1%', md: '2%' },
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      zIndex: 1,
                                      maxWidth: { xs: '42%', md: '30%' },
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: { xs: 0.5, md: 0.8 },
                                      px: { xs: 0.8, md: 1.2 },
                                      py: { xs: 0.4, md: 0.6 },
                                      backgroundColor: 'rgba(255,255,255,0.55)',
                                      borderLeft: '3px solid #d4af37',
                                      borderRadius: '0 6px 6px 0',
                                    }}>
                                      <Box
                                        component="img"
                                        src="/imgs/icons/fabled/bootlegger2.png"
                                        alt="Bootlegger"
                                        sx={{
                                          width: { xs: 20, sm: 22, md: 26 },
                                          height: { xs: 20, sm: 22, md: 26 },
                                          flexShrink: 0,
                                          objectFit: 'contain',
                                        }}
                                      />
                                      <Typography sx={{
                                        fontFamily: uiConfigStore.scriptTitleFont,
                                        fontWeight: 600,
                                        color: '#3a3a3a',
                                        fontSize: { xs: '0.42rem', sm: '0.48rem', md: '0.55rem' },
                                        lineHeight: 1.5,
                                      }}>
                                        {t('allChars.description')}
                                      </Typography>
                                    </Box>

                                    {/* Right: author + icon */}
                                    <Box sx={{
                                      position: 'absolute',
                                      right: '3%',
                                      top: '50%',
                                      transform: 'translateY(-50%)',
                                      zIndex: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 0.8,
                                    }}>
                                      <Box
                                        component="img"
                                        src="/imgs/icons/fabled/onion.webp"
                                        alt="Onion"
                                        sx={{
                                          width: { xs: 24, sm: 28, md: 32 },
                                          height: { xs: 24, sm: 28, md: 32 },
                                          borderRadius: '50%',
                                          border: '2px solid #d4af37',
                                          objectFit: 'cover',
                                          flexShrink: 0,
                                        }}
                                      />
                                      <Typography sx={{
                                        fontFamily: uiConfigStore.scriptTitleFont,
                                        fontWeight: 700,
                                        color: '#000',
                                        fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.65rem' },
                                        whiteSpace: 'nowrap',
                                      }}>
                                        Author &amp; Design: Onion
                                      </Typography>
                                    </Box>
                                  </>
                                )}
                            </Box>

                            {/* 标题下方作者与支持人数 */}
                            {(script?.author || script?.playerCount) && (
                                <Typography
                                    sx={{
                                        color: THEME_COLORS.paper.secondary,
                                        fontSize: { xs: '0.75rem', sm: '0.95rem' },
                                        mt: 0.5,
                                        textAlign: (script as any).textAlignment || 'center',
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
                            <Box sx={{ px: compact ? 0.5 : 3 }}>
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
                                            onAddCustomCharacter={onAddCustomCharacter}
                                            disableDrag={readOnly}
                                            readOnly={readOnly}
                                            compact={compact}
                                        />
                                    )
                                ))}

                                {/* 在非双页面模式下显示传奇和旅行者 */}
                                {!uiConfigStore.config.enableTwoPageMode && !compact && ['fabled', 'traveler'].map(team => (
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
                                            onAddCustomCharacter={onAddCustomCharacter}
                                            disableDrag={readOnly}
                                            readOnly={readOnly}
                                            compact={compact}
                                        />
                                    )
                                ))}

                                {/* 显示所有未知团队（非双页面模式） */}
                                {!uiConfigStore.config.enableTwoPageMode && !compact && Object.keys(script.characters)
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
                                            onAddCustomCharacter={onAddCustomCharacter}
                                            disableDrag={readOnly}
                                            readOnly={readOnly}
                                            compact={compact}
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
                                        title={t('firstNight')}
                                        actions={script.firstnight}
                                        isMobile={true}
                                        disabled={readOnly || configStore.config.officialIdParseMode}
                                        onReorder={(oldIndex, newIndex) => onNightOrderReorder('first', oldIndex, newIndex)}
                                        compact={compact}
                                    />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <NightOrder
                                        title={t('otherNight')}
                                        actions={script.othernight}
                                        isMobile={true}
                                        disabled={readOnly || configStore.config.officialIdParseMode}
                                        onReorder={(oldIndex, newIndex) => onNightOrderReorder('other', oldIndex, newIndex)}
                                        compact={compact}
                                    />
                                </Box>
                            </Box>
                        )}

                        {/* 超紧凑模式：旅行者 + 相克规则（换页） */}
                        {compact && (
                            <Paper id="script-preview-2" elevation={0} sx={{
                                mt: 2,
                                p: 1,
                                backgroundColor: 'transparent',
                                width: '100%',
                                '@media print': {
                                    pageBreakBefore: 'always',
                                    printColorAdjust: 'exact',
                                    WebkitPrintColorAdjust: 'exact',
                                },
                            }}>
                                {script.characters.traveler && script.characters.traveler.length > 0 && (
                                    <CharacterSection
                                        team="traveler"
                                        characters={script.characters.traveler}
                                        script={script}
                                        onReorder={() => {}}
                                        disableDrag={true}
                                        readOnly={true}
                                        compact={compact}
                                    />
                                )}
                                <JinxSection script={script} compact={true} />
                            </Paper>
                        )}

                        {/* 背景装饰（紧凑模式隐藏） */}
                        {!compact && <>
                        {uiConfigStore.config.theme === 'sakura' ? (
                          <CharacterImage
                            component="img"
                            src="/imgs/images/background/back_cherry.jpg"
                            alt="back_cherry"
                            sx={{
                              position: "absolute",
                              left: "0%",
                              bottom: "0",
                              width: "100%",
                              zIndex: backgroundIndex,
                              opacity: 0.5,
                              userSelect: 'none',
                              WebkitUserDrag: 'none',
                            }}
                          />
                        ) : (
                          <>
                        <CharacterImage
                            component="img"
                            src={"/imgs/images/background/back_tower.png"}
                            alt={"back_tower"}
                            sx={{
                                position: "absolute",
                                left: "0%",
                                bottom: "0",
                                display: "flex",
                                width: "20%",
                                zIndex: backgroundIndex,
                                opacity: 0.4,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            component="img"
                            src={"/imgs/images/background/back_tower2.png"}
                            alt={"back_tower2"}
                            sx={{
                                position: "absolute",
                                left: "36%",
                                bottom: "0%",
                                display: "flex",
                                width: "50%",
                                zIndex: backgroundIndex,
                                opacity: 0.8,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                          </>
                        )}
                        </>}

                        <Box sx={{ height: compact ? "5vh" : "20vh" }}></Box>
                    </Paper>

                    {/* 右侧 - 其他夜晚 */}
                    {!isMobile && (
                        <Box id="night-order-right" sx={{
                            padding: compact ? 0.3 : 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: compact ? '2%' : (uiConfigStore.config.nightOrderTopSpacingAuto ? '25%' : `${uiConfigStore.config.nightOrderTopSpacing}vh`),
                            zIndex: 1,
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 1,
                            }
                        }}>
                            <NightOrder
                                title={t('otherNight')}
                                actions={script?.othernight || []}
                                disabled={readOnly || configStore.config.officialIdParseMode}
                                onReorder={(oldIndex, newIndex) => onNightOrderReorder('other', oldIndex, newIndex)}
                                compact={compact}
                            />
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* 第二页 - 双页面模式下显示相克规则、传奇、旅行者 */}
            {script && uiConfigStore.config.enableTwoPageMode && !compact && (
                <Paper
                    elevation={16}
                    id="script-preview-2"
                    sx={{
                        display: "flex",
                        zIndex: 1,
                        mt: 5,
                        mb: 5,
                        width: "100%",
                        '@media print': {
                            mt: 0,
                            boxShadow: 'none !important',
                            height: '100vh !important',
                            minHeight: '100vh !important',
                        },
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
                        {(() => {
                          const cf = uiConfigStore.cornerFlowers;
                          const blSrc = cf?.bl || '/imgs/images/sources/flowers/flower3_2.png';
                          const brSrc = cf?.br || '/imgs/images/sources/flowers/flower4.png';
                          const trSrc = cf?.tr || '/imgs/images/sources/flowers/flower7.png';
                          const tlSrc = cf?.tl || '/imgs/images/sources/flowers/flower4_2.png';
                          const blTransform = cf ? 'scaleX(-1)' : 'none';
                          const tlTransform = cf ? 'scaleX(-1) scaleY(-1)' : 'rotate(180deg)';
                          return <>
                        <CharacterImage
                            src={blSrc}
                            alt="左下角装饰花纹"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                transform: blTransform,
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: backgroundIndex,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src={brSrc}
                            alt="右下角装饰花纹"
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                right: 0,
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: backgroundIndex,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src={trSrc}
                            alt="右上角装饰花纹"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: backgroundIndex,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        <CharacterImage
                            src={tlSrc}
                            alt="左上角装饰花纹"
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                transform: tlTransform,
                                maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                opacity: 1,
                                pointerEvents: 'none',
                                zIndex: backgroundIndex,
                                userSelect: 'none',
                                WebkitUserDrag: 'none',
                            }}
                        />
                        </>})()}

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
                                backgroundImage: `url(${uiConfigStore.mainBackgroundUrl})`,
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                                backgroundRepeat: 'no-repeat',
                                borderRadius: 0,
                                position: 'relative',
                                boxShadow: 'none',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'stretch',
                                justifyContent: 'flex-start',
                                minHeight: '100vh',
                                minWidth: 0,
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
                                    </Box>
                                </SortableContext>
                            </DndContext>

                            {/* 背景装饰 - 放在 Paper 容器内，DndContext 外 */}
                            {uiConfigStore.config.theme === 'sakura' ? (
                              <CharacterImage
                                component="img"
                                src="/imgs/images/background/back_cherry.jpg"
                                alt="back_cherry"
                                sx={{
                                  position: "absolute",
                                  left: "0%",
                                  bottom: "0",
                                  width: "100%",
                                  zIndex: backgroundIndex,
                                  opacity: 0.5,
                                  userSelect: 'none',
                                  WebkitUserDrag: 'none',
                                  pointerEvents: 'none',
                                }}
                              />
                            ) : (
                              <>
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower.png"}
                                alt={"back_tower"}
                                sx={{
                                    position: "absolute",
                                    left: "0%",
                                    bottom: "0",
                                    display: "flex",
                                    width: "20%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.4,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower2.png"}
                                alt={"back_tower2"}
                                sx={{
                                    position: "absolute",
                                    left: "36%",
                                    bottom: "0%",
                                    display: "flex",
                                    width: "50%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.8,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                              </>
                            )}
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
                </Paper>
            )}
            {/* PAGE 3 */}
            {uiConfigStore.config.enableStorytellerNightOrderSheet && (
            <Paper
                elevation={16}
                id="script-preview-3"
                sx={{
                    display: "flex",
                    zIndex: 1,
                    mt: 5,
                    mb: 5,
                    width: "100%",
                    '@media print': {
                        mt: 0,
                        boxShadow: 'none !important',
                        height: '100vh !important',
                        minHeight: '100vh !important',
                    },
                }}
            >
                <Box
                    sx={{
                        display: "flex",
                        width: "100%",
                        minHeight: '100vh',
                        justifyContent: "center",
                        position: 'relative',
                    }}
                >

                    {/* Corner flowers */}
                    {(() => {
                        const cf = uiConfigStore.cornerFlowers;
                        const blSrc = cf?.bl || '/imgs/images/sources/flowers/flower3_2.png';
                        const brSrc = cf?.br || '/imgs/images/sources/flowers/flower4.png';
                        const trSrc = cf?.tr || '/imgs/images/sources/flowers/flower7.png';
                        const tlSrc = cf?.tl || '/imgs/images/sources/flowers/flower4_2.png';

                        const blTransform = cf ? 'scaleX(-1)' : 'none';
                        const tlTransform = cf ? 'scaleX(-1) scaleY(-1)' : 'rotate(180deg)';

                        return (
                        <>
                            <CharacterImage
                                src={blSrc}
                                alt="左下角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    transform: blTransform,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={brSrc}
                                alt="右下角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={trSrc}
                                alt="右上角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={tlSrc}
                                alt="左上角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    transform: tlTransform,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />
                            {uiConfigStore.config.theme === 'sakura' ? (
                              <CharacterImage
                                component="img"
                                src="/imgs/images/background/back_cherry.jpg"
                                alt="back_cherry"
                                sx={{
                                  position: "absolute",
                                  left: "0%",
                                  bottom: "0",
                                  width: "100%",
                                  zIndex: backgroundIndex,
                                  opacity: 0.5,
                                  userSelect: 'none',
                                  WebkitUserDrag: 'none',
                                  pointerEvents: 'none',
                                }}
                              />
                            ) : (
                              <>
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower.png"}
                                alt={"back_tower"}
                                sx={{
                                    position: "absolute",
                                    left: "0%",
                                    bottom: "0",
                                    display: "flex",
                                    width: "20%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.4,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower2.png"}
                                alt={"back_tower2"}
                                sx={{
                                    position: "absolute",
                                    left: "36%",
                                    bottom: "0%",
                                    display: "flex",
                                    width: "50%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.8,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                              </>
                            )}
                        </>
                        );
                    })()}

                    {/* linker Rand */}
                    {!isMobile && (
                        <Box
                            sx={{
                                padding: 1.5,
                                flexShrink: 0,
                                position: 'relative',
                                backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                width: '75px',
                                boxShadow: 'none',
                            }}
                        />
                    )}

                    {/* Mittlere Seite */}
                    <Paper
                        elevation={0}
                        sx={{
                            flex: 1,
                            minHeight: '100vh',
                            backgroundImage: `url(${uiConfigStore.mainBackgroundUrl})`,
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: 0,
                            position: 'relative',
                            boxShadow: 'none',
                        }}
                    >
                        
                        <EditablePageTitle
                            title={displayedFirstNightTitle}
                            titleImage={script.storytellerFirstNightTitleImage}
                            useImage={script.useStorytellerFirstNightTitleImage}
                            imageSize={script.storytellerFirstNightTitleImageSize}
                            fontSize={script.storytellerFirstNightTitleFontSize}
                            readOnly={readOnly}
                            onEdit={() => onTitleEdit?.('firstNight')}
                            />
                        <Box
                            sx={{
                                mt: `${uiConfigStore.config.storytellerNightSheet.titleContentSpacing}px`,
                            }}
                            >
                            <StorytellerNightOrderSheet
                                characters={allCharacters}
                                mode="firstNight"
                            />
                            </Box>
                        <Box sx={{ pt: '2rem', pb: '4vh', px: '20px' }}>
                            <JinxSection key="jinx" script={script} />
                        </Box>
                    </Paper>

                    {/* rechter Rand */}
                    {!isMobile && (
                        <Box
                            sx={{
                                padding: 1.5,
                                flexShrink: 0,
                                position: 'relative',
                                backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                                width: '75px',
                                boxShadow: 'none',
                            }}
                        />
                    )}
                </Box>
            </Paper>
            )}
            {/* PAGE 4 */}
            {uiConfigStore.config.enableStorytellerNightOrderSheet && (
            <Paper
                elevation={16}
                id="script-preview-4"
                sx={{
                display: "flex",
                zIndex: 1,
                mt: 5,
                mb: 5,
                width: "100%",
                '@media print': {
                    mt: 0,
                    boxShadow: 'none !important',
                    height: '100vh !important',
                    minHeight: '100vh !important',
                },
                }}
            >
                <Box
                sx={{
                    display: "flex",
                    width: "100%",
                    minHeight: "100vh",
                    justifyContent: "center",
                    position: "relative",
                }}
                >


                {/* Corner flowers */}
                {(() => {
                    const cf = uiConfigStore.cornerFlowers;
                    const blSrc = cf?.bl || '/imgs/images/sources/flowers/flower3_2.png';
                    const brSrc = cf?.br || '/imgs/images/sources/flowers/flower4.png';
                    const trSrc = cf?.tr || '/imgs/images/sources/flowers/flower7.png';
                    const tlSrc = cf?.tl || '/imgs/images/sources/flowers/flower4_2.png';

                    const blTransform = cf ? 'scaleX(-1)' : 'none';
                    const tlTransform = cf ? 'scaleX(-1) scaleY(-1)' : 'rotate(180deg)';
                    

                    return (
                        <>
                            <CharacterImage
                                src={blSrc}
                                alt="左下角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    transform: blTransform,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={brSrc}
                                alt="右下角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    bottom: 0,
                                    right: 0,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={trSrc}
                                alt="右上角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    maxWidth: { xs: '35%', sm: '20%', md: '20%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />

                            <CharacterImage
                                src={tlSrc}
                                alt="左上角装饰花纹"
                                sx={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    transform: tlTransform,
                                    maxWidth: { xs: '25%', sm: '20%', md: '15%' },
                                    opacity: 1,
                                    pointerEvents: 'none',
                                    zIndex: backgroundIndex,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />
                            {uiConfigStore.config.theme === 'sakura' ? (
                              <CharacterImage
                                component="img"
                                src="/imgs/images/background/back_cherry.jpg"
                                alt="back_cherry"
                                sx={{
                                  position: "absolute",
                                  left: "0%",
                                  bottom: "0",
                                  width: "100%",
                                  zIndex: backgroundIndex,
                                  opacity: 0.5,
                                  userSelect: 'none',
                                  WebkitUserDrag: 'none',
                                  pointerEvents: 'none',
                                }}
                              />
                            ) : (
                              <>
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower.png"}
                                alt={"back_tower"}
                                sx={{
                                    position: "absolute",
                                    left: "0%",
                                    bottom: "0",
                                    display: "flex",
                                    width: "20%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.4,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                            <CharacterImage
                                component="img"
                                src={"/imgs/images/background/back_tower2.png"}
                                alt={"back_tower2"}
                                sx={{
                                    position: "absolute",
                                    left: "36%",
                                    bottom: "0%",
                                    display: "flex",
                                    width: "50%",
                                    zIndex: backgroundIndex,
                                    opacity: 0.8,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                    pointerEvents: 'none',
                                }}
                            />
                              </>
                            )}
                        </>
                        );
                })()}

                {/* linker Rand */}
                {!isMobile && (
                    <Box
                    sx={{
                        padding: 1.5,
                        flexShrink: 0,
                        position: 'relative',
                        backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                        width: '75px',
                        boxShadow: 'none',
                    }}
                    />
                )}

                {/* Mitte */}
                <Paper
                    elevation={0}
                    sx={{
                    flex: 1,
                    minHeight: '100vh',
                    backgroundImage: `url(${uiConfigStore.mainBackgroundUrl})`,
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    borderRadius: 0,
                    position: 'relative',
                    boxShadow: 'none',
                    }}
                >
                    <EditablePageTitle
                        title = {displayedOtherNightTitle}
                        titleImage={script.storytellerOtherNightTitleImage}
                        useImage={script.useStorytellerOtherNightTitleImage}
                        imageSize={script.storytellerOtherNightTitleImageSize}
                        fontSize={script.storytellerOtherNightTitleFontSize}
                        readOnly={readOnly}
                        onEdit={() => onTitleEdit?.('otherNight')}
                    />
                    
                    <Box
                        sx={{
                            mt: `${uiConfigStore.config.storytellerNightSheet.titleContentSpacing}px`,
                        }}
                        >
                        <StorytellerNightOrderSheet
                            characters={allCharacters}
                            mode="otherNight"
                        />
                    </Box>
                    <Box sx={{ pt: '2rem', pb: '4vh', px: '20px' }}>
                        <JinxSection key="jinx" script={script} />
                    </Box>
                </Paper>

                {/* rechter Rand */}
                {!isMobile && (
                    <Box
                        sx={{
                            padding: 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            width: '75px',
                            boxShadow: 'none',
                        }}
                    />
                )}
                </Box>
            </Paper>
            )}
        </>
    );
});

export default ScriptRenderer;
