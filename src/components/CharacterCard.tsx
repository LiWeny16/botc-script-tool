import { Box, Typography, Paper } from '@mui/material';
import type { Character } from '../types';
import { highlightAbilityText } from '../utils/scriptGenerator';
import { THEME_COLORS, getTeamColor } from '../theme/colors';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CharacterImage from './CharacterImage';

interface CharacterCardProps {
  character: Character;
  jinxInfo?: Record<string, string>;
  allCharacters?: Character[];
  onUpdate?: (characterId: string, updates: Partial<Character>) => void;
  onEdit?: (character: Character) => void;
}

export default function CharacterCard({ character, jinxInfo, allCharacters, onUpdate, onEdit }: CharacterCardProps) {
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

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      elevation={isDragging ? 6 : 0}
      onDoubleClick={handleDoubleClick}
      sx={{
        display: 'flex',
        gap: 1,
        p: 1,
        backgroundColor: 'transparent',
        borderRadius: 1,
        transition: 'all 0.2s',
        height: '100%',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none', // 禁用文本选择
        WebkitUserSelect: 'none', // Safari
        MozUserSelect: 'none', // Firefox
        msUserSelect: 'none', // IE/Edge
        '&:hover': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      {/* 角色头像 */}
      <CharacterImage
        src={character.image}
        alt={character.name}
        sx={{
          width: { xs: 50, sm: 55, md: 60 },
          height: { xs: 50, sm: 55, md: 60 },
          borderRadius: 1,
          objectFit: 'cover',
          flexShrink: 0,
          userDrag: 'none', // 禁用图片拖拽
          WebkitUserDrag: 'none', // Safari
          pointerEvents: 'none', // 禁用所有指针事件
        }}
      />

      {/* 角色信息 */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
            mb: 0.3,
            color: nameColor,
            lineHeight: 1.3,
          }}
        >
          {character.name}
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.85rem' },
            lineHeight: 1.5,
            color: THEME_COLORS.text.tertiary,
          }}
          dangerouslySetInnerHTML={{
            __html: highlightAbilityText(character.ability),
          }}
        />

        {/* 相克规则 */}
        {jinxInfo && Object.keys(jinxInfo).length > 0 && (
          <Box sx={{ mt: 0.5 }}>
            {Object.entries(jinxInfo).map(([targetName, jinxText]) => {
              const targetChar = allCharacters?.find((c) => c.name === targetName);
              return (
                <Box
                  key={targetName}
                  sx={{
                    display: 'flex',
                    gap: 0.6,
                    alignItems: 'flex-start',
                    mt: 0.5,
                    p: 0.6,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    borderRadius: 0.5,
                    border: '1px solid rgba(255, 232, 157, 0.8)',
                  }}
                >
                  {targetChar && (
                    <CharacterImage
                      src={targetChar.image}
                      alt={targetName}
                      sx={{
                        width: { xs: 20, sm: 22, md: 24 },
                        height: { xs: 20, sm: 22, md: 24 },
                        borderRadius: 0.5,
                        flexShrink: 0,
                        userDrag: 'none', // 禁用图片拖拽
                        WebkitUserDrag: 'none', // Safari
                        pointerEvents: 'none', // 禁用所有指针事件
                      }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: { xs: '0.7rem', sm: '0.72rem' },
                      color: THEME_COLORS.text.primary,
                      lineHeight: 1.4,
                      flex: 1,
                      fontStyle: 'italic',
                    }}
                  >
                    （相克规则：{jinxText}）
                  </Typography>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Paper>
  );
}
