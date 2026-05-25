import React from 'react';
import { Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
  Image as ImageIcon,
  Notes as NotesIcon,
  Palette as PaletteIcon,
} from '@mui/icons-material';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore } from '../../stores/ImageGenStore';

export interface ContextMenuState {
  mouseX: number;
  mouseY: number;
  flowX: number;
  flowY: number;
}

interface Props {
  state: ContextMenuState | null;
  onClose: () => void;
}

export default function CanvasContextMenu({ state, onClose }: Props) {
  const { t } = useTranslation();

  const handle = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <Menu
      open={state !== null}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        state ? { top: state.mouseY, left: state.mouseX } : undefined
      }
      disableScrollLock
      slotProps={{
        paper: { sx: { borderRadius: 2, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.14)' } },
      }}
    >
      <MenuItem onClick={() => handle(() => imageGenStore.addOutputNode({ x: state!.flowX, y: state!.flowY }))}>
        <ListItemIcon><ImageIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('imageGen.context.newOutput')} />
      </MenuItem>
      <MenuItem onClick={() => handle(() => imageGenStore.addPromptNode({ x: state!.flowX, y: state!.flowY }))}>
        <ListItemIcon><NotesIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('imageGen.context.newPrompt')} />
      </MenuItem>
      <MenuItem onClick={() => handle(() => imageGenStore.addStyleNode({ x: state!.flowX, y: state!.flowY }))}>
        <ListItemIcon><PaletteIcon fontSize="small" /></ListItemIcon>
        <ListItemText primary={t('imageGen.context.newStyle')} />
      </MenuItem>
    </Menu>
  );
}
