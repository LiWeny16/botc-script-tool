import { Box, Typography } from '@mui/material';
import { useRef } from 'react';
import type { SpecialRule, I18nText } from '../types';
import { uiConfigStore } from '../stores/UIConfigStore';
import { useTranslation } from '../utils/i18n';
import { observer } from 'mobx-react-lite';
import type { HeaderLayoutTarget } from '../utils/headerLayout';
import { useHeaderLayoutDrag } from './useHeaderLayoutDrag';
import HeaderLayoutFrame from './HeaderLayoutFrame';
import { useLayoutContextMenu } from './LayoutContextMenu';
import LayoutRowActions from './LayoutRowActions';

interface SpecialRulesSectionProps {
  rules: SpecialRule[];
  layoutTarget: HeaderLayoutTarget;
  allowLayoutDrag?: boolean;
  onDelete?: (rule: SpecialRule) => void;
  onEdit?: (rule: SpecialRule) => void;
}

const SpecialRulesSection = ({ rules, layoutTarget, allowLayoutDrag = false, onDelete, onEdit }: SpecialRulesSectionProps) => {
  const { t, language } = useTranslation();
  const moveDrag = useHeaderLayoutDrag(layoutTarget, 'move', true);
  const activeRule = useRef<SpecialRule | null>(null);
  const resetLayout = () => uiConfigStore.setHeaderLayout(layoutTarget, {
    x: 0,
    y: 0,
    widthDelta: 0,
    minHeight: 0,
    scale: 1,
  });
  const menu = useLayoutContextMenu(
    { edit: t('ui.edit'), reset: t('ui.resetLayout'), remove: t('ui.delete') },
    {
      edit: onEdit ? () => {
        const rule = activeRule.current;
        if (rule) onEdit(rule);
      } : undefined,
      reset: allowLayoutDrag ? resetLayout : undefined,
      remove: onDelete ? () => {
        const rule = activeRule.current;
        if (rule) onDelete(rule);
      } : undefined,
    },
  );

  const titleFontBase = parseFloat(uiConfigStore.specialRuleTitleFontSize || '1.5');
  const contentFontBase = parseFloat(uiConfigStore.specialRuleContentFontSize || '1.15');
  const createResponsiveFontSize = (base: number) => ({
    xs: `${Math.max(base * 0.9, 0.1)}rem`,
    sm: `${Math.max(base * 0.95, 0.1)}rem`,
    md: `${Math.max(base, 0.1)}rem`,
  });

  if (!rules || rules.length === 0) return null;

  const openSectionMenu = (event: React.MouseEvent<HTMLElement>) => {
    activeRule.current = rules[0] ?? null;
    menu.openAtPoint(event);
  };
  const openRuleMenu = (event: React.MouseEvent<HTMLElement>, rule: SpecialRule) => {
    activeRule.current = rule;
    menu.openAtPoint(event);
  };
  const openFrameMenu = (event: React.MouseEvent<HTMLElement>) => {
    if (!activeRule.current || !rules.some(rule => rule.id === activeRule.current?.id)) activeRule.current = rules[0] ?? null;
    menu.openAtElement(event);
  };
  const openSectionMenuWithKeyboard = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return;
    activeRule.current = rules[0] ?? null;
    menu.openWithKeyboard(event);
  };

  const getLocalizedText = (text: string | I18nText | undefined): string => {
    if (!text) return '';
    if (typeof text === 'string') return text;
    return text[language] || (language === 'cn' ? text.en : text.en || text.cn) || '';
  };

  const renderLines = (text: string) => text.split(/\\n|<br\s*\/?>/i).map((line, index, array) => (
    <span key={index}>{line}{index < array.length - 1 && <br />}</span>
  ));

  return (
    <Box className="special-rules" data-header-layout-item="rule" data-header-layout-target={layoutTarget} data-layout-snap
      {...(allowLayoutDrag ? moveDrag : {})}
      onContextMenu={openSectionMenu}
      onKeyDown={(event) => { openSectionMenuWithKeyboard(event); if (!event.defaultPrevented && allowLayoutDrag) moveDrag.onKeyDown(event); }}
      tabIndex={allowLayoutDrag ? 0 : undefined}
      role={allowLayoutDrag ? 'group' : undefined}
      aria-label={allowLayoutDrag ? t('ui.dragHeaderRule') : undefined}
      title={allowLayoutDrag ? t('ui.dragHeaderRule') : undefined}
      sx={{
      width: '100%',
      minWidth: 0,
      flex: 1,
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      boxSizing: 'border-box',
      // Preserve the folded corner and fine border as the parchment grows.
      border: '1px solid transparent',
      borderImage: 'url(/imgs/images/sources/special-rule-header-v3.png) 210 300 160 300 fill / 30px 43px 23px 43px / 0 stretch',
      px: 'clamp(22px, 5.5%, 32px)',
      py: '18px',
      cursor: allowLayoutDrag ? 'move' : undefined,
      touchAction: allowLayoutDrag ? 'none' : undefined,
      '&:hover > .layout-frame, &:focus-within > .layout-frame': { opacity: 1, visibility: 'visible' },
      ...(rules.length > 1 ? {
        '&:has(.special-rule:hover) > .layout-frame .layout-actions, &:has(.special-rule:focus-within) > .layout-frame .layout-actions': { visibility: 'hidden', opacity: 0 },
      } : {}),
      '@media print': { py: '17px' },
    }}>
      {rules.map((rule, ruleIndex) => {
        const title = getLocalizedText(rule.title);
        const content = getLocalizedText(rule.content);
        const hasBody = Boolean(content || rule.rules?.length);

        return (
          <Box
            key={rule.id}
            className="special-rule"
            tabIndex={allowLayoutDrag && rules.length > 1 ? 0 : undefined}
            onPointerEnter={() => { activeRule.current = rule; }}
            onDoubleClick={() => onEdit?.(rule)}
            onContextMenu={(event) => openRuleMenu(event, rule)}
            onKeyDown={(event) => {
              activeRule.current = rule;
              menu.openWithKeyboard(event);
            }}
            sx={{
              position: 'relative',
              minWidth: 0,
              mt: ruleIndex > 0 ? '10px' : 0,
              pt: ruleIndex > 0 ? '10px' : 0,
              borderTop: ruleIndex > 0 ? '1px solid rgba(130, 105, 65, 0.3)' : 0,
              cursor: allowLayoutDrag ? 'move' : onEdit ? 'pointer' : 'default',
              '&:hover > .layout-row-actions, &:focus-within > .layout-row-actions': { opacity: 1, visibility: 'visible', pointerEvents: 'auto' },
              '@media print': {
                pt: ruleIndex > 0 ? '10px' : 0,
                pb: 0,
                breakInside: 'avoid',
              },
            }}
          >
            {allowLayoutDrag && rules.length > 1 && <LayoutRowActions editLabel={t('ui.edit')} moreLabel={t('ui.moreActions')}
              onEdit={onEdit ? () => onEdit(rule) : undefined}
              onOpenMenu={(event) => { activeRule.current = rule; menu.openAtElement(event); }} />}
            {title && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5em', minWidth: 0 }}>
                <Box component="span" aria-hidden="true" sx={{ color: '#927044', fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>✥</Box>
                <Typography
                  component="div"
                  sx={{
                    minWidth: 0,
                    fontFamily: uiConfigStore.specialRuleTitleFont,
                    fontWeight: 'bold',
                    color: '#543a24',
                    fontSize: createResponsiveFontSize(titleFontBase),
                    lineHeight: 1.2,
                    textAlign: 'center',
                    textWrap: 'balance',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {renderLines(title)}
                </Typography>
                <Box component="span" aria-hidden="true" sx={{ color: '#927044', fontSize: '1.3rem', lineHeight: 1, flexShrink: 0 }}>✥</Box>
              </Box>
            )}
            {title && hasBody && (
              <Box aria-hidden="true" sx={{
                width: '70%',
                height: '1px',
                mx: 'auto',
                my: '5px',
                background: 'linear-gradient(90deg, transparent, rgba(142, 108, 53, 0.65), transparent)',
              }} />
            )}
            {content && (
              <Typography
                component="div"
                sx={{
                  fontFamily: uiConfigStore.specialRuleContentFont,
                  color: '#39291e',
                  fontWeight: 500,
                  fontSize: createResponsiveFontSize(contentFontBase),
                  lineHeight: 1.3,
                  textAlign: 'left',
                  overflowWrap: 'anywhere',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {renderLines(content)}
              </Typography>
            )}
            {rule.rules?.map((item, index) => (
              <Box key={index} sx={{ mt: content || index > 0 ? 1 : 0 }}>
                {item.title && (
                  <Typography component="div" sx={{
                    fontFamily: uiConfigStore.specialRuleTitleFont,
                    fontWeight: 'bold',
                    fontSize: createResponsiveFontSize(contentFontBase),
                    lineHeight: 1.35,
                    color: '#543a24',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {renderLines(item.title)}
                  </Typography>
                )}
                {item.content && (
                  <Typography component="div" sx={{
                    fontFamily: uiConfigStore.specialRuleContentFont,
                    color: '#39291e',
                    fontWeight: 500,
                    fontSize: createResponsiveFontSize(contentFontBase),
                    lineHeight: 1.3,
                    textAlign: 'left',
                    overflowWrap: 'anywhere',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {renderLines(item.content)}
                  </Typography>
                )}
              </Box>
            ))}
          </Box>
        );
      })}
      {allowLayoutDrag && <HeaderLayoutFrame target={layoutTarget} moveLabel={t('ui.dragHeaderRule')}
        resizeLabel={t('ui.resizeHeaderRule')} moreLabel={t('ui.moreActions')}
        editLabel={t('ui.edit')} onEdit={onEdit ? () => onEdit(activeRule.current || rules[0]) : undefined}
        onOpenMenu={openFrameMenu} onContextMenu={openSectionMenu} />}
      {menu.element}
    </Box>
  );
};

export default observer(SpecialRulesSection);
