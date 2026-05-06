/**
 * Global keyboard shortcut event handling
 *
 * Alert functionality has been moved to @/utils/alert module
 * @see {@link ../alert.ts}
 */

import { alertUseMui } from './alert';

// Re-export alertUseMui for backward compatibility
export { alertUseMui, alertSuccess, alertError, alertWarning, alertInfo } from './alert';

// Callback type for saving to localStorage
type SaveCallback = () => void;

// Global save callback
let globalSaveCallback: SaveCallback | null = null;

// File sync save callback (higher priority)
let fileSyncSaveCallback: SaveCallback | null = null;

/**
 * Register save callback
 * @param callback Callback executed on save
 */
export const registerSaveCallback = (callback: SaveCallback) => {
  globalSaveCallback = callback;
};

/**
 * Unregister save callback
 */
export const unregisterSaveCallback = () => {
  globalSaveCallback = null;
};

/**
 * Register file sync save callback (takes priority over localStorage save)
 * @param callback Callback executed when saving via file sync
 */
export const registerFileSyncSaveCallback = (callback: SaveCallback) => {
  fileSyncSaveCallback = callback;
};

/**
 * Unregister file sync save callback
 */
export const unregisterFileSyncSaveCallback = () => {
  fileSyncSaveCallback = null;
};

/**
 * Show save success alert (internal use)
 */
export const showSaveAlert = (message: string = 'Saved to local storage', duration: number = 2000) => {
  return alertUseMui(`${message}`, duration, { kind: 'success' });
};

/**
 * Global keyboard event handler
 * @param event Keyboard event
 */
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // Detect Ctrl+S (Windows/Linux) or Cmd+S (Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    // Prevent browser's default save behavior
    event.preventDefault();

    // Prioritize file sync save callback
    if (fileSyncSaveCallback) {
      // File sync mode: only save to file, skip localStorage
      fileSyncSaveCallback();
      console.log('Ctrl+S shortcut triggered file sync save (skipping localStorage)');
    } else if (globalSaveCallback) {
      // Normal mode: save to localStorage
      globalSaveCallback();
      console.log('Ctrl+S shortcut triggered localStorage save');
    }
  }
};

/**
 * Initialize global shortcut listeners
 */
export const initGlobalShortcuts = () => {
  // Add global keyboard event listener
  window.addEventListener('keydown', handleGlobalKeyDown);

  console.log('Global shortcuts initialized');
};

/**
 * Clean up global shortcut listeners
 */
export const cleanupGlobalShortcuts = () => {
  // Remove global keyboard event listener
  window.removeEventListener('keydown', handleGlobalKeyDown);
  globalSaveCallback = null;

  console.log('Global shortcuts cleaned up');
};
