import { Box, Typography, Paper, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { Character } from '../types';
import { highlightAbilityText } from '../utils/scriptGenerator';
import { THEME_COLORS, getTeamColor } from '../theme/colors';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CharacterImage from './CharacterImage';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';

interface CharacterCardProps {
  character: Character;
  jinxInfo?: Record<string, string>;
  allCharacters?: Character[];
  onUpdate?: (characterId: string, updates: Partial<Character>) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
}

const CharacterCard = observer(({ character, jinxInfo, allCharacters, onUpdate, onEdit, onDelete }: CharacterCardProps) => {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  // 从 uiConfigStore 获取配置
  const config = uiConfigStore.config.characterCard;

  // 判断是否是传奇角色
  const isFabled = character.team === 'fabled';

  // 统一配置
  const CONFIG = {
    // 卡片配置
    card: {
      padding: config.cardPadding,
      borderRadius: config.cardBorderRadius,
      gap: config.cardGap,
    },
    // 角色头像配置 - 传奇角色使用专用图标大小
    avatar: isFabled ? {
      width: config.fabledIconWidthMd,
      height: config.fabledIconHeightMd,
      borderRadius: config.fabledIconBorderRadius,
    } : {
      width: config.avatarWidthMd,
      height: config.avatarHeightMd,
      borderRadius: config.avatarBorderRadius,
    },
    // 文本区域配置
    textArea: {
      gap: config.textAreaGap,
    },
    // 角色名字配置
    name: {
      fontSize: config.nameFontSizeMd,
      fontWeight: config.nameFontWeight,
      lineHeight: config.nameLineHeight,
    },
    // 角色描述配置
    description: {
      fontSize: config.descriptionFontSizeMd,
      lineHeight: config.descriptionLineHeight,
    },
    // 相克规则配置
    jinx: {
      gap: config.jinxGap,
      padding: config.jinxPadding,
      backgroundColor: '#EDE4D5',
      borderRadius: config.jinxBorderRadius,
      iconGap: config.jinxIconGap,
      // 相克规则中的角色图标
      icon: {
        width: config.jinxIconWidthMd,
        height: config.jinxIconHeightMd,
        borderRadius: config.jinxIconBorderRadius,
      },
      // 相克规则文字
      text: {
        fontSize: config.jinxTextFontSizeMd,
        lineHeight: config.jinxTextLineHeight,
        fontStyle: 'italic',
      },
    },
  };

  // 根据团队类型确定名字颜色
  const getNameColor = () => {
    switch (character.team) {
      case 'townsfolk':
      case 'outsider':
        return THEME_COLORS.good;
      case 'minion':
      case 'demon':
        return THEME_COLORS.evil;
      case 'fabled':
        return THEME_COLORS.fabled;
      case 'traveler':
        return THEME_COLORS.purple;
      default:
        // 未知团队使用getTeamColor，支持自定义颜色
        return getTeamColor(character.team, character.teamColor);
    }
  };

  const nameColor = getNameColor();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: character.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // 处理双击事件
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(character);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : null,
    );
  };

  // 关闭右键菜单
  const handleClose = () => {
    setContextMenu(null);
  };

  // 处理编辑
  const handleEditClick = () => {
    handleClose();
    if (onEdit) {
      onEdit(character);
    }
  };

  // 处理删除
  const handleDeleteClick = () => {
    handleClose();
    if (onDelete) {
      onDelete(character);
    }
  };

  return (
    <>
      <Paper
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        elevation={isDragging ? 6 : 0}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          p: CONFIG.card.padding,
          backgroundColor: 'transparent',
          borderRadius: CONFIG.card.borderRadius,
          transition: 'all 0.2s',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
          zIndex: 1,
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.02)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          },
        }}
      >
        {/* 上半部分: 角色头像 + 角色信息 */}
        <Box sx={{
          width: "100%",
          display: "flex",
          gap: CONFIG.card.gap,
          alignItems: 'center',
        }}>
          {/* 角色头像 */}
          <CharacterImage
            src={character.image}
            alt={character.name}
            sx={{
              width: CONFIG.avatar.width,
              height: CONFIG.avatar.height,
              borderRadius: CONFIG.avatar.borderRadius,
              objectFit: 'cover',
              flexShrink: 0,
              userDrag: 'none',
              WebkitUserDrag: 'none',
              pointerEvents: 'none',
            }}
          />

          {/* 角色信息：名字 + 描述 + 相克规则 */}
          <Box sx={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: CONFIG.textArea.gap,
          }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: CONFIG.name.fontWeight,
                fontSize: CONFIG.name.fontSize,
                color: nameColor,
                lineHeight: CONFIG.name.lineHeight,
                fontFamily: uiConfigStore.characterNameFont,
              }}
            >
              {character.name}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                fontSize: CONFIG.description.fontSize,
                lineHeight: CONFIG.description.lineHeight,
                color: THEME_COLORS.text.tertiary,
                fontFamily: uiConfigStore.characterAbilityFont,
              }}
              dangerouslySetInnerHTML={{
                __html: highlightAbilityText(character.ability),
              }}
            />

            {/* 相克规则 - 放在描述文本下方,与描述文本左对齐 */}
            {jinxInfo && Object.keys(jinxInfo).length > 0 && (
              // 双页面模式：只显示灯神图标和相克角色图标的横排
              uiConfigStore.config.enableTwoPageMode ? (
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: CONFIG.jinx.iconGap,
                  flexWrap: 'wrap',
                }}>
                  {/* 灯神图标 */}
                  <CharacterImage
                    src="https://wiki.bloodontheclocktower.com/images/8/86/Icon_djinn.png"
                    alt="Jinx Icon"
                    sx={{
                      width: CONFIG.jinx.icon.width,
                      height: CONFIG.jinx.icon.height,
                      borderRadius: CONFIG.jinx.icon.borderRadius,
                      flexShrink: 0,
                      userDrag: 'none',
                      WebkitUserDrag: 'none',
                      pointerEvents: 'none',
                    }}
                  />
                  {/* 所有相克的角色图标 */}
                  {Object.keys(jinxInfo).map((targetName) => {
                    const targetChar = allCharacters?.find((c) => c.name === targetName);
                    return targetChar ? (
                      <CharacterImage
                        key={targetName}
                        src={targetChar.image}
                        alt={targetName}
                        sx={{
                          width: CONFIG.jinx.icon.width,
                          height: CONFIG.jinx.icon.height,
                          borderRadius: CONFIG.jinx.icon.borderRadius,
                          flexShrink: 0,
                          userDrag: 'none',
                          WebkitUserDrag: 'none',
                          pointerEvents: 'none',
                        }}
                      />
                    ) : null;
                  })}
                </Box>
              ) : (
                // 单页面模式：保持原有的详细展示
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: CONFIG.jinx.gap }}>
                  {Object.entries(jinxInfo).map(([targetName, jinxText]) => {
                    const targetChar = allCharacters?.find((c) => c.name === targetName);
                    return (
                      <Box
                        key={targetName}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: CONFIG.jinx.iconGap,
                          p: CONFIG.jinx.padding,
                          backgroundColor: CONFIG.jinx.backgroundColor,
                          borderRadius: CONFIG.jinx.borderRadius,
                        }}
                      >
                        {targetChar && (
                          <CharacterImage
                            src={targetChar.image}
                            alt={targetName}
                            sx={{
                              width: CONFIG.jinx.icon.width,
                              height: CONFIG.jinx.icon.height,
                              borderRadius: CONFIG.jinx.icon.borderRadius,
                              flexShrink: 0,
                              userDrag: 'none',
                              WebkitUserDrag: 'none',
                              pointerEvents: 'none',
                            }}
                          />
                        )}
                        <Typography
                          variant="caption"
                          sx={{
                            fontSize: CONFIG.jinx.text.fontSize,
                            color: THEME_COLORS.text.primary,
                            lineHeight: CONFIG.jinx.text.lineHeight,
                            fontStyle: `${CONFIG.jinx.text.fontStyle} !important`,
                            flex: 1,
                          }}
                        >
                          {t('jinx.rule')}: {jinxText}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              )
            )}
          </Box>
        </Box>
      </Paper>

      {/* 右键菜单 */}
      <Menu
        open={contextMenu !== null}
        onClose={handleClose}
        anchorReference="anchorPosition"
        anchorPosition={
          contextMenu !== null
            ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
            : undefined
        }
      >
        <MenuItem onClick={handleEditClick}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('character.edit')}</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeleteClick}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('character.delete')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
});

export default CharacterCard;
