import { useSyncExternalStore, type KeyboardEvent, type MouseEvent } from 'react';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import {
  DeleteOutline,
  EditOutlined,
  RestartAlt,
} from '@mui/icons-material';

interface LayoutMenuLabels {
  edit: string;
  reset: string;
  remove: string;
}

interface LayoutMenuActions {
  edit?: () => void;
  reset?: () => void;
  remove?: () => void;
}

interface MenuAnchor {
  left: number;
  top: number;
}

interface LayoutMenuState {
  anchor: MenuAnchor;
  labels: LayoutMenuLabels;
  actions: LayoutMenuActions;
  trigger: HTMLElement;
}

const listeners = new Set<() => void>();
let activeMenu: LayoutMenuState | null = null;

function emitLayoutMenuChange() {
  listeners.forEach((listener) => listener());
}

function subscribeLayoutMenu(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getLayoutMenuSnapshot() {
  return activeMenu;
}

function openLayoutMenu(menu: LayoutMenuState) {
  activeMenu = menu;
  emitLayoutMenuChange();
}

function closeLayoutMenu(restoreFocus = true) {
  if (!activeMenu) return;
  const trigger = activeMenu.trigger;
  activeMenu = null;
  emitLayoutMenuChange();
  if (restoreFocus) {
    window.setTimeout(() => trigger.focus({ preventScroll: true }), 250);
  }
}

interface LayoutContextMenuProps {
  anchor: MenuAnchor | null;
  labels: LayoutMenuLabels;
  actions: LayoutMenuActions;
  onClose: (restoreFocus?: boolean) => void;
}

export function LayoutContextMenu({ anchor, labels, actions, onClose }: LayoutContextMenuProps) {
  const run = (action?: () => void) => {
    onClose(false);
    if (action) requestAnimationFrame(action);
  };
  return (
    <Menu
      open={anchor !== null}
      onClose={() => onClose(true)}
      disableScrollLock
      anchorReference="anchorPosition"
      anchorPosition={anchor ?? { left: 0, top: 0 }}
      slotProps={{
        paper: {
          sx: {
            minWidth: 188,
            borderRadius: 2,
            border: '1px solid rgba(96, 121, 99, 0.22)',
            boxShadow: '0 12px 32px rgba(31, 41, 34, 0.18)',
          },
        },
      }}
    >
      <MenuItem disabled={!actions.edit} onClick={() => run(actions.edit)}>
        <ListItemIcon><EditOutlined fontSize="small" /></ListItemIcon>
        <ListItemText primary={labels.edit} />
      </MenuItem>
      <MenuItem disabled={!actions.reset} onClick={() => run(actions.reset)}>
        <ListItemIcon><RestartAlt fontSize="small" /></ListItemIcon>
        <ListItemText primary={labels.reset} />
      </MenuItem>
      <MenuItem disabled={!actions.remove} onClick={() => run(actions.remove)}>
        <ListItemIcon><DeleteOutline fontSize="small" /></ListItemIcon>
        <ListItemText primary={labels.remove} />
      </MenuItem>
    </Menu>
  );
}

export function LayoutContextMenuHost() {
  const menu = useSyncExternalStore(subscribeLayoutMenu, getLayoutMenuSnapshot, getLayoutMenuSnapshot);
  return (
    <LayoutContextMenu
      anchor={menu?.anchor ?? null}
      labels={menu?.labels ?? { edit: '', reset: '', remove: '' }}
      actions={menu?.actions ?? {}}
      onClose={closeLayoutMenu}
    />
  );
}

export function useLayoutContextMenu(labels: LayoutMenuLabels, actions: LayoutMenuActions) {
  const openAtPoint = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    openLayoutMenu({
      anchor: { left: event.clientX + 2, top: event.clientY - 6 },
      labels,
      actions,
      trigger: event.currentTarget,
    });
  };

  const openAtElement = (event: MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const rect = event.currentTarget.getBoundingClientRect();
    openLayoutMenu({
      anchor: { left: rect.right - 188, top: rect.bottom + 4 },
      labels,
      actions,
      trigger: event.currentTarget,
    });
  };

  const openWithKeyboard = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ContextMenu' && !(event.shiftKey && event.key === 'F10')) return;
    const rect = event.currentTarget.getBoundingClientRect();
    event.preventDefault();
    event.stopPropagation();
    openLayoutMenu({
      anchor: { left: rect.left + rect.width / 2, top: rect.top + rect.height / 2 },
      labels,
      actions,
      trigger: event.currentTarget,
    });
  };

  return { openAtPoint, openAtElement, openWithKeyboard, element: null };
}
