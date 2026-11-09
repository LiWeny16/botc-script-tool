import { memo, useRef, useState, useMemo, useCallback, useEffect } from 'react';
import { Box, Paper, Typography, Menu, MenuItem, useMediaQuery } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { Script, Character, FooterComponent, RichTextDocument, SecondPageComponentType } from '../types';
import CharacterSection from './CharacterSection';
import NightOrder from './NightOrder';
import SpecialRulesSection from './SpecialRulesSection';
import { useHeaderLayoutDrag } from './useHeaderLayoutDrag';
import { useNightOrderDrag } from './useNightOrderDrag';
import HeaderLayoutFrame from './HeaderLayoutFrame';
import InlineStateRulesSection from './InlineStateRulesSection';
import StateRulesSection from './StateRulesSection';
import JinxSection from './JinxSection';
import CharacterImage from './CharacterImage';
import TowerImageOverlay from './TowerImageOverlay';
import FooterOverlay from './FooterOverlay';
import ScriptCanvasAddButton from './ScriptCanvasAddButton';
import { useLayoutContextMenu } from './LayoutContextMenu';
import { footerText } from '../utils/footerText';
import { clampRectMove } from '../utils/headerAlignment';
import { measureHeaderLayoutBounds } from '../utils/headerLayoutBounds';
import type { HeaderLayoutTarget } from '../utils/headerLayout';
import { defaultHeaderAdjustment, normalizeHeaderAdjustment } from '../utils/headerLayout';
import { explanationForPage } from '../utils/explanationRichText';
import { SecondPageTitle } from './SecondPageTitle';
import { PlayerCountTable } from './PlayerCountTable';
import { SecondPageAddButton } from './SecondPageAddButton';
import { SecondPageSortableItem } from './SecondPageSortableItem';
import { THEME_COLORS } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import { DEFAULT_TITLE_FONT_SIZE_MD, MAX_TITLE_CONTENT_GAP, uiConfigStore } from '../stores/UIConfigStore';
import { configStore } from '../stores/ConfigStore';
import { scriptStore } from '../stores/ScriptStore';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    MouseSensor,
    TouchSensor,
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


const backgroundIndex = 2
export interface ScriptRendererProps {
    script: Script;
    theme: any; // MUI theme

    // 编辑模式配置
    readOnly?: boolean; // 是否只读模式
    compact?: boolean;  // 超紧凑模式（全角色一览）
    exportMode?: boolean; // Read-only A4 rendering retains the normal header layout.

    // 事件回调（编辑模式下使用）
    onReorderCharacters?: (team: string, newOrder: Character[], columnLeftCount?: number) => void;
    onUpdateCharacter?: (characterId: string, updates: Partial<Character>) => void;
    onEditCharacter?: (character: Character) => void;
    onDeleteCharacter?: (character: Character) => void;
    onReplaceCharacter?: (character: Character, position: { x: number; y: number }) => void;
    onAddCustomCharacter?: (team: string) => void;
    onTitleEdit?: (mode: 'main' | 'firstNight' | 'otherNight') => void;
    onEditNightOrderTitle?: (side: 'first' | 'other') => void;
    onSecondPageTitleEdit?: () => void;  // 第二页标题编辑
    onSpecialRuleEdit?: (rule: any) => void;
    onSpecialRuleDelete?: (rule: any) => void;
    onAddSpecialRule?: () => void;
    onNightOrderReorder?: (nightType: 'first' | 'other', oldIndex: number, newIndex: number) => void;
    onOpenTowerImageDialog?: (page?: 1 | 2) => void;
    onEditFooterComponent?: (item: FooterComponent) => void;
    onEditExplanation?: (value: RichTextDocument, layout: FooterComponent) => void;

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
    exportMode = false,
    onReorderCharacters = () => { },
    onUpdateCharacter = () => { },
    onEditCharacter = () => { },
    onDeleteCharacter = () => { },
    onReplaceCharacter = () => { },
    onAddCustomCharacter,
    onTitleEdit = () => { },
    onEditNightOrderTitle,
    onSecondPageTitleEdit = () => { },
    onSpecialRuleEdit = () => { },
    onSpecialRuleDelete = () => { },
    onAddSpecialRule,
    onNightOrderReorder = () => { },
    onOpenTowerImageDialog,
    onEditFooterComponent,
    onEditExplanation,

}: ScriptRendererProps) => {
    const COMPACT_SCALE = compact ? 0.47 : 1;
    const { t, language } = useTranslation();
    const labelValueSeparator = language === 'cn' ? '：' : ': ';
    const footerLabels = footerText(language);
    const saveFooterComponent = (item: FooterComponent) => {
        const current = scriptStore.script?.footerComponents || [];
        const exists = current.some(old => old.id === item.id);
        scriptStore.setFooterComponents(exists
            ? current.map(old => old.id === item.id ? item : old)
            : [...current, item]);
    };
    const deleteFooterComponent = (id: string) => scriptStore.setFooterComponents((scriptStore.script?.footerComponents || []).filter(item => item.id !== id));
    const scriptRef = useRef<HTMLDivElement>(null);
    const page2ContainerRef = useRef<HTMLDivElement>(null);
    const page3ContainerRef = useRef<HTMLDivElement>(null);
    const authorImageInputRef = useRef<HTMLInputElement>(null);
    const [headerAddAnchor, setHeaderAddAnchor] = useState<HTMLElement | null>(null);
    const pendingHeaderContainment = useRef<Partial<Record<HeaderLayoutTarget, { x: number; y: number }>>>({});
    const headerCreditsRef = useRef<HTMLDivElement>(null);
    const headerRowRef = useRef<HTMLDivElement>(null);
    const titleBoxRef = useRef<HTMLDivElement>(null);
    const titleTextRef = useRef<HTMLDivElement>(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const hasSpecialRules = Boolean(script.specialRules?.length);
    const showDesignCredit = uiConfigStore.config.showDesignCredit !== false;
    const showAuthorCredit = uiConfigStore.config.showAuthorCredit === null ? Boolean(script.authorImage) : uiConfigStore.config.showAuthorCredit !== false;
    const firstHeaderTeam = [
        'townsfolk', 'outsider', 'minion', 'demon',
        ...(!uiConfigStore.config.enableTwoPageMode && !compact ? ['fabled', 'traveler'] : []),
        ...(!uiConfigStore.config.enableTwoPageMode && !compact
            ? Object.keys(script.characters).filter(team => !['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'traveler'].includes(team)) : []),
    ].find(team => script.characters[team]?.length);
    const [headerCreditsHeight, setHeaderCreditsHeight] = useState(0);
    const [headerCreditsWidth, setHeaderCreditsWidth] = useState(0);
    const [headerRowHeight, setHeaderRowHeight] = useState(0);
    const [fittedTitleSize, setFittedTitleSize] = useState<number | null>(null);
    const [footerReserve, setFooterReserve] = useState({ 1: 0, 2: 0 });
    const titleLayoutTarget = hasSpecialRules
        ? (isMobile ? 'titleWithRulesMobile' : 'titleWithRules')
        : (isMobile ? 'titleMobile' : 'title');
    const ruleLayoutTarget = isMobile ? 'ruleMobile' : 'rule';
    const designLayoutTarget = hasSpecialRules
        ? (isMobile ? 'designWithRulesMobile' : 'designWithRules')
        : (isMobile ? 'designMobile' : 'design');
    const authorLayoutTarget = hasSpecialRules
        ? (isMobile ? 'authorWithRulesMobile' : 'authorWithRules')
        : (isMobile ? 'authorMobile' : 'author');
    const authorLineLayoutTarget = hasSpecialRules
        ? (isMobile ? 'authorLineWithRulesMobile' : 'authorLineWithRules')
        : (isMobile ? 'authorLineMobile' : 'authorLine');
    const authorAlignment = script.authorAlignment || (hasSpecialRules || compact || uiConfigStore.config.legacyCenteredAuthorLineTargets?.includes(authorLineLayoutTarget) ? 'center' : 'right');
    const titleAdjustment = uiConfigStore.config.headerLayout[titleLayoutTarget];
    const ruleAdjustment = uiConfigStore.config.headerLayout[ruleLayoutTarget];
    const designAdjustment = uiConfigStore.config.headerLayout[designLayoutTarget];
    const authorAdjustment = uiConfigStore.config.headerLayout[authorLayoutTarget];
    const authorLineAdjustment = uiConfigStore.config.headerLayout[authorLineLayoutTarget];
    const designScale = compact ? 1 : designAdjustment.scale;
    const authorScale = compact ? 1 : authorAdjustment.scale;
    const titleDrag = useHeaderLayoutDrag(titleLayoutTarget, 'move', true);
    const designDrag = useHeaderLayoutDrag(designLayoutTarget, 'move', true);
    const authorDrag = useHeaderLayoutDrag(authorLayoutTarget, 'move', true);
    const authorLineDrag = useHeaderLayoutDrag(authorLineLayoutTarget, 'move', true);
    const firstNightDrag = useNightOrderDrag('first');
    const otherNightDrag = useNightOrderDrag('other');
    const resetHeaderTarget = (target: HeaderLayoutTarget) => () => {
        uiConfigStore.setHeaderLayout(target, defaultHeaderAdjustment(target), { resetAnchor: true });
    };
    const menuLabels = {
        edit: t('ui.edit'),
        reset: t('ui.resetLayout'),
        remove: t('ui.delete'),
    };
    const titleMenu = useLayoutContextMenu(menuLabels, {
        edit: () => onTitleEdit('main'),
        reset: () => {
            resetHeaderTarget(titleLayoutTarget)();
            if (script.useTitleImage && script.titleImage) scriptStore.updateTitleInfo({ titleImageSize: 160 });
            else uiConfigStore.updateConfig({ titleFontSize: { ...uiConfigStore.config.titleFontSize, md: DEFAULT_TITLE_FONT_SIZE_MD } });
        },
    });
    const designMenu = useLayoutContextMenu(menuLabels, {
        reset: resetHeaderTarget(designLayoutTarget),
        remove: () => uiConfigStore.updateConfig({ showDesignCredit: false }),
    });
    const authorMenu = useLayoutContextMenu(menuLabels, {
        edit: () => authorImageInputRef.current?.click(),
        reset: resetHeaderTarget(authorLayoutTarget),
        remove: () => uiConfigStore.updateConfig({ showAuthorCredit: false }),
    });
    const authorLineMenu = useLayoutContextMenu(menuLabels, {
        edit: () => onTitleEdit('main'),
        reset: resetHeaderTarget(authorLineLayoutTarget),
    });

    useEffect(() => {
        const roots = [page2ContainerRef.current, page3ContainerRef.current] as const;
        const measure = () => {
            const heights = roots.map(paper => {
                if (!paper) return 0;
                const bounds = paper.getBoundingClientRect();
                const scale = paper.offsetWidth ? bounds.width / paper.offsetWidth : 1;
                return Math.ceil(Math.max(0, ...[...paper.querySelectorAll<HTMLElement>('[data-footer-reserve="true"]')]
                    .filter(item => item.dataset.footerKind === 'list' || item.dataset.footerKind === 'nightLegend')
                    .map(item => item.dataset.footerReserveSpace ? Number(item.dataset.footerReserveSpace)
                        : (bounds.bottom - item.getBoundingClientRect().top) / scale + 12)));
            });
            setFooterReserve(old => old[1] === heights[0] && old[2] === heights[1] ? old : { 1: heights[0], 2: heights[1] });
        };
        measure();
        const observer = new ResizeObserver(measure);
        roots.forEach(root => { if (root) { observer.observe(root); root.querySelectorAll<HTMLElement>('[data-footer-reserve]').forEach(item => observer.observe(item)); } });
        return () => observer.disconnect();
    }, [script.footerComponents, uiConfigStore.config.enableTwoPageMode, compact]);

    // Old saved offsets and viewport changes must obey the same page boundary as a new drag.
    useEffect(() => {
        const root = scriptRef.current;
        if (!root || compact || readOnly) return;
        const page = root.querySelector<HTMLElement>('#main_script');
        if (!page) return;
        pendingHeaderContainment.current = {};
        const contain = () => {
            // Print temporarily hides or resizes header elements. Those transient
            // bounds must never be persisted as the user's editable layout.
            if (window.matchMedia('print').matches) return;
            const measuredBounds = measureHeaderLayoutBounds(root, page);
            const scale = measuredBounds.scale;
            root.querySelectorAll<HTMLElement>('[data-header-layout-target]').forEach(item => {
                if (item.dataset.headerDragging === 'true' || item.getClientRects().length === 0) return;
                const target = item.dataset.headerLayoutTarget as HeaderLayoutTarget;
                const current = uiConfigStore.config.headerLayout[target];
                if (!current || pendingHeaderContainment.current[target]) return;
                const itemBounds = measureHeaderLayoutBounds(root, page, target);
                const safe = clampRectMove(item.getBoundingClientRect(), itemBounds.screen, 0, 0);
                const dx = Math.round(safe.dx / scale), dy = Math.round(safe.dy / scale);
                if (dx || dy) {
                    const next = normalizeHeaderAdjustment({ ...current, x: current.x + dx, y: current.y + dy });
                    if (next.x !== current.x || next.y !== current.y) {
                        pendingHeaderContainment.current[target] = { x: next.x, y: next.y };
                        uiConfigStore.setHeaderLayout(target, next);
                    }
                }
            });
        };
        contain();
        let frame: number | null = null;
        const observer = new ResizeObserver(() => {
            if (frame !== null) return;
            frame = requestAnimationFrame(() => { frame = null; contain(); });
        });
        observer.observe(root);
        const contentStart = root.querySelector<HTMLElement>('[data-header-content-start]');
        if (contentStart) observer.observe(contentStart);
        root.querySelectorAll<HTMLElement>('[data-header-layout-target]').forEach(item => observer.observe(item));
        return () => { observer.disconnect(); if (frame !== null) cancelAnimationFrame(frame); };
    }, [compact, readOnly, hasSpecialRules, isMobile, titleAdjustment, ruleAdjustment, designAdjustment, authorAdjustment, authorLineAdjustment]);

    useEffect(() => {
        const credits = headerCreditsRef.current;
        if (!credits || compact) return;
        const update = () => {
            setHeaderCreditsHeight(credits.offsetHeight);
            setHeaderCreditsWidth(credits.offsetWidth);
        };
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(credits);
        return () => resizeObserver.disconnect();
    }, [hasSpecialRules, compact, isMobile, readOnly]);

    useEffect(() => {
        const row = headerRowRef.current;
        if (!row || !hasSpecialRules || compact || isMobile) return;
        const update = () => setHeaderRowHeight(row.offsetHeight);
        update();
        const resizeObserver = new ResizeObserver(update);
        resizeObserver.observe(row);
        return () => resizeObserver.disconnect();
    }, [hasSpecialRules, compact, isMobile]);

    // 上传作者头像（base64 存入 _meta.authorImage）
    const handleAuthorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const dataUrl = ev.target?.result as string;
            if (dataUrl) scriptStore.setAuthorImage(dataUrl);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    // 按语言选择展示标题：英文优先使用 titleEn；否则回退到第二页标题文本或主标题
    const displayedTitle = useMemo(() => {
        const titleEn = (script as any).titleEn as string | undefined;
        const base = script.secondPageTitleText || script.title;
        if (language !== 'cn' && titleEn && titleEn.trim()) return titleEn.trim();
        return base;
    }, [language, script]);

    useEffect(() => {
        const box = titleBoxRef.current;
        const title = titleTextRef.current;
        if (!box || !title || compact || hasSpecialRules || isMobile || (readOnly && !exportMode) || script.useTitleImage) {
            setFittedTitleSize(null);
            return;
        }

        let active = true;
        const measure = () => {
            if (!active) return;
            const configured = uiConfigStore.titleFontSizeMd.trim();
            const match = configured.match(/^([\d.]+)(rem|px)$/);
            if (!match) { setFittedTitleSize(null); return; }
            const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
            const baseSize = Number(match[1]) * (match[2] === 'rem' ? rootSize : 1);
            const style = getComputedStyle(title);
            const context = document.createElement('canvas').getContext('2d');
            if (!context) return;
            context.font = `${style.fontStyle} ${style.fontWeight} ${baseSize}px ${style.fontFamily}`;
            const naturalWidth = Math.max(...displayedTitle.split(/\n|<br\s*\/?>/i).map((line) => context.measureText(line).width), 1);
            const availableWidth = Math.max(0, box.clientWidth - 4);
            if (!availableWidth) return;
            const minimumSize = Math.min(baseSize, 32);
            const nextSize = Math.round(Math.min(baseSize, Math.max(minimumSize, baseSize * (availableWidth - 2) / naturalWidth)) * 100) / 100;
            setFittedTitleSize(nextSize);
        };
        measure();
        const resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(box);
        document.fonts.ready.then(measure);
        return () => { active = false; resizeObserver.disconnect(); };
    }, [displayedTitle, compact, hasSpecialRules, isMobile, readOnly, exportMode, script.useTitleImage, uiConfigStore.titleFontSizeMd, uiConfigStore.scriptTitleFont, headerCreditsWidth]);
    const allCharacters = useMemo<Character[]>(() => {
        return Object.values(script.characters).flat();
    }, [script.characters]);
    // 第二页拖拽传感器
    const secondPageSensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: readOnly ? { distance: 999999 } : { distance: 5 },
        }),
        useSensor(TouchSensor, {
            // Long-press (300ms) to drag; quick swipes keep page scrolling
            activationConstraint: readOnly ? { distance: 999999 } : { delay: 300, tolerance: 8 },
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
                return script.secondPageRules?.some(rule => !rule.isState) ? (
                    <StateRulesSection
                        key="secondPageRules"
                        rules={script.secondPageRules.filter(rule => !rule.isState)}
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

    const storytellerTitleContentSpacing = Math.min(
        uiConfigStore.config.storytellerNightSheet.titleContentSpacing,
        20,
    );
    const storytellerColumnTitleSx = {
        fontFamily: uiConfigStore.scriptTitleFont,
        fontWeight: 'bold',
        fontSize: 'clamp(1.55rem, 2.4vw, 2.25rem)',
        lineHeight: 1.05,
        textAlign: 'center',
        mb: 0.5,
        letterSpacing: 0,
        wordBreak: 'break-word',
        color: THEME_COLORS.paper.primary,
        textShadow: '0 1px 0 rgba(255, 255, 255, 0.45)',
        cursor: readOnly ? 'default' : 'pointer',
    };
    const storytellerPageBackgroundImage = `url(${uiConfigStore.mainBackgroundUrl})`;
    const storytellerPageBackgroundSize = `100% 100%`;
    const storytellerPageBackgroundPosition = `center`;
    const storytellerPageBackgroundRepeat = `no-repeat`;
    const storytellerNightPageSx = {
        flex: 1,
        minHeight: '100vh',
        backgroundImage: storytellerPageBackgroundImage,
        backgroundSize: storytellerPageBackgroundSize,
        backgroundPosition: storytellerPageBackgroundPosition,
        backgroundRepeat: storytellerPageBackgroundRepeat,
        borderRadius: 0,
        position: 'relative',
        boxShadow: 'none',
        display: 'flex',
        flexDirection: 'column',
        '& > *': {
            position: 'relative',
            zIndex: backgroundIndex + 3,
        },
        '@media print': {
            height: '100vh !important',
            minHeight: '100vh !important',
        },
    };
    
    // Keep the draggable boundary attached to the header itself, not a margin below it.
    const headerExtra = compact ? 0 : Math.max(0, Math.min(MAX_TITLE_CONTENT_GAP, uiConfigStore.config.titleContentGap || 0));
    const inlineHeaderCredits = !hasSpecialRules && !compact && (!readOnly || exportMode) && (showDesignCredit || showAuthorCredit);
    const specialRuleTitleTopOffset = hasSpecialRules && !compact ? 20 : 0;
    const specialHeaderMinHeight = Math.max(uiConfigStore.titleHeight, 120, headerCreditsHeight + 16) + specialRuleTitleTopOffset;
    const titleSafeInset = inlineHeaderCredits ? (headerCreditsWidth || 208) + 40 : 0;
    const specialCreditWidth = (showDesignCredit && showAuthorCredit ? (script.authorImage ? 160 : 140)
        : showDesignCredit || showAuthorCredit ? 72 : 0)
        + (showDesignCredit ? Math.max(0, (designScale - 1) * 50) : 0)
        + (showAuthorCredit ? Math.max(0, (authorScale - 1) * 50) : 0);
    const ruleBaseWidth = `min(${showDesignCredit || showAuthorCredit ? (script.authorImage ? 72 : 74) : 100}%, calc(100% - ${specialCreditWidth + 10}px))`;
    const ruleWidth = `min(100%, max(180px, calc(${ruleBaseWidth} + ${ruleAdjustment.widthDelta}px)))`;
    const headerCredits = (!readOnly || exportMode || (hasSpecialRules && !compact)) && (
        <Box ref={headerCreditsRef} className="script-header-credits" sx={{
            position: inlineHeaderCredits ? 'relative' : 'absolute',
            gridArea: inlineHeaderCredits ? 'header' : undefined,
            justifySelf: inlineHeaderCredits ? 'start' : undefined,
            alignSelf: inlineHeaderCredits ? { xs: 'flex-start', md: 'end' } : undefined,
            ml: inlineHeaderCredits ? { xs: 0, md: 2 } : 0,
            mt: inlineHeaderCredits ? { xs: 0, md: '24px' } : 0,
            top: inlineHeaderCredits ? 'auto' : hasSpecialRules && !compact
                ? { xs: 12 + headerExtra / 2, md: `${Math.max(8, (headerRowHeight - headerCreditsHeight) / 2)}px` }
                : { xs: 12 + headerExtra / 2, sm: 16 + headerExtra / 2, md: 95 + headerExtra / 2 },
            left: inlineHeaderCredits ? 'auto' : hasSpecialRules && !compact ? 'auto' : { xs: 12, sm: 16, md: 140 },
            right: inlineHeaderCredits ? 'auto' : hasSpecialRules && !compact ? { xs: 12, sm: 16, md: '5%' } : 'auto',
            zIndex: 5,
            display: 'flex',
            flexDirection: 'row',
            flexWrap: hasSpecialRules && !compact ? 'wrap' : 'nowrap',
            justifyContent: hasSpecialRules && !compact ? 'center' : 'flex-start',
            width: hasSpecialRules && !compact ? specialCreditWidth : 'auto',
            alignItems: 'flex-start',
            gap: hasSpecialRules && !compact ? 0.5 : { xs: 0.5, sm: 0.8, md: 1 },
            pointerEvents: 'none',
        }}>
            {/* A 列：Onion（Design） */}
            {showDesignCredit && <Box data-header-layout-item="design" data-header-layout-target={designLayoutTarget} data-layout-snap {...(!readOnly && !compact ? designDrag : {})}
                onContextMenu={!readOnly && !compact ? designMenu.openAtPoint : undefined}
                onKeyDown={!readOnly && !compact ? (event) => { designMenu.openWithKeyboard(event); if (!event.defaultPrevented) designDrag.onKeyDown(event); } : undefined}
                tabIndex={!readOnly && !compact ? 0 : undefined}
                role={!readOnly && !compact ? 'group' : undefined}
                aria-label={!readOnly && !compact ? `${t('credits.designers')} — ${t('ui.dragHeaderAvatar')}` : undefined}
                title={!readOnly && !compact ? t('ui.dragHeaderAvatar') : undefined}
                sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 1,
                    transform: compact ? 'none' : `translate(${designAdjustment.x}px, ${designAdjustment.y}px)`,
                    pointerEvents: !readOnly && !compact ? 'auto' : 'none', touchAction: !readOnly && !compact ? 'none' : undefined,
                    cursor: !readOnly && !compact ? 'move' : undefined,
                    '&:hover, &:focus-within': { zIndex: 3 },
                    '&:hover > .layout-frame, &:focus-within > .layout-frame': { opacity: 1, visibility: 'visible' },
                }}>
                <Box
                    component="img"
                    data-header-avatar-image
                    draggable={false}
                    src="/imgs/icons/fabled/onion.webp"
                    alt="Onion Avatar"
                    sx={{
                        width: hasSpecialRules && !compact ? { xs: 36 * designScale, sm: 44 * designScale, md: 50 * designScale } : { xs: 50 * designScale, sm: 60 * designScale, md: 70 * designScale },
                        height: hasSpecialRules && !compact ? { xs: 36 * designScale, sm: 44 * designScale, md: 50 * designScale } : { xs: 50 * designScale, sm: 60 * designScale, md: 70 * designScale },
                        borderRadius: '50%',
                        border: '2px solid #d4af37',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        objectFit: 'cover',
                        position: 'relative',
                        zIndex: 2,
                    }}
                />
                <Box sx={{
                    pt: { xs: 0.75, sm: 1, md: 1.25 },
                    pb: { xs: 0.5, sm: 0.75, md: 1 },
                    minWidth: hasSpecialRules && !compact ? { xs: '44px', md: '48px' } : { xs: '80px', sm: '90px', md: '100px' },
                    maxWidth: hasSpecialRules && !compact ? '72px' : { xs: '120px', md: '160px' },
                    '& .MuiTypography-root': hasSpecialRules && !compact
                        ? { whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.2, fontSize: '0.72rem' }
                        : { whiteSpace: 'normal', overflowWrap: 'anywhere' },
                }}>
                    {script.authorImage ? (
                        <>
                            <Typography sx={{
                                fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                                color: '#404040ff',
                                fontWeight: 700,
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}>
                                {t('credits.designers')}
                            </Typography>
                            <Typography sx={{
                                fontSize: { xs: '0.6rem', sm: '0.68rem', md: '0.75rem' },
                                color: '#666',
                                textAlign: 'center',
                                whiteSpace: 'nowrap',
                            }}>
                                {t('credits.designTitle')}
                            </Typography>
                        </>
                    ) : (
                        <Typography sx={{
                            fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                            color: '#404040ff',
                            fontWeight: 700,
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                        }}>
                            {t('credits.designTitle')}: {t('credits.designers')}
                        </Typography>
                    )}
                </Box>
                {!readOnly && !compact && <HeaderLayoutFrame target={designLayoutTarget} kind="avatar" moveLabel={t('ui.dragHeaderAvatar')}
                    resizeLabel={t('ui.resizeHeaderAvatar')} moreLabel={t('ui.moreActions')}
                    onOpenMenu={designMenu.openAtElement} onContextMenu={designMenu.openAtPoint} />}
            </Box>}

            {/* × 符号 (A × B) — 与头像圆心平齐，无图时隐藏 */}
            <Box sx={{
                display: showDesignCredit && showAuthorCredit && script.authorImage ? 'flex' : 'none',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 2,
                flexShrink: 0,
                // 头像高 50/60/70，× 字号 1.2/1.5/1.8rem(≈19/24/29px 高)，
                // 圆心 ≈ 25/30/35 → pt = 圆心 - 半字高
                pt: hasSpecialRules && !compact ? { xs: '10px', sm: '14px', md: '17px' } : { xs: '16px', sm: '18px', md: '21px' },
                '@media print': { display: showDesignCredit && showAuthorCredit && script.authorImage ? 'flex' : 'none' },
            }}>
                <Typography sx={{
                    fontSize: hasSpecialRules && !compact ? '1rem' : { xs: '1.2rem', sm: '1.5rem', md: '1.8rem' },
                    fontWeight: 300,
                    color: '#404040ff',
                    userSelect: 'none',
                }}>
                    ×
                </Typography>
            </Box>

            {/* B 列：作者头像（Author）- 默认灰圆+加号，点击上传；无图时打印隐藏 */}
            {showAuthorCredit && <Box data-header-layout-item="author" data-header-layout-target={authorLayoutTarget} data-layout-snap {...(!readOnly && !compact ? authorDrag : {})}
                onContextMenu={!readOnly && !compact ? authorMenu.openAtPoint : undefined}
                onKeyDown={!readOnly && !compact ? (event) => { authorMenu.openWithKeyboard(event); if (!event.defaultPrevented) authorDrag.onKeyDown(event); } : undefined}
                tabIndex={!readOnly && !compact ? 0 : undefined}
                role={!readOnly && !compact ? 'group' : undefined}
                aria-label={!readOnly && !compact ? `${script.author || t('credits.author')} — ${t('ui.dragHeaderAvatar')}` : undefined}
                title={!readOnly && !compact ? t('ui.dragHeaderAvatar') : undefined}
                sx={{
                display: readOnly && !script.authorImage && !script.author && !script.playerCount ? 'none' : 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                zIndex: 1,
                transform: compact ? 'none' : `translate(${authorAdjustment.x}px, ${authorAdjustment.y}px)`,
                pointerEvents: !readOnly && !compact ? 'auto' : 'none', touchAction: !readOnly && !compact ? 'none' : undefined,
                cursor: !readOnly && !compact ? 'move' : undefined,
                '&:hover, &:focus-within': { zIndex: 3 },
                '&:hover > .layout-frame, &:focus-within > .layout-frame': { opacity: 1, visibility: 'visible' },
                '@media print': {
                    display: hasSpecialRules && !compact
                        ? (script.authorImage || script.author || script.playerCount ? 'flex' : 'none')
                        : (script.authorImage ? 'flex' : 'none'),
                },
            }}>
                {script.authorImage ? (
                    <Box
                        component="img"
                        data-header-avatar-image
                        draggable={false}
                        src={script.authorImage}
                        alt={script.author || t('credits.author')}
                        onClick={() => !readOnly && authorImageInputRef.current?.click()}
                        sx={{
                            width: hasSpecialRules && !compact ? { xs: 36 * authorScale, sm: 44 * authorScale, md: 50 * authorScale } : { xs: 50 * authorScale, sm: 60 * authorScale, md: 70 * authorScale },
                            height: hasSpecialRules && !compact ? { xs: 36 * authorScale, sm: 44 * authorScale, md: 50 * authorScale } : { xs: 50 * authorScale, sm: 60 * authorScale, md: 70 * authorScale },
                            borderRadius: '50%',
                            border: '2px solid #d4af37',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                            objectFit: 'cover',
                            position: 'relative',
                            zIndex: 2,
                            cursor: readOnly ? 'default' : 'pointer',
                            pointerEvents: readOnly ? 'none' : 'auto',
                        }}
                    />
                ) : (
                    <Box
                        data-header-avatar-image
                        onClick={() => authorImageInputRef.current?.click()}
                        sx={{
                            width: hasSpecialRules && !compact ? { xs: 36 * authorScale, sm: 44 * authorScale, md: 50 * authorScale } : { xs: 50 * authorScale, sm: 60 * authorScale, md: 70 * authorScale },
                            height: hasSpecialRules && !compact ? { xs: 36 * authorScale, sm: 44 * authorScale, md: 50 * authorScale } : { xs: 50 * authorScale, sm: 60 * authorScale, md: 70 * authorScale },
                            borderRadius: '50%',
                            border: '2px dashed #bbb',
                            backgroundColor: 'rgba(200,200,200,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            position: 'relative',
                            zIndex: 2,
                            cursor: 'pointer',
                            pointerEvents: readOnly ? 'none' : 'auto',
                            opacity: readOnly ? 0 : 1,
                            '@media print': hasSpecialRules && !compact ? { opacity: 0 } : { display: 'none' },
                        }}
                    >
                        <AddIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: '#999' }} />
                    </Box>
                )}
                <Box sx={{
                    pt: { xs: 0.75, sm: 1, md: 1.25 },
                    pb: { xs: 0.5, sm: 0.75, md: 1 },
                    minWidth: hasSpecialRules && !compact ? { xs: '44px', md: '48px' } : { xs: '80px', sm: '90px', md: '100px' },
                    maxWidth: hasSpecialRules && !compact ? '72px' : { xs: '120px', md: '160px' },
                    '& .MuiTypography-root': hasSpecialRules && !compact
                        ? { whiteSpace: 'normal', overflowWrap: 'anywhere', lineHeight: 1.2, fontSize: '0.72rem' }
                        : { whiteSpace: 'normal', overflowWrap: 'anywhere' },
                }}>
                    <Typography sx={{
                        fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.85rem' },
                        color: '#404040ff',
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                    }}>
                        {script.author || t('credits.author')}
                    </Typography>
                    <Typography sx={{
                        fontSize: { xs: '0.6rem', sm: '0.68rem', md: '0.75rem' },
                        color: '#666',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                    }}>
                        {t('credits.author')}
                    </Typography>
                </Box>
                {!readOnly && !compact && <HeaderLayoutFrame target={authorLayoutTarget} kind="avatar" moveLabel={t('ui.dragHeaderAvatar')}
                    resizeLabel={t('ui.resizeHeaderAvatar')} moreLabel={t('ui.moreActions')}
                    editLabel={t('ui.edit')} onEdit={() => authorImageInputRef.current?.click()}
                    onOpenMenu={authorMenu.openAtElement} onContextMenu={authorMenu.openAtPoint} />}
            </Box>}

            {hasSpecialRules && !compact && script.playerCount && (
                <Typography sx={{
                    flexBasis: '100%',
                    fontSize: '0.65rem',
                    color: '#403b34',
                    textAlign: 'center',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                }}>
                    {t('script.playerCount')}：{script.playerCount}
                </Typography>
            )}

            {!readOnly && <input
                ref={authorImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleAuthorImageUpload}
                style={{ display: 'none' }}
            />}
        </Box>
    );

    return (
        <>
            {!readOnly && !compact && <>{titleMenu.element}{designMenu.element}{authorMenu.element}{authorLineMenu.element}</>}
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
                        '& [data-header-layout-item]:focus-visible': { outline: 'none' },
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

                    {/* 有特殊规则时，署名和头像收在右上角，不占标题下方的版面。 */}
                    {!inlineHeaderCredits && headerCredits}

                    {/* 左侧 - 首个夜晚 */}
                    {!isMobile && (
                        <Box id="night-order-left" data-night-order-side="first" sx={{
                            padding: compact ? 0.3 : 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: compact ? '2%' : `max(0px, calc(${uiConfigStore.config.nightOrderTopSpacingAuto ? '25%' : `${uiConfigStore.config.nightOrderTopSpacing}vh`} + ${uiConfigStore.config.nightOrderOffsets.first}px))`,
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 1,
                            }
                        }}>
                            <NightOrder
                                title={script.sideFirstNightTitle || t('firstNight')}
                                titleDrag={!readOnly && !compact ? firstNightDrag : undefined}
                                onEditTitle={!readOnly && !compact ? () => onEditNightOrderTitle?.('first') : undefined}
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
                        ref={page2ContainerRef}
                        elevation={0}
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            backgroundImage: compact ? 'none' : `url(${uiConfigStore.mainBackgroundUrl})`,
                            backgroundColor: compact ? '#EDE4D5' : 'transparent',
                            backgroundSize: '100% 100%',
                            backgroundPosition: 'top center',
                            backgroundRepeat: 'no-repeat',
                            borderRadius: 0,
                            zIndex: 'auto',
                            position: 'relative',
                            boxShadow: 'none',
                        }}
                    >
                        {(uiConfigStore.headerAlignmentGuides.vertical !== null || uiConfigStore.headerAlignmentGuides.horizontal !== null) && (
                            <Box className="header-alignment-guides" aria-hidden="true" sx={{
                                position: 'absolute', inset: 0, zIndex: 30, pointerEvents: 'none', '@media print': { display: 'none' },
                            }}>
                                {uiConfigStore.headerAlignmentGuides.vertical !== null && <Box sx={{
                                    position: 'absolute', top: 0, height: 'min(600px, 100%)',
                                    left: `${uiConfigStore.headerAlignmentGuides.vertical}px`, borderLeft: '1px dashed #00929f',
                                    filter: 'drop-shadow(0 0 1px white)',
                                }} />}
                                {uiConfigStore.headerAlignmentGuides.horizontal !== null && <Box sx={{
                                    position: 'absolute', left: 0, right: 0,
                                    top: `${uiConfigStore.headerAlignmentGuides.horizontal}px`, borderTop: '1px dashed #00929f',
                                    filter: 'drop-shadow(0 0 1px white)',
                                }} />}
                            </Box>
                        )}
                        {/* 标题区域 */}
                        <Box className="script-header" sx={{
                            textAlign: 'center',
                            mb: 0,
                            mt: compact ? 0.3 : hasSpecialRules
                                ? { xs: `${Math.max(88, headerCreditsHeight + 24)}px`, sm: `${Math.max(80, headerCreditsHeight + 24)}px`, md: 0 }
                                : 0,
                            position: 'relative',
                            zIndex: 'auto',
                            px: { xs: 2, sm: 3, md: 4 },
                            pr: hasSpecialRules ? '64px' : undefined,
                            '@media print': hasSpecialRules && !compact ? { mt: 0, pr: 4 } : { pr: 4 },
                        }}>
                            {!readOnly && !compact && onAddSpecialRule && (
                                <Box sx={{ position: 'absolute', top: 4, right: 12, zIndex: 12 }}>
                                    <ScriptCanvasAddButton label={t('ui.addHeaderComponent')} onClick={(event) => setHeaderAddAnchor(event.currentTarget)} page="header" />
                                    <Menu anchorEl={headerAddAnchor} open={Boolean(headerAddAnchor)} onClose={() => setHeaderAddAnchor(null)} disableScrollLock>
                                        <MenuItem onClick={() => { setHeaderAddAnchor(null); onAddSpecialRule(); }}>{t('ui.addHeaderSpecialRule')}</MenuItem>
                                        {!showDesignCredit && <MenuItem onClick={() => { setHeaderAddAnchor(null); uiConfigStore.updateConfig({ showDesignCredit: true }); }}>{t('ui.restoreDesignCredit')}</MenuItem>}
                                        {!showAuthorCredit && <MenuItem onClick={() => { setHeaderAddAnchor(null); uiConfigStore.updateConfig({ showAuthorCredit: true }); }}>{t('ui.restoreAuthorCredit')}</MenuItem>}
                                    </Menu>
                                </Box>
                            )}
                            <Box
                                ref={headerRowRef}
                                sx={{
                                    position: 'relative',
                                    height: { xs: 'auto', md: compact && !hasSpecialRules ? 90 : 'auto' },
                                    minHeight: { xs: 0, md: compact ? (hasSpecialRules ? 90 : 0) : (hasSpecialRules ? specialHeaderMinHeight : uiConfigStore.titleHeight) + headerExtra },
                                    width: '100%',
                                    minWidth: 0,
                                    boxSizing: 'border-box',
                                    display: { xs: 'flex', md: compact && !hasSpecialRules ? 'block' : 'grid' },
                                    flexDirection: { xs: 'column', md: 'row' },
                                    gridTemplateColumns: { md: hasSpecialRules ? 'minmax(0, 0.86fr) minmax(0, 1.14fr)' : 'minmax(0, 1fr)' },
                                    gridTemplateAreas: { md: !hasSpecialRules && !compact ? '"header"' : 'none' },
                                    alignItems: { xs: 'center', md: hasSpecialRules ? 'center' : 'start' },
                                    gap: { xs: 2, md: hasSpecialRules ? 1 : 0 },
                                    py: {
                                        xs: compact ? 0.5 : `${16 + headerExtra / 2}px`,
                                        md: compact ? 0 : `${headerExtra / 2}px`,
                                    },
                                    '@media print': hasSpecialRules && !compact ? {
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(0, 0.86fr) minmax(0, 1.14fr)',
                                        alignItems: 'center',
                                        minHeight: specialHeaderMinHeight + headerExtra,
                                        gap: 1,
                                        py: `${headerExtra / 2}px`,
                                    } : inlineHeaderCredits ? {
                                        display: 'grid',
                                        gridTemplateColumns: 'minmax(0, 1fr)',
                                        gridTemplateAreas: '"header"',
                                        minHeight: uiConfigStore.titleHeight + headerExtra,
                                        py: `${headerExtra / 2}px`,
                                    } : {},
                                }}
                            >
                                {inlineHeaderCredits && headerCredits}
                                {/* 标题 */}
                                <Box
                                    ref={titleBoxRef}
                                    data-header-layout-item="title"
                                    data-header-layout-target={titleLayoutTarget}
                                    data-layout-snap
                                    {...(!readOnly && !compact ? titleDrag : {})}
                                    onContextMenu={!readOnly && !compact ? titleMenu.openAtPoint : undefined}
                                    onKeyDown={!readOnly && !compact ? (event) => { titleMenu.openWithKeyboard(event); if (!event.defaultPrevented) titleDrag.onKeyDown(event); } : undefined}
                                    tabIndex={!readOnly && !compact ? 0 : undefined}
                                    role={!readOnly && !compact ? 'group' : undefined}
                                    aria-label={!readOnly && !compact ? t('ui.dragHeaderTitle') : undefined}
                                    title={!readOnly && !compact ? t('ui.dragHeaderTitle') : undefined}
                                    sx={{
                                        position: { xs: 'relative', md: hasSpecialRules || !compact ? 'relative' : 'absolute' },
                                        gridArea: { md: !hasSpecialRules && !compact ? 'header' : 'auto' },
                                        gridColumn: hasSpecialRules ? 1 : undefined,
                                        gridRow: hasSpecialRules ? 1 : undefined,
                                        justifySelf: { md: hasSpecialRules || !compact ? 'center' : 'auto' },
                                        alignSelf: { md: !hasSpecialRules && !compact ? 'center' : 'auto' },
                                        top: { xs: compact ? 'auto' : `${titleAdjustment.y}px`, md: !compact ? `${titleAdjustment.y}px` : hasSpecialRules ? 'auto' : '50%' },
                                        left: { xs: compact ? 'auto' : `${titleAdjustment.x}px`, md: (() => {
                                            if (!compact) return `${titleAdjustment.x}px`;
                                            if (hasSpecialRules) return 'auto';
                                            const align = (script as any).textAlignment || 'center';
                                            if (align === 'right') return 'auto';
                                            if (align === 'left') return '5%';
                                            return '50%';
                                        })() },
                                        right: { xs: 'auto', md: !hasSpecialRules && compact && ((script as any).textAlignment || 'center') === 'right' ? '5%' : 'auto' },
                                        transform: hasSpecialRules && !compact
                                            ? `translateY(${specialRuleTitleTopOffset}px)`
                                            : {
                                                xs: 'none',
                                                md: compact && !hasSpecialRules
                                                    ? (((script as any).textAlignment || 'center') === 'center' ? 'translate(-50%, -50%)' : 'translate(0, -50%)')
                                                    : 'none',
                                            },
                                        zIndex: 'auto',
                                        maxWidth: {
                                            xs: `min(100%, max(120px, calc(100% + ${titleAdjustment.widthDelta}px)))`,
                                            md: hasSpecialRules ? `max(120px, calc(78% + ${titleAdjustment.widthDelta}px))` : inlineHeaderCredits
                                                ? `max(120px, calc(min(70%, max(0px, calc(100% - ${titleSafeInset * 2}px))) + ${titleAdjustment.widthDelta}px))`
                                                : compact ? '70%' : `max(120px, calc(70% + ${titleAdjustment.widthDelta}px))`
                                        },
                                        width: {
                                            xs: hasSpecialRules ? `max(120px, calc(100% - 16px + ${titleAdjustment.widthDelta}px))` : '100%',
                                            md: hasSpecialRules ? `max(120px, calc(78% + ${titleAdjustment.widthDelta}px))` : `max(120px, calc(100% + ${titleAdjustment.widthDelta}px))`
                                        },
                                        minHeight: titleAdjustment.minHeight ? `${titleAdjustment.minHeight}px` : undefined,
                                        display: 'flex',
                                        alignItems: 'center',
                                        pl: 0,
                                        pt: 0,
                                        touchAction: !readOnly && !compact ? 'none' : undefined,
                                        cursor: !readOnly && !compact ? 'move' : undefined,
                                        '&:hover > .layout-frame, &:focus-within > .layout-frame': { opacity: 1, visibility: 'visible' },
                                        '&:focus-visible': { outline: '2px dashed #526c55', outlineOffset: 2 },
                                        '@media print': {
                                            pt: 0,
                                            pl: 0,
                                            ...(inlineHeaderCredits && !hasSpecialRules ? {
                                                gridArea: 'header',
                                                justifySelf: 'center',
                                                alignSelf: 'center',
                                                width: `max(120px, calc(100% + ${titleAdjustment.widthDelta}px))`,
                                                maxWidth: `max(120px, calc(min(70%, max(0px, calc(100% - ${titleSafeInset * 2}px))) + ${titleAdjustment.widthDelta}px))`,
                                            } : {}),
                                        },
                                        justifyContent: (script as any).textAlignment === 'left' ? 'flex-start' : (script as any).textAlignment === 'right' ? 'flex-end' : 'center',
                                    }}
                                >
                                    {!compact && script.showTitleFlourish !== false && <Box className="title-flourish" aria-hidden="true" sx={{
                                        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                        width: { xs: `${95 * (script.titleFlourishScale ?? 1)}%`, md: `${110 * (script.titleFlourishScale ?? 1)}%` },
                                        height: `${125 * (script.titleFlourishScale ?? 1)}%`, pointerEvents: 'none',
                                        backgroundImage: 'url(/imgs/images/sources/pattern.png)', backgroundSize: 'contain',
                                        backgroundPosition: 'center', backgroundRepeat: 'no-repeat', opacity: 0.6, zIndex: 0,
                                    }} />}
                                    {!readOnly && !compact && <HeaderLayoutFrame target={titleLayoutTarget} moveLabel={t('ui.dragHeaderTitle')}
                                        resizeLabel={t('ui.resizeHeaderTitle')} moreLabel={t('ui.moreActions')}
                                        kind={script.useTitleImage && script.titleImage ? 'titleImage' : 'title'}
                                        editLabel={t('ui.edit')} onEdit={() => onTitleEdit('main')}
                                        onOpenMenu={titleMenu.openAtElement} onContextMenu={titleMenu.openAtPoint} />}
                                    {script.useTitleImage && script.titleImage ? (
                                        <Box
                                            data-title-image
                                            onDoubleClick={() => !readOnly && onTitleEdit?.('main')}
                                            sx={{
                                                position: 'relative',
                                                zIndex: backgroundIndex + 2,
                                                cursor: readOnly ? 'default' : compact ? 'pointer' : 'move',
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
                                        </Box>
                                    ) : (
                                        <Box
                                            onDoubleClick={() => !readOnly && onTitleEdit?.('main')}
                                            sx={{

                                                position: 'relative',
                                                zIndex: backgroundIndex + 2,
                                                cursor: readOnly ? 'default' : compact ? 'pointer' : 'move',
                                                display: 'flex',
                                                padding: 0,
                                                pt: '4px',
                                                borderRadius: 2,
                                                userSelect: 'none',
                                                width: '100%',
                                                justifyContent: (script as any).textAlignment === 'left' ? 'flex-start' : (script as any).textAlignment === 'right' ? 'flex-end' : 'center'
                                            }}
                                        >
                                            <Typography
                                                data-title-text
                                                ref={titleTextRef}
                                                variant="h3"
                                                component="div"
                                                sx={{
                                                    fontFamily: uiConfigStore.scriptTitleFont,
                                                    fontWeight: 'bold',
                                                    fontSize: compact
                                                        ? { xs: '1.1rem', sm: '1.4rem', md: '1.6rem' }
                                                        : {
                                                            xs: `calc(${uiConfigStore.titleFontSizeMd} * ${2.3 / 6 * COMPACT_SCALE})`,
                                                            sm: `calc(${uiConfigStore.titleFontSizeMd} * ${3.4 / 6 * COMPACT_SCALE})`,
                                                            md: hasSpecialRules
                                                                ? `calc(${uiConfigStore.titleFontSizeMd} * ${0.8 * COMPACT_SCALE})`
                                                                : fittedTitleSize && !compact ? `${fittedTitleSize}px` : `calc(${uiConfigStore.titleFontSizeMd} * ${COMPACT_SCALE})`
                                                          },
                                                    '@media print': hasSpecialRules && !compact ? {
                                                        fontSize: `calc(${uiConfigStore.titleFontSizeMd} * 0.8)`,
                                                    } : {},
                                                    lineHeight: uiConfigStore.config.titleLineHeight,
                                                    m: 0,
                                                    whiteSpace: 'pre-wrap',
                                                    textWrap: 'balance',
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
                                        </Box>
                                    )}
                                </Box>

                                {/* 特殊规则 */}
                                {hasSpecialRules && (
                                    <Box sx={{
                                        position: 'relative',
                                        zIndex: backgroundIndex + 2,
                                        '&:hover, &:focus-within': !readOnly && !compact ? { zIndex: backgroundIndex + 5 } : {},
                                        width: { xs: `min(100%, max(180px, calc(100% + ${ruleAdjustment.widthDelta}px)))`, md: ruleWidth },
                                        minWidth: 0,
                                        minHeight: ruleAdjustment.minHeight ? `${ruleAdjustment.minHeight}px` : undefined,
                                        display: 'flex',
                                        gridColumn: 2,
                                        gridRow: 1,
                                        mt: { xs: 0, md: '8px' },
                                        transform: {
                                            xs: `translate(${ruleAdjustment.x}px, ${ruleAdjustment.y}px)`,
                                            md: `translate(${ruleAdjustment.x}px, ${ruleAdjustment.y + headerExtra / 2 + (compact ? 0 : 22)}px)`,
                                        },
                                        alignSelf: { xs: 'center', md: 'end' },
                                        '@media print': {
                                            width: ruleWidth,
                                            alignSelf: 'end',
                                            transform: `translate(${ruleAdjustment.x}px, ${ruleAdjustment.y + headerExtra / 2 + (compact ? 0 : 22)}px)`,
                                        },
                                    }}>
                                        <SpecialRulesSection
                                            rules={script.specialRules}
                                            layoutTarget={ruleLayoutTarget}
                                            allowLayoutDrag={!readOnly && !compact}
                                            onDelete={readOnly ? undefined : onSpecialRuleDelete}
                                            onEdit={readOnly ? undefined : onSpecialRuleEdit}
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
                                <Box sx={{
                                    mt: hasSpecialRules && !compact ? 0 : 0.5,
                                    width: hasSpecialRules && !compact ? { xs: '100%', md: '43%' } : '100%',
                                    display: 'flex',
                                    justifyContent: authorAlignment === 'left' ? 'flex-start'
                                        : authorAlignment === 'right' ? 'flex-end' : 'center',
                                }}>
                                <Box
                                    data-header-layout-item="author-line"
                                    data-header-layout-target={authorLineLayoutTarget}
                                    data-layout-snap
                                    {...(!readOnly && !compact ? authorLineDrag : {})}
                                    tabIndex={!readOnly && !compact ? 0 : undefined}
                                    role={!readOnly && !compact ? 'group' : undefined}
                                    aria-label={!readOnly && !compact ? t('ui.dragHeaderAuthorLine') : undefined}
                                    title={!readOnly && !compact ? t('ui.dragHeaderAuthorLine') : undefined}
                                    onContextMenu={!readOnly && !compact ? authorLineMenu.openAtPoint : undefined}
                                    onKeyDown={!readOnly && !compact ? (event) => { authorLineMenu.openWithKeyboard(event); if (!event.defaultPrevented) authorLineDrag.onKeyDown(event); } : undefined}
                                    onDoubleClick={(event) => {
                                        if (readOnly || compact) return;
                                        event.stopPropagation();
                                        onTitleEdit('main');
                                    }}
                                    sx={{
                                        position: 'relative',
                                        zIndex: backgroundIndex + 2,
                                        width: 'fit-content',
                                        maxWidth: '100%',
                                        display: 'flex',
                                        justifyContent: authorAlignment === 'left'
                                            ? 'flex-start'
                                            : authorAlignment === 'right' ? 'flex-end' : 'center',
                                        transform: compact ? 'none' : `translate(${authorLineAdjustment.x}px, ${authorLineAdjustment.y}px)`,
                                        pointerEvents: !readOnly && !compact ? 'auto' : 'none',
                                        touchAction: !readOnly && !compact ? 'none' : undefined,
                                        cursor: !readOnly && !compact ? 'move' : undefined,
                                        '&:hover, &:focus-within': { zIndex: backgroundIndex + 6 },
                                        '&:hover > .layout-frame, &:focus-within > .layout-frame': { opacity: 1, visibility: 'visible' },
                                        '&:focus-visible': { outline: '2px dashed #526c55', outlineOffset: 2 },
                                    }}
                                >
                                    <Typography
                                        sx={{
                                            color: THEME_COLORS.paper.secondary,
                                            fontSize: { xs: '0.75rem', sm: '0.95rem' },
                                            textAlign: authorAlignment,
                                            whiteSpace: 'pre-wrap',
                                            pointerEvents: 'none',
                                        }}
                                    >
                                        {script.author ? `${t('script.author2')}${labelValueSeparator}${script.author}` : ''}
                                        {script.author && script.playerCount ? ' · ' : ''}
                                        {script.playerCount ? `${t('script.playerCount')}${labelValueSeparator}${script.playerCount}` : ''}
                                    </Typography>
                                    {!readOnly && !compact && <HeaderLayoutFrame
                                        target={authorLineLayoutTarget}
                                        moveLabel={t('ui.dragHeaderAuthorLine')}
                                        resizeLabel={t('ui.resizeHeaderTitle')}
                                        moreLabel={t('ui.moreActions')}
                                        editLabel={t('ui.edit')}
                                        onEdit={() => onTitleEdit('main')}
                                        resizable={false}
                                        onOpenMenu={authorLineMenu.openAtElement}
                                        onContextMenu={authorLineMenu.openAtPoint}
                                    />}
                                </Box>
                                </Box>
                            )}
                        </Box>

                        {/* 角色区域 */}
                        <Box sx={{
                            width: '100%',
                            position: 'relative',
                        }} data-header-content-start>
                            <Box sx={{ px: compact ? 0.5 : 3 }}>
                                {/* 按固定顺序显示标准团队 */}
                                {['townsfolk', 'outsider', 'minion', 'demon'].map(team => (
                                    script.characters[team] && script.characters[team].length > 0 && (
                                        <CharacterSection
                                            key={team}
                                            team={team}
                                            adjustHeaderHeight={team === firstHeaderTeam}
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
                                            adjustHeaderHeight={team === firstHeaderTeam}
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
                                            adjustHeaderHeight={team === firstHeaderTeam}
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
                            {!compact && (
                                <InlineStateRulesSection
                                    rules={(script.secondPageRules || []).filter((rule) => rule.isState && (!uiConfigStore.config.enableTwoPageMode || (rule.footerPage || 2) === 1))}
                                    legacyLists={(script.footerComponents || []).filter(item => item.type === 'list' && item.page === 1)}
                                    document={explanationForPage(script, 1, language, uiConfigStore.config.enableTwoPageMode)}
                                    onEdit={readOnly ? undefined : onEditExplanation}
                                    layout={script.footerComponents?.find(item => item.type === 'stateLayout' && item.page === 1)}
                                    containerRef={page2ContainerRef}
                                    onLayoutSave={readOnly ? undefined : saveFooterComponent}
                                />
                            )}
                        </Box>

                        {/* 移动端夜晚行动顺序 */}
                        {isMobile && (
                            <Box sx={{ mt: 2, display: 'flex', gap: 1.5, position: 'relative', zIndex: 1, px: { xs: 1, sm: 2, md: 3 } }}>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <NightOrder
                                        title={script.sideFirstNightTitle || t('firstNight')}
                                        onEditTitle={!readOnly && !compact ? () => onEditNightOrderTitle?.('first') : undefined}
                                        actions={script.firstnight}
                                        isMobile={true}
                                        disabled={readOnly || configStore.config.officialIdParseMode}
                                        onReorder={(oldIndex, newIndex) => onNightOrderReorder('first', oldIndex, newIndex)}
                                        compact={compact}
                                    />
                                </Box>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <NightOrder
                                        title={script.sideOtherNightTitle || t('otherNight')}
                                        onEditTitle={!readOnly && !compact ? () => onEditNightOrderTitle?.('other') : undefined}
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

                        {/* Background decoration - Tower Image Overlays */}
                        {!compact && (
                          <>
                            {uiConfigStore.config.theme === 'sakura' && (
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
                            )}
                            {uiConfigStore.activeTowerImages.map(img => (
                                <TowerImageOverlay
                                  key={img.id}
                                  image={img}
                                  onUpdate={(id, partial) => uiConfigStore.updateTowerImage(id, partial)}
                                  onDelete={(id) => uiConfigStore.removeTowerImage(id)}
                                  onDoubleClick={() => onOpenTowerImageDialog?.(1)}
                                  containerRef={page2ContainerRef}
                                  readOnly={readOnly}
                                />
                              ))}
                            {(script.footerComponents || []).filter(item => item.page === 1 && item.type !== 'stateLayout' && item.type !== 'list').map(item => (
                              <FooterOverlay key={item.id} item={item} containerRef={page2ContainerRef} readOnly={readOnly}
                                onSave={saveFooterComponent} onEdit={(value) => onEditFooterComponent?.(value)} onDelete={deleteFooterComponent} />
                            ))}
                            {/* Add and manage footer components. */}
                            {!readOnly && (
                              <Box sx={{ position: 'absolute', bottom: { xs: '190px', md: 'clamp(96px, 14vh, 190px)' }, right: 12, zIndex: 30, '@media print': { display: 'none' } }}>
                                <ScriptCanvasAddButton label={footerLabels.add} onClick={() => onOpenTowerImageDialog?.(1)} page={1} />
                              </Box>
                            )}
                          </>
                        )}

                        {/* An A4 page only reserves the actual bottom ornament; 20vh
                            of editor breathing room must not enlarge the export. */}
                        <Box data-footer-spacer sx={{ height: compact ? '5vh' : exportMode ? `${footerReserve[1]}px` : `max(20vh, ${footerReserve[1]}px)` }} />
                    </Paper>

                    {/* 右侧 - 其他夜晚 */}
                    {!isMobile && (
                        <Box id="night-order-right" data-night-order-side="other" sx={{
                            padding: compact ? 0.3 : 1.5,
                            flexShrink: 0,
                            position: 'relative',
                            backgroundImage: `url(${uiConfigStore.nightOrderBackgroundUrl})`,
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: "center",
                            pt: compact ? '2%' : `max(0px, calc(${uiConfigStore.config.nightOrderTopSpacingAuto ? '25%' : `${uiConfigStore.config.nightOrderTopSpacing}vh`} + ${uiConfigStore.config.nightOrderOffsets.other}px))`,
                            zIndex: 1,
                            boxShadow: 'none',
                            '& > *': {
                                position: 'relative',
                                zIndex: 1,
                            }
                        }}>
                            <NightOrder
                                title={script.sideOtherNightTitle || t('otherNight')}
                                titleDrag={!readOnly && !compact ? otherNightDrag : undefined}
                                onEditTitle={!readOnly && !compact ? () => onEditNightOrderTitle?.('other') : undefined}
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
                            id="footer-paper-2"
                            ref={page3ContainerRef}
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
                                paddingBottom: `${footerReserve[2]}px`,
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

                            <InlineStateRulesSection
                                rules={(script.secondPageRules || []).filter(rule => rule.isState && (rule.footerPage || 2) === 2)}
                                legacyLists={(script.footerComponents || []).filter(item => item.type === 'list' && item.page === 2)}
                                document={explanationForPage(script, 2, language, uiConfigStore.config.enableTwoPageMode)}
                                page={2}
                                layout={script.footerComponents?.find(item => item.type === 'stateLayout' && item.page === 2)}
                                containerRef={page3ContainerRef}
                                onLayoutSave={readOnly ? undefined : saveFooterComponent}
                                onEdit={readOnly ? undefined : onEditExplanation}
                            />

                            {/* Background decoration - Tower Image Overlays */}
                            {uiConfigStore.config.theme === 'sakura' && (
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
                            )}
                            {uiConfigStore.activeTowerImages.map(img => (
                                <TowerImageOverlay
                                  key={img.id}
                                  image={img}
                                  onUpdate={(id, partial) => uiConfigStore.updateTowerImage(id, partial)}
                                  onDelete={(id) => uiConfigStore.removeTowerImage(id)}
                                  onDoubleClick={() => onOpenTowerImageDialog?.(2)}
                                  containerRef={page3ContainerRef}
                                  readOnly={readOnly}
                                />
                              ))}
                            {(script.footerComponents || []).filter(item => item.page === 2 && item.type !== 'stateLayout' && item.type !== 'list').map(item => (
                              <FooterOverlay key={item.id} item={item} containerRef={page3ContainerRef} readOnly={readOnly}
                                onSave={saveFooterComponent} onEdit={(value) => onEditFooterComponent?.(value)} onDelete={deleteFooterComponent} />
                            ))}
                            {!readOnly && (
                              <Box sx={{ position: 'absolute', bottom: { xs: '190px', md: 'clamp(96px, 14vh, 190px)' }, right: 12, zIndex: 30, '@media print': { display: 'none' } }}>
                                <ScriptCanvasAddButton label={footerLabels.add} onClick={() => onOpenTowerImageDialog?.(2)} page={2} />
                              </Box>
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
                        isolation: 'isolate',
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
                                    zIndex: backgroundIndex + 4,
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
                                    zIndex: backgroundIndex + 4,
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
                                    zIndex: backgroundIndex + 4,
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
                                    zIndex: backgroundIndex + 4,
                                    userSelect: 'none',
                                    WebkitUserDrag: 'none',
                                }}
                            />
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
                                width: '56px',
                                boxShadow: 'none',
                            }}
                        />
                    )}

                    {/* Mittlere Seite */}
                    <Paper
                        elevation={0}
                        sx={storytellerNightPageSx}
                    >
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                                gap: { xs: 1.5, md: 2 },
                                alignItems: 'start',
                                px: { xs: 1.25, sm: 2.5, md: 3.5 },
                                pt: { xs: 2, md: 2.5 },
                                pb: { xs: 2, md: 2.5 },
                            }}
                        >
                            <Box sx={{ minWidth: 0, pt: '40px' }}>
                                {script.useStorytellerFirstNightTitleImage && script.storytellerFirstNightTitleImage ? (
                                    <CharacterImage
                                        src={script.storytellerFirstNightTitleImage}
                                        alt={displayedFirstNightTitle}
                                        sx={{
                                            display: 'block',
                                            maxWidth: '100%',
                                            maxHeight: `${Math.min(script.storytellerFirstNightTitleImageSize || 120, 96)}px`,
                                            objectFit: 'contain',
                                            mx: 'auto',
                                            mb: 0.5,
                                            cursor: readOnly ? 'default' : 'pointer',
                                        }}
                                        onDoubleClick={() => !readOnly && onTitleEdit?.('firstNight')}
                                    />
                                ) : (
                                    <Typography
                                        sx={storytellerColumnTitleSx}
                                        onDoubleClick={() => !readOnly && onTitleEdit?.('firstNight')}
                                    >
                                        {displayedFirstNightTitle}
                                    </Typography>
                                )}
                                <Box sx={{ mt: `${storytellerTitleContentSpacing}px` }}>
                                    <StorytellerNightOrderSheet
                                        characters={allCharacters}
                                        mode="firstNight"
                                    />
                                </Box>
                            </Box>

                            <Box sx={{ minWidth: 0, pt: '5px' }}>
                                {script.useStorytellerOtherNightTitleImage && script.storytellerOtherNightTitleImage ? (
                                    <CharacterImage
                                        src={script.storytellerOtherNightTitleImage}
                                        alt={displayedOtherNightTitle}
                                        sx={{
                                            display: 'block',
                                            maxWidth: '100%',
                                            maxHeight: `${Math.min(script.storytellerOtherNightTitleImageSize || 120, 96)}px`,
                                            objectFit: 'contain',
                                            mx: 'auto',
                                            mb: 0.5,
                                            cursor: readOnly ? 'default' : 'pointer',
                                        }}
                                        onDoubleClick={() => !readOnly && onTitleEdit?.('otherNight')}
                                    />
                                ) : (
                                    <Typography
                                        sx={storytellerColumnTitleSx}
                                        onDoubleClick={() => !readOnly && onTitleEdit?.('otherNight')}
                                    >
                                        {displayedOtherNightTitle}
                                    </Typography>
                                )}
                                <Box sx={{ mt: `${storytellerTitleContentSpacing}px` }}>
                                    <StorytellerNightOrderSheet
                                        characters={allCharacters}
                                        mode="otherNight"
                                    />
                                </Box>
                            </Box>
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
                                width: '56px',
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

export default memo(ScriptRenderer);
