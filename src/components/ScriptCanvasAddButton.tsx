import type { MouseEventHandler } from 'react';
import { IconButton } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';

export const SCRIPT_CANVAS_ADD_BUTTON_SIZE = 44;
export const SCRIPT_CANVAS_RIGHT_AXIS = 12;

interface ScriptCanvasAddButtonProps {
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
  page?: 1 | 2 | 'header';
}

export default function ScriptCanvasAddButton({ label, onClick, page }: ScriptCanvasAddButtonProps) {
  return (
    <IconButton
      className="script-canvas-add-button"
      data-script-add-page={page}
      aria-label={label}
      title={label}
      onClick={onClick}
      sx={{
        width: SCRIPT_CANVAS_ADD_BUTTON_SIZE,
        height: SCRIPT_CANVAS_ADD_BUTTON_SIZE,
        flex: '0 0 auto',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '50%',
        color: '#fff',
        backgroundColor: '#171717',
        boxShadow: '0 3px 10px rgba(0, 0, 0, 0.28)',
        transition: 'background-color 120ms ease, box-shadow 120ms ease',
        '&:hover, &:focus-visible': {
          backgroundColor: '#303030',
          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.32)',
        },
        '&:active': { transform: 'scale(0.96)' },
        '@media print': { display: 'none' },
      }}
    >
      <AddIcon sx={{ fontSize: 24 }} />
    </IconButton>
  );
}
