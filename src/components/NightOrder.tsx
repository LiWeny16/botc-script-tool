import { Box, Typography, Paper } from '@mui/material';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NightAction } from '../types';
import { THEME_COLORS } from '../theme/colors';
import CharacterImage from './CharacterImage';
import { normalizeImageUrl } from '../utils/jsonSafety';

function getActionId(action: NightAction, index: number): string {
  return `${normalizeImageUrl(action?.image)}-${index}`;
}

/** Extract a safe alt text from an image field that may be a string or string[] */
function getImageAlt(image: unknown): string {
  const url = normalizeImageUrl(image);
  if (!url) return 'Night order character';
  return url.split('/').pop()?.replace(/\.[^.]*$/, '') || 'Night order character';
}

interface NightOrderProps {
  title: string;
  actions?: NightAction[] | null;
  isMobile?: boolean;
  disabled?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
  compact?: boolean;
}

function SortableActionItem({
  action,
  index,
  isMobile,
  disabled = false,
  compact = false,
}: {
  action: NightAction;
  index: number;
  isMobile: boolean;
  disabled?: boolean;
  compact?: boolean;
}) {
  const COMPACT_SCALE = compact ? 0.65 : 1;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: getActionId(action, index), disabled });

  const restrictedTransform = transform ? {
    ...transform,
    x: isMobile ? transform.x : 0,
  } : null;

  const style = {
    transform: CSS.Transform.toString(restrictedTransform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(!disabled ? listeners : {})}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: disabled ? 'default' : 'grab',
        touchAction: disabled ? 'auto' : 'pan-y',
        '&:active': {
          cursor: disabled ? 'default' : 'grabbing',
        },
      }}
    >
      <CharacterImage
        src={normalizeImageUrl(action.image)}
        alt={getImageAlt(action.image)}
        sx={{
          width: { xs: 35 * COMPACT_SCALE, sm: 38 * COMPACT_SCALE, md: 52 * COMPACT_SCALE },
          height: { xs: 35 * COMPACT_SCALE, sm: 38 * COMPACT_SCALE, md: 52 * COMPACT_SCALE },
          transition: 'all 0.2s',
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            filter: 'brightness(1.1)',
          },
        }}
      />
    </Box>
  );
}

export default function NightOrder({ title, actions, isMobile = false, disabled = false, onReorder, compact = false }: NightOrderProps) {
  const safeActions = Array.isArray(actions)
    ? actions.filter((action): action is NightAction => !!action && typeof action === 'object')
    : [];
  const safeTitle = typeof title === 'string' ? title : '';
  const COMPACT_SCALE = compact ? 0.65 : 1;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onReorder) {
      const oldIndex = safeActions.findIndex((action, idx) => getActionId(action, idx) === active.id);
      const newIndex = safeActions.findIndex((action, idx) => getActionId(action, idx) === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  const compactTitleChar = safeTitle.charAt(0);

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: compact ? 0 : 0, md: 0 },
        backgroundColor: isMobile ? THEME_COLORS.nightOrder.background : 'transparent',
        color: isMobile ? '#fefefe' : '#fefefe',
        borderRadius: 1.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'none',
      }}
    >
      {/* 标题 */}
      {compact && !isMobile ? (
        <Box sx={{ textAlign: 'center', mt: 0.5, mb: 0.3 }}>
          <Box sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28 * COMPACT_SCALE,
            height: 28 * COMPACT_SCALE,
            borderRadius: '50%',
            border: '1.5px solid',
            borderColor: '#fefefe',
            color: '#fefefe',
            fontSize: `${0.85 * COMPACT_SCALE}rem`,
            fontWeight: 'bold',
            fontFamily: 'jicao, Dumbledor, serif',
          }}>
            {compactTitleChar}
          </Box>
        </Box>
      ) : (
        <Typography
          variant="h4"
          sx={{
            textAlign: 'center',
            fontWeight: 'bold',
            fontFamily: 'jicao, Dumbledor, serif',
            fontSize: { xs: `${1 * COMPACT_SCALE}rem`, sm: `${1.1 * COMPACT_SCALE}rem`, md: `${1.5 * COMPACT_SCALE}rem` },
            mb: isMobile ? 1 : 1.5,
            mt: 0.5,
            color: isMobile ? '#fefefe' : 'inherit',
          }}
        >
          {isMobile ? (
            safeTitle
          ) : (
            safeTitle.split('').map((char, index) => (
              <Box
                key={index}
                component="span"
                sx={{
                  display: 'block',
                  lineHeight: char === '晚' ? 1.3 : 1,
                  mt: char === '晚' ? 0.3 : 0,
                  minHeight: char === ' ' ? '0.5em' : 'auto',
                }}
              >
                {char === ' ' ? ' ' : char}
              </Box>
            ))
          )}
        </Typography>
      )}

      {/* 行动图标列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={safeActions.map((action, idx) => getActionId(action, idx))}
          strategy={isMobile ? rectSortingStrategy : verticalListSortingStrategy}
        >
          <Box
            sx={{
              flex: compact ? '0 0 auto' : 1,
              display: 'flex',
              flexDirection: isMobile ? 'row' : 'column',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              overflowY: 'auto',
              overscrollBehavior: 'contain',
              justifyContent: (isMobile || compact) ? 'center' : 'flex-start',
              alignItems: compact ? 'center' : 'stretch',
              alignContent: isMobile ? 'flex-start' : 'stretch',
              gap: isMobile ? 0.5 : 0,
              '&::-webkit-scrollbar': {
                width: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 1.5,
              },
            }}
          >
            {safeActions.map((action, index) => (
              <SortableActionItem
                key={getActionId(action, index)}
                action={action}
                index={index}
                isMobile={isMobile}
                disabled={disabled}
                compact={compact}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
    </Paper>
  );
}
