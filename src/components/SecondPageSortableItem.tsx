import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Box } from '@mui/material';

interface SecondPageSortableItemProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

/**
 * 第二页可拖拽排序的组件包装器
 */
export const SecondPageSortableItem = ({ id, children, disabled }: SecondPageSortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
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
        cursor: disabled ? 'default' : 'grab',
        '&:active': {
          cursor: disabled ? 'default' : 'grabbing',
        },
        position: 'relative',
      }}
    >
      {children}
    </Box>
  );
};

