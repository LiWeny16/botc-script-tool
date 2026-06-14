import { Box, Typography, Divider, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { Add as AddIcon, PersonAdd as PersonAddIcon } from '@mui/icons-material';
import { useState, type ReactNode } from 'react';
import type { Character, Script } from '../types';
import { TEAM_COLORS } from '../data/characters/characters';
import { THEME_COLORS, getTeamColor, getTeamName } from '../theme/colors';
import { useTranslation } from '../utils/i18n';
import { configStore } from '../stores/ConfigStore';
import { uiConfigStore } from '../stores/UIConfigStore';
import CharacterCard from './CharacterCard';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface CharacterSectionProps {
  team: string;
  characters: Character[];
  script: Script;
  onReorder: (team: string, newOrder: string[], columnLeftCount?: number) => void;
  onUpdateCharacter?: (characterId: string, updates: Partial<Character>) => void;
  onEditCharacter?: (character: Character) => void;
  onDeleteCharacter?: (character: Character) => void;
  onReplaceCharacter?: (character: Character, position: { x: number; y: number }) => void;
  onAddCustomCharacter?: (team: string) => void;
  disableDrag?: boolean;
  readOnly?: boolean;
  compact?: boolean;
}

type ColumnSide = 'left' | 'right';

interface CharacterColumnProps {
  side: ColumnSide;
  children: ReactNode;
  isEmpty: boolean;
}

const CharacterColumn = ({ side, children, isEmpty }: CharacterColumnProps) => {
  return (
    <Box
      data-column-side={side}
      sx={{
        flex: 1,
        minWidth: 0,
        minHeight: isEmpty ? 44 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
        borderRadius: 1,
      }}
    >
      {children}
    </Box>
  );
};

interface ColumnBreakDropZoneProps {
  id: string;
}

const ColumnBreakDropZone = ({ id }: ColumnBreakDropZoneProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Box
      ref={setNodeRef}
      aria-label="change column split"
      sx={{
        flex: '0 0 auto',
        height: 40,
        width: '100%',
        borderRadius: 1,
        border: `2px dashed ${isOver ? THEME_COLORS.good : 'rgba(0, 122, 204, 0.72)'}`,
        backgroundColor: isOver ? 'rgba(0, 122, 204, 0.16)' : 'rgba(255, 255, 255, 0.82)',
        color: isOver ? THEME_COLORS.good : THEME_COLORS.good,
        boxShadow: isOver
          ? '0 4px 14px rgba(0, 122, 204, 0.22)'
          : '0 2px 10px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'auto',
        transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
      }}
    >
      <AddIcon sx={{ fontSize: 24, strokeWidth: 2.4 }} />
    </Box>
  );
};

const pointerFirstCollisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);
  return pointerCollisions.length > 0 ? pointerCollisions : closestCorners(args);
};

const CharacterSection = observer(({
  team, characters, script, onReorder, onUpdateCharacter, onEditCharacter,
  onDeleteCharacter, onReplaceCharacter, onAddCustomCharacter,
  disableDrag = false, readOnly = false, compact = false,
}: CharacterSectionProps) => {
  const COMPACT_SCALE = compact ? 0.47 : 1;
  const { t } = useTranslation();
  const isChinese = configStore.language === 'cn';

  const [contextMenu, setContextMenu] = useState<{
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    if (readOnly || !onAddCustomCharacter) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu(
      contextMenu === null
        ? { mouseX: event.clientX + 2, mouseY: event.clientY - 6 }
        : null,
    );
  };

  const handleClose = () => {
    setContextMenu(null);
  };

  const handleCreateCustom = () => {
    handleClose();
    onAddCustomCharacter?.(team);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: disableDrag ? { distance: 999999 } : { distance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  if (characters.length === 0) return null;

  const standardTeams = ['townsfolk', 'outsider', 'minion', 'demon', 'fabled', 'loric', 'traveler'];
  const isStandardTeam = standardTeams.includes(team);
  const teamLabel = !isStandardTeam || team === 'fabled' || team === 'loric' || team === 'traveler'
    ? ''
    : team === 'townsfolk' || team === 'outsider' ? t('team.good') : t('team.evil');
  const customColor = characters.length > 0 ? characters[0].teamColor : undefined;
  const teamLabelColor =
    team === 'fabled' ? THEME_COLORS.fabled : team === 'loric' ? THEME_COLORS.loric
    : team === 'traveler' ? THEME_COLORS.purple
    : team === 'townsfolk' || team === 'outsider' ? THEME_COLORS.good
    : team === 'minion' || team === 'demon' ? THEME_COLORS.evil
    : getTeamColor(team, customColor);

  const getTranslatedTeamName = (teamKey: string): string => {
    const m: Record<string, string> = {
      townsfolk: t('team.townsfolk'), outsider: t('team.outsider'),
      minion: t('team.minion'), demon: t('team.demon'),
      fabled: t('team.fabled'), loric: t('team.loric'), traveler: t('team.traveler'),
    };
    return m[teamKey] || getTeamName(teamKey);
  };

  // Use stored leftCount (default ceil-half)
  const rawLeft = script.columnLeftCount?.[team];
  const hasManualColumnLayout = rawLeft !== undefined;
  const leftCount = rawLeft !== undefined
    ? Math.max(0, Math.min(characters.length, rawLeft))
    : Math.ceil(characters.length / 2);
  const [isDraggingSection, setIsDraggingSection] = useState(false);
  const useNaturalCardHeight = hasManualColumnLayout;
  const leftBreakZoneId = `${team}__left_break_zone`;
  const rightBreakZoneId = `${team}__right_break_zone`;
  const leftCharacters = characters.slice(0, leftCount);
  const rightCharacters = characters.slice(leftCount);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disableDrag) return;
    setIsDraggingSection(false);
    const { active, over } = event;
    if (!over) return;

    const oldIndex = characters.findIndex(c => c.id === active.id);
    if (oldIndex === -1) return;

    const overId = String(over.id);
    let newOrder = characters;
    let newLeftCount = leftCount;

    if (overId === leftBreakZoneId || overId === rightBreakZoneId) {
      const activeIsLeft = oldIndex < leftCount;

      if (overId === leftBreakZoneId) {
        const targetIndex = activeIsLeft ? Math.max(0, leftCount - 1) : leftCount;
        newOrder = arrayMove(characters, oldIndex, targetIndex);
        newLeftCount = activeIsLeft ? leftCount : Math.min(characters.length, leftCount + 1);
      } else {
        newOrder = arrayMove(characters, oldIndex, characters.length - 1);
        newLeftCount = activeIsLeft ? Math.max(0, leftCount - 1) : leftCount;
      }

      const orderChanged = newOrder.some((c, index) => c.id !== characters[index]?.id);
      const splitChanged = newLeftCount !== leftCount;
      if (orderChanged || splitChanged) {
        onReorder(team, newOrder.map(c => c.id), splitChanged ? newLeftCount : undefined);
      }
      return;
    }

    if (active.id === over.id) return;

    const newIndex = characters.findIndex(c => c.id === over.id);
    if (newIndex === -1) return;

    const reorderedIds = arrayMove(characters, oldIndex, newIndex).map(c => c.id);
    onReorder(team, reorderedIds);
  };

  return (
    <Box sx={{ backgroundColor: 'transparent' }} onContextMenu={handleContextMenu}>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Typography variant="h5" sx={{
          fontFamily: uiConfigStore.teamDividerFont, fontWeight: 'bold',
          fontSize: isChinese
            ? { xs: `${1 * COMPACT_SCALE}rem`, sm: `${1.1 * COMPACT_SCALE}rem`, md: `${1.4 * COMPACT_SCALE}rem` }
            : { xs: `${1.1 * COMPACT_SCALE}rem`, sm: `${1.2 * COMPACT_SCALE}rem`, md: `${1.6 * COMPACT_SCALE}rem` },
        }}>
          {!isStandardTeam || team === 'fabled' || team === 'loric' || team === 'traveler' ? (
            <span style={{ color: getTeamColor(team, customColor) }}>{getTranslatedTeamName(team)}</span>
          ) : (
            <><span style={{ color: teamLabelColor }}>{teamLabel}</span>·<span style={{ color: TEAM_COLORS[team] }}>{getTranslatedTeamName(team)}</span></>
          )}
        </Typography>
        <Divider sx={{ flex: 1, ml: 1.5, borderColor: THEME_COLORS.gray, borderWidth: 1 }} />
      </Box>

      <Box sx={{ px: compact ? 0.2 : 2 }}>
        <DndContext
          sensors={sensors}
          collisionDetection={pointerFirstCollisionDetection}
          onDragStart={() => setIsDraggingSection(true)}
          onDragCancel={() => setIsDraggingSection(false)}
          onDragEnd={handleDragEnd}
        >
          <Box>
            <SortableContext items={characters.map(c => c.id)} strategy={rectSortingStrategy}>
              {characters.length === 1 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', px: { xs: 0, sm: 2, md: 4 } }}>
                  <Box sx={{ width: { xs: '100%', sm: compact ? '100%' : '50%' }, display: 'flex' }}>
                    <CharacterCard character={characters[0]} jinxInfo={script.jinx[characters[0].name]}
                      allCharacters={script.all} allJinx={script.jinx}
                      onUpdate={onUpdateCharacter} onEdit={onEditCharacter} onDelete={onDeleteCharacter}
                      onReplace={onReplaceCharacter} readOnly={readOnly} compact={compact} />
                  </Box>
                </Box>
              ) : compact ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(3, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 0.15, alignItems: 'start' }}>
                  {characters.map(c => (
                    <Box key={c.id} sx={{ display: 'flex', minWidth: 0 }}>
                      <CharacterCard character={c} jinxInfo={script.jinx[c.name]} allCharacters={script.all}
                        allJinx={script.jinx} onUpdate={onUpdateCharacter} onEdit={onEditCharacter}
                        onDelete={onDeleteCharacter} onReplace={onReplaceCharacter} readOnly={readOnly} compact={compact} />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Box sx={{ position: 'relative', display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, overflow: 'visible' }}>
                  <CharacterColumn side="left" isEmpty={leftCharacters.length === 0}>
                    {leftCharacters.map((c) => (
                      <Box key={c.id} sx={{ flex: useNaturalCardHeight ? '0 0 auto' : 1, width: '100%', minWidth: 0, display: 'flex' }}>
                        <CharacterCard character={c} jinxInfo={script.jinx[c.name]} allCharacters={script.all}
                          allJinx={script.jinx} onUpdate={onUpdateCharacter} onEdit={onEditCharacter}
                          onDelete={onDeleteCharacter} onReplace={onReplaceCharacter} readOnly={readOnly} />
                      </Box>
                    ))}
                  </CharacterColumn>
                  <CharacterColumn side="right" isEmpty={rightCharacters.length === 0}>
                    {rightCharacters.map((c) => (
                      <Box key={c.id} sx={{ flex: useNaturalCardHeight ? '0 0 auto' : 1, width: '100%', minWidth: 0, display: 'flex' }}>
                        <CharacterCard character={c} jinxInfo={script.jinx[c.name]} allCharacters={script.all}
                          allJinx={script.jinx} onUpdate={onUpdateCharacter} onEdit={onEditCharacter}
                          onDelete={onDeleteCharacter} onReplace={onReplaceCharacter} readOnly={readOnly} />
                      </Box>
                    ))}
                  </CharacterColumn>
                  {isDraggingSection && !readOnly && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: -40,
                        display: 'flex',
                        gap: 1,
                        pointerEvents: 'none',
                        zIndex: 40,
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0, pointerEvents: 'auto' }}>
                        <ColumnBreakDropZone id={leftBreakZoneId} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0, pointerEvents: 'auto' }}>
                        <ColumnBreakDropZone id={rightBreakZoneId} />
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </SortableContext>
          </Box>
        </DndContext>
      </Box>

      {/* Right-click context menu for creating custom character */}
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
          onClick={handleCreateCustom}
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
            <PersonAddIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText
            primary={t('character.createCustom')}
            primaryTypographyProps={{
              fontSize: '0.9rem',
            }}
          />
        </MenuItem>
      </Menu>
    </Box>
  );
});

export default CharacterSection;
