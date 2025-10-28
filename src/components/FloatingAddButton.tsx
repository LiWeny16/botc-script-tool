import { Fab, Zoom } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

interface FloatingAddButtonProps {
  onClick: () => void;
  show?: boolean;
}

export default function FloatingAddButton({ onClick, show = true }: FloatingAddButtonProps) {
  return (
    <Zoom in={show}>
      <Fab
        color="primary"
        aria-label="add character"
        onClick={onClick}
        sx={{
          position: 'fixed',
          bottom: { xs: 20, sm: 24 },
          right: { xs: 20, sm: 24 },
          zIndex: 1200, // 设置为低于弹出窗口的 z-index (Dialog 默认为 1300)
          backgroundColor: '#1976d2',
          boxShadow: '0 4px 20px rgba(25, 118, 210, 0.4)', // 添加阴影增强可见性
          '&:hover': {
            backgroundColor: '#1565c0',
            boxShadow: '0 6px 25px rgba(25, 118, 210, 0.5)',
          },
          '@media print': {
            display: 'none', // 打印时隐藏
          },
        }}
      >
        <AddIcon />
      </Fab>
    </Zoom>
  );
}
