import { Box, Typography, Paper, Menu, MenuItem, ListItemIcon, ListItemText, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ContentCopy as CopyIcon, SwapHoriz as SwapIcon } from '@mui/icons-material';
import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import type { Character, JinxInfo } from '../types';
import MarkdownRenderer from './MarkdownRenderer';
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
  jinxInfo?: Record<string, JinxInfo>;
  allCharacters?: Character[];
  onUpdate?: (characterId: string, updates: Partial<Character>) => void;
  onEdit?: (character: Character) => void;
  onDelete?: (character: Character) => void;
  onReplace?: (character: Character, position: { x: number; y: number }) => void;
  readOnly?: boolean;
  compact?: boolean;
}

const CharacterCard = observer(({ character, jinxInfo, allCharacters, onUpdate, onEdit, onDelete, onReplace, readOnly = false, compact = false }: CharacterCardProps) => {
  const COMPACT_SCALE = compact ? 0.47 : 1;
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const isReadOnly = readOnly;

  // Get config from uiConfigStore
  const config = uiConfigStore.config.characterCard;

  // Check if character is Fabled or Loric
  const isFabled = character.team === 'fabled' || character.team === 'loric';

  // Unified config
  const CONFIG = {
    // Card config - smaller padding on mobile, compact scales further
    card: {
      paddingX: (isMobile ? config.cardPaddingX * 0.5 : config.cardPaddingX) * COMPACT_SCALE,
      paddingY: (isMobile ? config.cardPaddingY * 0.5 : config.cardPaddingY) * COMPACT_SCALE,
      borderRadius: config.cardBorderRadius,
      gap: (isMobile ? config.cardGap * 0.6 : config.cardGap) * COMPACT_SCALE,
    },
    // Character avatar config - smaller icons on mobile, compact scales further
    avatar: isFabled ? {
      width: (isMobile ? config.fabledIconWidthMd * 0.65 : config.fabledIconWidthMd) * COMPACT_SCALE,
      height: (isMobile ? config.fabledIconHeightMd * 0.65 : config.fabledIconHeightMd) * COMPACT_SCALE,
      borderRadius: config.fabledIconBorderRadius,
    } : {
      width: (isMobile ? config.avatarWidthMd * 0.65 : config.avatarWidthMd) * COMPACT_SCALE,
      height: (isMobile ? config.avatarHeightMd * 0.65 : config.avatarHeightMd) * COMPACT_SCALE,
      borderRadius: config.avatarBorderRadius,
    },
    // Text area config - tighter spacing on mobile
    textArea: {
      gap: (isMobile ? config.textAreaGap * 0.6 : config.textAreaGap) * COMPACT_SCALE,
    },
    // Character name config - smaller font on mobile
    name: {
      fontSize: isMobile ? '0.95rem' : `calc(${config.nameFontSizeMd} * ${COMPACT_SCALE})`,
      fontWeight: config.nameFontWeight,
      lineHeight: config.nameLineHeight,
    },
    // Character description config - smaller font on mobile
    description: {
      fontSize: isMobile ? '0.8rem' : `calc(${config.descriptionFontSizeMd} * ${COMPACT_SCALE})`,
      lineHeight: config.descriptionLineHeight,
    },
    // Jinx rule config - more compact on mobile
    jinx: {
      gap: (isMobile ? config.jinxGap * 0.6 : config.jinxGap) * COMPACT_SCALE,
      padding: (isMobile ? config.jinxPadding * 0.6 : config.jinxPadding) * COMPACT_SCALE,
      backgroundColor: uiConfigStore.config.theme === 'sakura' ? 'rgba(255, 218, 224, 0.5)' : '#EDE4D5',
      borderRadius: config.jinxBorderRadius,
      iconGap: (isMobile ? config.jinxIconGap * 0.6 : config.jinxIconGap) * COMPACT_SCALE,
      // Jinx rule character icons - smaller on mobile
      icon: {
        width: (isMobile ? config.jinxIconWidthMd * 0.65 : config.jinxIconWidthMd) * COMPACT_SCALE,
        height: (isMobile ? config.jinxIconHeightMd * 0.65 : config.jinxIconHeightMd) * COMPACT_SCALE,
        borderRadius: config.jinxIconBorderRadius,
      },
      // Jinx rule text - smaller font on mobile
      text: {
        fontSize: isMobile ? '0.75rem' : `calc(${config.jinxTextFontSizeMd} * ${COMPACT_SCALE})`,
        lineHeight: config.jinxTextLineHeight,
        fontStyle: 'italic',
      },
    },
  };

  // Determine name color based on team type
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
        // Unknown team uses getTeamColor, supports custom colors
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

  // Handle double-click event
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    // Always call onEdit regardless of official ID parse mode; App.tsx handles the prompt
    if (onEdit) {
      onEdit(character);
    }
  };

  // Handle context menu
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    // Always show context menu regardless of official ID parse mode; each menu item handles its own logic
    setContextMenu(
      contextMenu === null
        ? {
          mouseX: event.clientX + 2,
          mouseY: event.clientY - 6,
        }
        : null,
    );
  };

  // Close context menu
  const handleClose = () => {
    setContextMenu(null);
  };

  // Handle edit
  const handleEditClick = () => {
    handleClose();
    if (isReadOnly) return;
    if (onEdit) {
      onEdit(character);
    }
  };

  // Handle delete
  const handleDeleteClick = () => {
    handleClose();
    if (isReadOnly) return;
    if (onDelete) {
      onDelete(character);
    }
  };

  // Handle copy JSON
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

  // Handle replace character
  const handleReplaceClick = () => {
    if (isReadOnly) {
      handleClose();
      return;
    }
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
          // Use CSS to control button visibility, avoiding React state updates
          ...(isReadOnly
            ? {}
            : {
              '&:hover .action-buttons': {
                opacity: 1,
                pointerEvents: 'auto',
              },
            }),
        }}
      >
        {/* Edit and delete buttons shown on hover - CSS controlled */}
        {!isReadOnly && (
          <Box
            className="action-buttons"
            sx={{
              position: 'absolute',
              top: isMobile ? 4 : 8,
              right: isMobile ? 4 : 8,
              zIndex: 20,
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
        )}

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
            zIndex: 10,
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
            zIndex: 10,
          }}>
            {/* Character avatar */}
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

            {/* Character info: name + description + jinx rules */}
            {compact ? (
              /* 紧凑模式：名字和相克图标同行，能力在下一行 */
              <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0.1 * COMPACT_SCALE }}>
                {/* 第一行：名字 + 相克图标 */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: CONFIG.jinx.iconGap, flexWrap: 'wrap' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: CONFIG.name.fontWeight,
                      fontSize: CONFIG.name.fontSize,
                      color: nameColor,
                      lineHeight: CONFIG.name.lineHeight,
                      fontFamily: uiConfigStore.characterNameFont,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {character.name}
                  </Typography>
                  {jinxInfo && (() => {
                    const visibleJinx = Object.entries(jinxInfo).filter(([_, jinxData]) => jinxData.display !== false);
                    return visibleJinx.length > 0 && (
                      <>
                        <CharacterImage
                          src="https://oss.gstonegames.com/data_file/clocktower/web/icons/djinn.png"
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
                        <Typography sx={{ fontSize: `${0.55 * COMPACT_SCALE}rem`, color: '#8B7355', fontWeight: 700, whiteSpace: 'nowrap' }}>
                          ×{visibleJinx.length}
                        </Typography>
                      </>
                    );
                  })()}
                </Box>
                {/* 第二行：能力描述（紧凑模式限制2行） */}
                <Box
                  sx={{
                    fontSize: CONFIG.description.fontSize,
                    lineHeight: CONFIG.description.lineHeight,
                    color: THEME_COLORS.text.tertiary,
                    fontFamily: uiConfigStore.characterAbilityFont,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    '& p': { m: 0, display: 'inline' },
                    '& ul, & ol': { m: 0, pl: 2, display: 'inline-block' },
                  }}
                >
                  <MarkdownRenderer content={character.ability} />
                </Box>
              </Box>
            ) : (
              /* 普通模式：原布局 */
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

                <Box
                  sx={{
                    fontSize: CONFIG.description.fontSize,
                    lineHeight: CONFIG.description.lineHeight,
                    color: THEME_COLORS.text.tertiary,
                    fontFamily: uiConfigStore.characterAbilityFont,
                    '& p': { m: 0, '&:not(:last-child)': { mb: 0.25 } },
                    '& ul, & ol': { m: 0, pl: 2.5 },
                    '& li': { '&:not(:last-child)': { mb: 0.25 } },
                  }}
                >
                  <MarkdownRenderer content={character.ability} />
                </Box>

                {/* Jinx rules - below description text, left-aligned */}
                {jinxInfo && (() => {
                // Filter out jinx rules with display set to false, and apply single-side hiding
                const visibleJinxEntries = Object.entries(jinxInfo).filter(([targetName, jinxData]) => {
                  if (jinxData.display === false) return false;
                  if (configStore.config.hideDuplicateJinx) {
                    const targetChar = allCharacters?.find(c => c.name === targetName);
                    if (targetChar && character.id > targetChar.id) return false;
                  }
                  return true;
                });
                return visibleJinxEntries.length > 0 && (
                  // Two-page mode or compact: show only djinn icon and jinx character icons in a row
                  (uiConfigStore.config.enableTwoPageMode || compact) ? (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: CONFIG.jinx.iconGap,
                      flexWrap: 'wrap',
                    }}>
                      {/* Djinn icon */}
                      <CharacterImage
                        src="https://oss.gstonegames.com/data_file/clocktower/web/icons/djinn.png"
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
                      {/* All jinx character icons */}
                      {visibleJinxEntries.map(([targetName, _]) => {
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
                    // Single-page mode: keep original detailed display
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: CONFIG.jinx.gap }}>
                      {visibleJinxEntries.map(([targetName, jinxData]) => {
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
                              {t('jinx.rule')}: {jinxData.reason}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  )
                );
              })()}
            </Box>
            )}
          </Box>
        </Paper>
      </Box>

      {/* Context menu */}
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
          disabled={isReadOnly}
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
          disabled={isReadOnly}
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
          disabled={isReadOnly}
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
