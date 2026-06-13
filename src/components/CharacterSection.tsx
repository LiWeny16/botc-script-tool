import { Box, Typography, Divider } from '@mui/material';
import { observer } from 'mobx-react-lite';
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
  useSensor,
  useSensors,
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
  disableDrag?: boolean;
  readOnly?: boolean;
  compact?: boolean;
}

const CharacterSection = observer(({
  team, characters, script, onReorder, onUpdateCharacter, onEditCharacter,
  onDeleteCharacter, onReplaceCharacter, disableDrag = false, readOnly = false, compact = false,
}: CharacterSectionProps) => {
  const COMPACT_SCALE = compact ? 0.47 : 1;
  const { t } = useTranslation();
  const isChinese = configStore.language === 'cn';

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
  const leftCount = rawLeft !== undefined
    ? Math.max(0, Math.min(characters.length, rawLeft))
    : Math.ceil(characters.length / 2);

  const handleDragEnd = (event: DragEndEvent) => {
    if (disableDrag) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = characters.findIndex(c => c.id === active.id);
    const newIndex = characters.findIndex(c => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // Detect if the drag crossed the column boundary
    const crossedLeftToRight = oldIndex < leftCount && newIndex >= leftCount;
    const crossedRightToLeft = oldIndex >= leftCount && newIndex < leftCount;

    let newLeftCount: number | undefined;
    if (crossedLeftToRight) {
      newLeftCount = leftCount - 1;
    } else if (crossedRightToLeft) {
      newLeftCount = leftCount + 1;
    }

    const newOrder = arrayMove(characters, oldIndex, newIndex).map(c => c.id);
    onReorder(team, newOrder, newLeftCount);
  };

  return (
    <Box sx={{ backgroundColor: 'transparent' }}>
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
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
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
                <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' } }}>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {characters.slice(0, leftCount).map((c, idx, arr) => (
                      <Box key={c.id} sx={{ flex: 1, display: 'flex', mb: idx < arr.length - 1 ? 1 : 0 }}>
                        <CharacterCard character={c} jinxInfo={script.jinx[c.name]} allCharacters={script.all}
                          allJinx={script.jinx} onUpdate={onUpdateCharacter} onEdit={onEditCharacter}
                          onDelete={onDeleteCharacter} onReplace={onReplaceCharacter} readOnly={readOnly} />
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    {characters.slice(leftCount).map((c, idx, arr) => (
                      <Box key={c.id} sx={{ flex: 1, display: 'flex', mb: idx < arr.length - 1 ? 1 : 0 }}>
                        <CharacterCard character={c} jinxInfo={script.jinx[c.name]} allCharacters={script.all}
                          allJinx={script.jinx} onUpdate={onUpdateCharacter} onEdit={onEditCharacter}
                          onDelete={onDeleteCharacter} onReplace={onReplaceCharacter} readOnly={readOnly} />
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </SortableContext>
          </Box>
        </DndContext>
      </Box>
    </Box>
  );
});

export default CharacterSection;
