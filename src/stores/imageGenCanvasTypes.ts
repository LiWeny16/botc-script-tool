export type FlowNodeKind = 'reference' | 'output' | 'prompt' | 'style';

export type OutputStatus = 'empty' | 'generating' | 'done' | 'error';

export interface ReferencePayload {
  sourceId: string;
  imageUrl: string;
  name: string;
  team?: string;
}

export interface FlowNodeBase {
  id: string;
  kind: FlowNodeKind;
  position: { x: number; y: number };
}

export interface ReferenceFlowNode extends FlowNodeBase {
  kind: 'reference';
  imageUrl: string;
  name: string;
  team?: string;
  sourceId: string;
}

export interface OutputFlowNode extends FlowNodeBase {
  kind: 'output';
  status: OutputStatus;
  dataUrl?: string;
  error?: string;
}

export interface PromptFlowNode extends FlowNodeBase {
  kind: 'prompt';
  text: string;
}

export interface StyleFlowNode extends FlowNodeBase {
  kind: 'style';
  text: string;
}

export type FlowNode = ReferenceFlowNode | OutputFlowNode | PromptFlowNode | StyleFlowNode;

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
}

/** 自定义 MIME；同时写入 text/plain 以兼容部分浏览器 */
export const DRAG_MIME = 'application/botc-imagegen-ref';

let refDragFromPanel = false;

export function setRefDragFromPanel(active: boolean) {
  refDragFromPanel = active;
}

export function isRefDragFromPanel() {
  return refDragFromPanel;
}

export function setReferenceDragData(dt: DataTransfer, payload: ReferencePayload) {
  const json = JSON.stringify(payload);
  dt.setData(DRAG_MIME, json);
  dt.setData('text/plain', json);
  dt.effectAllowed = 'copy';
  try {
    dt.setData('application/json', json);
  } catch { /* some browsers */ }
}

export function isReferenceDragEvent(dt: DataTransfer): boolean {
  if (isRefDragFromPanel()) return true;
  const types = Array.from(dt.types);
  return types.includes(DRAG_MIME) || types.includes('text/plain') || types.includes('application/json');
}

export function edgeColorForSourceKind(kind: FlowNodeKind): string {
  switch (kind) {
    case 'reference': return '#2196f3';
    case 'prompt': return '#9c27b0';
    case 'style': return '#ff9800';
    default: return '#9e9e9e';
  }
}
