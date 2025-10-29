import { Box, Typography, Paper, Menu, MenuItem, ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ContentCopy as CopyIcon, SwapHoriz as SwapIcon } from '@mui/icons-material';
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
import { configStore } from '../stores/ConfigStore';
import { alertSuccess, alertError } from '../utils/alert';

interface CharacterCardProps {
  character: Character;
  jinxInfo?: Record<string, string>;
  allCharacters?: Character[];
  onUpdate?: (characterId: string, updates: Partial<Character>) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
  onReplace?: (character: Character, position: { x: number; y: number }) => void;
}

const CharacterCard = observer(({ character, jinxInfo, allCharacters, onUpdate, onEdit, onDelete, onReplace }: CharacterCardProps) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
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
    // 卡片配置 - 移动端使用更小的内边距
    card: {
      paddingX: isMobile ? config.cardPaddingX * 0.5 : config.cardPaddingX,
      paddingY: isMobile ? config.cardPaddingY * 0.5 : config.cardPaddingY,
      borderRadius: config.cardBorderRadius,
      gap: isMobile ? config.cardGap * 0.6 : config.cardGap,
    },
    // 角色头像配置 - 移动端使用更小的图标
    avatar: isFabled ? {
      width: isMobile ? config.fabledIconWidthMd * 0.65 : config.fabledIconWidthMd,
      height: isMobile ? config.fabledIconHeightMd * 0.65 : config.fabledIconHeightMd,
      borderRadius: config.fabledIconBorderRadius,
    } : {
      width: isMobile ? config.avatarWidthMd * 0.65 : config.avatarWidthMd,
      height: isMobile ? config.avatarHeightMd * 0.65 : config.avatarHeightMd,
      borderRadius: config.avatarBorderRadius,
    },
    // 文本区域配置 - 移动端间距更紧凑
    textArea: {
      gap: isMobile ? config.textAreaGap * 0.6 : config.textAreaGap,
    },
    // 角色名字配置 - 移动端字体更小
    name: {
      fontSize: isMobile ? '0.95rem' : config.nameFontSizeMd,
      fontWeight: config.nameFontWeight,
      lineHeight: config.nameLineHeight,
    },
    // 角色描述配置 - 移动端字体更小
    description: {
      fontSize: isMobile ? '0.8rem' : config.descriptionFontSizeMd,
      lineHeight: config.descriptionLineHeight,
    },
    // 相克规则配置 - 移动端更紧凑
    jinx: {
      gap: isMobile ? config.jinxGap * 0.6 : config.jinxGap,
      padding: isMobile ? config.jinxPadding * 0.6 : config.jinxPadding,
      backgroundColor: '#EDE4D5',
      borderRadius: config.jinxBorderRadius,
      iconGap: isMobile ? config.jinxIconGap * 0.6 : config.jinxIconGap,
      // 相克规则中的角色图标 - 移动端更小
      icon: {
        width: isMobile ? config.jinxIconWidthMd * 0.65 : config.jinxIconWidthMd,
        height: isMobile ? config.jinxIconHeightMd * 0.65 : config.jinxIconHeightMd,
        borderRadius: config.jinxIconBorderRadius,
      },
      // 相克规则文字 - 移动端字体更小
      text: {
        fontSize: isMobile ? '0.75rem' : config.jinxTextFontSizeMd,
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
    // 无论是否在官方ID解析模式，都调用onEdit，由App.tsx统一处理提示
    if (onEdit) {
      onEdit(character);
    }
  };

  // 处理右键菜单
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // 无论是否在官方ID解析模式，都显示右键菜单，由各个菜单项处理
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

  // 处理复制JSON
  const handleCopyJson = async () => {
    handleClose();
    try {
      const characterJson = JSON.stringify(character, null, 2);
      await navigator.clipboard.writeText(characterJson);
      alertSuccess(t('character.jsonCopied'));
    } catch (err) {
      console.error('Failed to copy character JSON:', err);
      alertError(t('character.jsonCopyFailed'));
    }
  };

  // 处理更换角色
  const handleReplaceClick = () => {
    if (onReplace && contextMenu) {
      onReplace(character, { x: contextMenu.mouseX, y: contextMenu.mouseY });
    }
    handleClose();
  };

  return (
    <>
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          // 使用 CSS 控制按钮显示，避免 React 状态更新
          '&:hover .action-buttons': {
            opacity: 1,
            pointerEvents: 'auto',
          },
        }}
      >
        {/* 悬浮时显示的编辑和删除按钮 - 使用 CSS 控制显示 */}
        <Box
          className="action-buttons"
          sx={{
            position: 'absolute',
            top: isMobile ? 4 : 8,
            right: isMobile ? 4 : 8,
            zIndex: 10,
            display: 'flex',
            gap: isMobile ? 0.5 : 1,
            opacity: 0,
            pointerEvents: 'none',
            transition: 'opacity 0.2s',
          }}
        >
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (onEdit) {
                onEdit(character);
              }
            }}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
            }}
            size="small"
          >
            <EditIcon sx={{ fontSize: isMobile ? 16 : 20 }} />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.stopPropagation();
              if (onDelete) {
                onDelete(character);
              }
            }}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 1)',
              },
              width: isMobile ? 28 : 32,
              height: isMobile ? 28 : 32,
            }}
            size="small"
          >
            <DeleteIcon sx={{ fontSize: isMobile ? 16 : 20 }} />
          </IconButton>
        </Box>

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
            width: '100%',
            px: CONFIG.card.paddingX,
            py: CONFIG.card.paddingY,
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
          <Box sx={{
            width: "100%",
            display: "flex",
            gap: CONFIG.card.gap,
            alignItems: 'center',
            zIndex: 5,
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
                  __html: highlightAbilityText(character.ability, configStore.language),
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
                            borderRadius: 1.7,
                            gap: CONFIG.jinx.iconGap,
                            p: CONFIG.jinx.padding,
                            backgroundColor: CONFIG.jinx.backgroundColor,
                            // borderRadius: CONFIG.jinx.borderRadius,
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
      </Box>

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
        disableScrollLock={true}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              minWidth: 180,
              borderRadius: 2,
              overflow: 'hidden',
              mt: 0.5,
              '& .MuiList-root': {
                padding: '6px',
              },
            }
          }
        }}
        TransitionProps={{
          timeout: 200,
        }}
      >
        <MenuItem
          onClick={handleEditClick}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            px: 1.5,
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <EditIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('character.edit')}
            primaryTypographyProps={{
              fontSize: '0.9rem',
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleCopyJson}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            px: 1.5,
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <CopyIcon fontSize="small" sx={{ color: 'success.main' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('character.copyJson')}
            primaryTypographyProps={{
              fontSize: '0.9rem',
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleReplaceClick}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            px: 1.5,
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <SwapIcon fontSize="small" sx={{ color: 'warning.main' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('character.replace')}
            primaryTypographyProps={{
              fontSize: '0.9rem',
            }}
          />
        </MenuItem>
        <MenuItem
          onClick={handleDeleteClick}
          sx={{
            borderRadius: 1,
            mx: 0.5,
            px: 1.5,
            py: 1,
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <DeleteIcon fontSize="small" sx={{ color: 'error.main' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('character.delete')}
            primaryTypographyProps={{
              fontSize: '0.9rem',
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
});

export default CharacterCard;
