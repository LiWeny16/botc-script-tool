import type { TranslationKey } from '../utils/i18n/index';
import type { FlowNodeKind } from '../stores/imageGenCanvasTypes';

export interface WorkflowNodeTemplate {
  kind: FlowNodeKind;
  x: number;
  y: number;
  text?: string;
  name?: string;
}

export interface WorkflowTemplate {
  id: string;
  nameKey: TranslationKey;
  descKey: TranslationKey;
  nodes: WorkflowNodeTemplate[];
  /** [sourceIndex, targetIndex] into nodes — target must be output */
  edges: [number, number][];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'botc-icon-basic',
    nameKey: 'imageGen.workflow.botcBasic',
    descKey: 'imageGen.workflow.botcBasicDesc',
    nodes: [
      { kind: 'reference', x: 0, y: 0, name: 'Reference' },
      { kind: 'prompt', x: 0, y: 140, text: 'Deep blue townsfolk character icon, symbolic silhouette' },
      { kind: 'style', x: 0, y: 280, text: 'Flat vector, vintage grain, white background, bold outlines' },
      { kind: 'output', x: 280, y: 80 },
    ],
    edges: [[0, 3], [1, 3], [2, 3]],
  },
  {
    id: 'image-to-image',
    nameKey: 'imageGen.workflow.img2img',
    descKey: 'imageGen.workflow.img2imgDesc',
    nodes: [
      { kind: 'reference', x: 0, y: 40, name: 'Source icon' },
      { kind: 'prompt', x: 0, y: 180, text: 'Same composition, refined details and colors' },
      { kind: 'output', x: 260, y: 60 },
    ],
    edges: [[0, 2], [1, 2]],
  },
  {
    id: 'multi-ref-fusion',
    nameKey: 'imageGen.workflow.multiRef',
    descKey: 'imageGen.workflow.multiRefDesc',
    nodes: [
      { kind: 'reference', x: 0, y: 0, name: 'Ref A' },
      { kind: 'reference', x: 0, y: 120, name: 'Ref B' },
      { kind: 'prompt', x: 0, y: 260, text: 'Blend style and palette from references' },
      { kind: 'output', x: 280, y: 100 },
    ],
    edges: [[0, 3], [1, 3], [2, 3]],
  },
  {
    id: 'prompt-only',
    nameKey: 'imageGen.workflow.promptOnly',
    descKey: 'imageGen.workflow.promptOnlyDesc',
    nodes: [
      { kind: 'prompt', x: 0, y: 40, text: 'Crimson demon icon, dramatic silhouette' },
      { kind: 'style', x: 0, y: 180, text: 'Screen-print texture, high contrast' },
      { kind: 'output', x: 260, y: 80 },
    ],
    edges: [[0, 2], [1, 2]],
  },
];
