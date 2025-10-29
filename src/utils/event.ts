/**
 * 全局快捷键事件处理
 * 
 * 提示功能已移至 @/utils/alert 模块
 * @see {@link ../alert.ts}
 */

import { alertUseMui } from './alert';

// 重新导出 alertUseMui 以保持向后兼容
export { alertUseMui, alertSuccess, alertError, alertWarning, alertInfo } from './alert';

// 保存到 localStorage 的回调类型
type SaveCallback = () => void;

// 全局保存回调
let globalSaveCallback: SaveCallback | null = null;

// 文件同步保存回调（优先级更高）
let fileSyncSaveCallback: SaveCallback | null = null;

/**
 * 注册保存回调函数
 * @param callback 保存时执行的回调函数
 */
export const registerSaveCallback = (callback: SaveCallback) => {
  globalSaveCallback = callback;
};

/**
 * 移除保存回调函数
 */
export const unregisterSaveCallback = () => {
  globalSaveCallback = null;
};

/**
 * 注册文件同步保存回调函数（优先于 localStorage 保存）
 * @param callback 文件同步保存时执行的回调函数
 */
export const registerFileSyncSaveCallback = (callback: SaveCallback) => {
  fileSyncSaveCallback = callback;
};

/**
 * 移除文件同步保存回调函数
 */
export const unregisterFileSyncSaveCallback = () => {
  fileSyncSaveCallback = null;
};

/**
 * 显示保存成功提示（内部使用）
 */
export const showSaveAlert = (message: string = '已保存到本地存储', duration: number = 2000) => {
  return alertUseMui(`${message}`, duration, { kind: 'success' });
};

/**
 * 全局键盘事件处理器
 * @param event 键盘事件
 */
const handleGlobalKeyDown = (event: KeyboardEvent) => {
  // 检测 Ctrl+S (Windows/Linux) 或 Cmd+S (Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    // 阻止浏览器默认的保存行为
    event.preventDefault();

    // 优先执行文件同步保存回调
    if (fileSyncSaveCallback) {
      // 文件同步模式：只保存到文件，不保存到 localStorage
      fileSyncSaveCallback();
      console.log('快捷键 Ctrl+S 已触发文件同步保存（跳过 localStorage）');
    } else if (globalSaveCallback) {
      // 普通模式：保存到 localStorage
      globalSaveCallback();
      console.log('快捷键 Ctrl+S 已触发 localStorage 保存');
    }
  }
};

/**
 * 初始化全局快捷键监听
 */
export const initGlobalShortcuts = () => {
  // 添加全局键盘事件监听
  window.addEventListener('keydown', handleGlobalKeyDown);
  // 在你的JS文件中
  
  console.log('全局快捷键已初始化');
};

/**
 * 清理全局快捷键监听
 */
export const cleanupGlobalShortcuts = () => {
  // 移除全局键盘事件监听
  window.removeEventListener('keydown', handleGlobalKeyDown);
  globalSaveCallback = null;

  console.log('全局快捷键已清理');
};
