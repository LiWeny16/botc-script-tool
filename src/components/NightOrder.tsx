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
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { NightAction } from '../types';
import { THEME_COLORS } from '../theme/colors';
import CharacterImage from './CharacterImage';

interface NightOrderProps {
  title: string;
  actions: NightAction[];
  isMobile?: boolean;
  onReorder?: (oldIndex: number, newIndex: number) => void;
}

// 可拖拽的行动项组件
function SortableActionItem({ 
  action, 
  index, 
  isMobile 
}: { 
  action: NightAction; 
  index: number; 
  isMobile: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: action.image + index });

  // 只允许垂直方向的移动，禁用横向移动
  const restrictedTransform = transform ? {
    ...transform,
    x: 0, // 强制 x 轴不移动
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
      {...listeners}
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'grab',
        touchAction: 'pan-y', // 只允许垂直触摸滚动
        '&:active': {
          cursor: 'grabbing',
        },
      }}
    >
      <CharacterImage
        src={action.image}
        alt={`Action ${index}`}
        sx={{
          width: { xs: 35, sm: 38, md: 52 },
          height: { xs: 35, sm: 38, md: 52 },
          transition: 'all 0.2s',
          '&:hover': {
            transform: 'scale(1.05)',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
          },
        }}
      />
    </Box>
  );
}

export default function NightOrder({ title, actions, isMobile = false, onReorder }: NightOrderProps) {
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
      const oldIndex = actions.findIndex((action, idx) => action.image + idx === active.id);
      const newIndex = actions.findIndex((action, idx) => action.image + idx === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 1.5, sm: 0, md: 0 },
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
      <Typography
        variant="h4"
        sx={{
          textAlign: 'center',
          fontWeight: 'bold',
          fontFamily: 'jicao, Dumbledor, serif',
          fontSize: { xs: '1rem', sm: '1.1rem', md: '1.5rem' },
          mb: isMobile ? 1 : 1.5,
          mt: 0.5,
          color: isMobile ? '#fefefe' : 'inherit',
        }}
      >
        {isMobile ? (
          // 移动端横向显示
          title
        ) : (
          // 桌面端竖向显示
          title.split('').map((char, index) => (
            <Box
              key={index}
              component="span"
              sx={{
                display: 'block',
                lineHeight: char === '晚' ? 1.3 : 1,
                mt: char === '晚' ? 0.3 : 0,
                // 保留空格的高度,让空格在竖向排列时也能显示
                minHeight: char === ' ' ? '0.5em' : 'auto',
              }}
            >
              {char === ' ' ? '\u00A0' : char}
            </Box>
          ))
        )}
      </Typography>

      {/* 行动图标列表 */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={actions.map((action, idx) => action.image + idx)}
          strategy={verticalListSortingStrategy}
        >
          <Box
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'nowrap',
              overflowY: 'auto',
              justifyContent: 'flex-start',
              '&::-webkit-scrollbar': {
                width: 3,
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 1.5,
              },
            }}
          >
            {actions.map((action, index) => (
              <SortableActionItem
                key={action.image + index}
                action={action}
                index={index}
                isMobile={isMobile}
              />
            ))}
          </Box>
        </SortableContext>
      </DndContext>
    </Paper>
  );
}
