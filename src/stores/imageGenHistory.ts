import {
  addHistoryRecord,
  trimHistory,
  type CanvasSnapshot,
} from '../utils/imageGenDb';

const MAX_STACK = 50;

let historyIndex = 0;

function cloneSnapshot(s: CanvasSnapshot): CanvasSnapshot {
  return JSON.parse(JSON.stringify(s)) as CanvasSnapshot;
}

class ImageGenHistoryManager {
  private undoStack: CanvasSnapshot[] = [];
  private redoStack: CanvasSnapshot[] = [];
  projectId = 'default';

  setProjectId(id: string) {
    this.projectId = id;
    this.undoStack = [];
    this.redoStack = [];
    historyIndex = 0;
  }

  canUndo() {
    return this.undoStack.length > 0;
  }

  canRedo() {
    return this.redoStack.length > 0;
  }

  /** 在修改画布前调用：把当前状态压入撤销栈 */
  pushBeforeChange(current: CanvasSnapshot, label: string) {
    this.undoStack.push(cloneSnapshot(current));
    if (this.undoStack.length > MAX_STACK) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    historyIndex += 1;
    const id = `hist_${this.projectId}_${historyIndex}`;
    void addHistoryRecord({
      id,
      projectId: this.projectId,
      index: historyIndex,
      label,
      snapshot: cloneSnapshot(current),
      timestamp: Date.now(),
    }).then(() => trimHistory(this.projectId, MAX_STACK));
  }

  undo(current: CanvasSnapshot): CanvasSnapshot | null {
    if (this.undoStack.length === 0) return null;
    this.redoStack.push(cloneSnapshot(current));
    return this.undoStack.pop() ?? null;
  }

  redo(current: CanvasSnapshot): CanvasSnapshot | null {
    if (this.redoStack.length === 0) return null;
    this.undoStack.push(cloneSnapshot(current));
    return this.redoStack.pop() ?? null;
  }
}

export const imageGenHistory = new ImageGenHistoryManager();
