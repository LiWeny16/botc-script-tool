import { makeAutoObservable, runInAction } from 'mobx';
import type { GenerationMode } from '../utils/imageGenApi';
import {
  MODELS,
  MODEL_SIZES,
  MODEL_LABELS,
  generateImage,
  buildPrompt,
  urlToBase64,
  type ImageGenParams,
} from '../utils/imageGenApi';
import type {
  FlowNode,
  FlowEdge,
  ReferencePayload,
  OutputFlowNode,
  FlowNodeKind,
} from './imageGenCanvasTypes';
import type { CanvasSnapshot } from '../utils/imageGenDb';
import {
  addGalleryItem,
  listGalleryItems,
  deleteGalleryItem,
  saveProject,
  listProjects,
  getProject,
  deleteProject,
  type GalleryRecord,
  type ProjectRecord,
} from '../utils/imageGenDb';
import { imageGenHistory } from './imageGenHistory';
import { WORKFLOW_TEMPLATES } from '../data/imageGenWorkflows';

const API_KEY_STORAGE = 'botc-imagegen-api-key';
const PROXY_URL_STORAGE = 'botc-imagegen-proxy-url';
const DEFAULT_PROXY_URL = 'https://1321514649-9ct8fwv4qb.ap-guangzhou.tencentscf.com';
const PANEL_COLLAPSED_STORAGE = 'botc-imagegen-panel-collapsed';
const PROJECT_ID_STORAGE = 'botc-imagegen-current-project';

export type SidebarSection = 'references' | 'workflows' | 'gallery' | 'projects';

const CANVAS_ORIGIN = { x: 120, y: 80 };
const NODE_STAGGER = { x: 48, y: 40 };

let idSeq = 0;
function nextId(prefix: string) {
  return `${prefix}_${Date.now()}_${++idSeq}`;
}

class ImageGenStore {
  nodes: FlowNode[] = [];
  edges: FlowEdge[] = [];
  prompt = '';
  selectedModel: string = MODELS.SEEDREAM_5_0;
  generationMode: GenerationMode = 'text-to-image';
  selectedSize = '2K';
  apiKey = '';
  proxyUrl = '';
  isGenerating = false;
  generatingOutputId: string | null = null;
  error: string | null = null;
  private genAbortController: AbortController | null = null;
  leftPanelCollapsed = false;
  sidebarSection: SidebarSection = 'references';
  activeTeamTab = 'townsfolk';
  inputFocused = false;
  selectedNodeIds: string[] = [];
  canvasVersion = 0;

  currentProjectId = 'default';
  currentProjectName = 'Untitled';
  galleryItems: GalleryRecord[] = [];
  projects: ProjectRecord[] = [];
  galleryLoaded = false;
  projectsLoaded = false;

  private historyPaused = false;
  private positionDragSnapshotTaken = false;

  constructor() {
    makeAutoObservable(this);
    this.loadApiKey();
    this.loadProxyUrl();
    this.loadPanelState();
    this.loadCurrentProjectId();
    void this.refreshGallery();
    void this.refreshProjects();
  }

  get nodeById() {
    return (id: string) => this.nodes.find(n => n.id === id);
  }

  get selectedOutputNode(): OutputFlowNode | null {
    for (const id of this.selectedNodeIds) {
      const n = this.nodeById(id);
      if (n?.kind === 'output') return n;
    }
    return null;
  }

  get hasSelection() {
    return this.selectedNodeIds.length > 0;
  }

  get canUndo() {
    return imageGenHistory.canUndo();
  }

  get canRedo() {
    return imageGenHistory.canRedo();
  }

  getSnapshot(): CanvasSnapshot {
    return {
      nodes: JSON.parse(JSON.stringify(this.nodes)) as FlowNode[],
      edges: JSON.parse(JSON.stringify(this.edges)) as FlowEdge[],
      prompt: this.prompt,
      selectedModel: this.selectedModel,
      generationMode: this.generationMode,
      selectedSize: this.selectedSize,
    };
  }

  private bumpCanvas() {
    this.canvasVersion += 1;
  }

  private applySnapshot(s: CanvasSnapshot) {
    this.historyPaused = true;
    this.nodes = JSON.parse(JSON.stringify(s.nodes)) as FlowNode[];
    this.edges = JSON.parse(JSON.stringify(s.edges)) as FlowEdge[];
    this.prompt = s.prompt;
    this.selectedModel = s.selectedModel;
    this.generationMode = s.generationMode;
    this.selectedSize = s.selectedSize;
    this.selectedNodeIds = [];
    this.historyPaused = false;
    this.bumpCanvas();
  }

  recordHistory(label: string) {
    if (this.historyPaused) return;
    imageGenHistory.pushBeforeChange(this.getSnapshot(), label);
  }

  undo() {
    const prev = imageGenHistory.undo(this.getSnapshot());
    if (prev) this.applySnapshot(prev);
  }

  redo() {
    const next = imageGenHistory.redo(this.getSnapshot());
    if (next) this.applySnapshot(next);
  }

  private defaultPosition(kind: FlowNodeKind, at?: { x: number; y: number }) {
    if (at) return at;
    const sameKind = this.nodes.filter(n => n.kind === kind).length;
    const base = kind === 'output'
      ? { x: CANVAS_ORIGIN.x + 320, y: CANVAS_ORIGIN.y }
      : CANVAS_ORIGIN;
    return {
      x: base.x + (sameKind % 4) * NODE_STAGGER.x,
      y: base.y + Math.floor(sameKind / 4) * (kind === 'output' ? 280 : 120) + NODE_STAGGER.y,
    };
  }

  addReferenceNode(payload: ReferencePayload, at?: { x: number; y: number }) {
    this.recordHistory('add reference');
    const id = nextId('ref');
    const node: FlowNode = {
      id,
      kind: 'reference',
      position: this.defaultPosition('reference', at),
      imageUrl: payload.imageUrl,
      name: payload.name,
      team: payload.team,
      sourceId: payload.sourceId,
    };
    this.nodes.push(node);
    this.bumpCanvas();
    return id;
  }

  addOutputNode(at?: { x: number; y: number }) {
    this.recordHistory('add output');
    const id = nextId('out');
    const node: FlowNode = {
      id,
      kind: 'output',
      position: this.defaultPosition('output', at),
      status: 'empty',
    };
    this.nodes.push(node);
    this.bumpCanvas();
    return id;
  }

  addPromptNode(at?: { x: number; y: number }, text = '') {
    this.recordHistory('add prompt');
    const id = nextId('prm');
    const node: FlowNode = {
      id,
      kind: 'prompt',
      position: this.defaultPosition('prompt', at),
      text,
    };
    this.nodes.push(node);
    this.bumpCanvas();
    return id;
  }

  addStyleNode(at?: { x: number; y: number }, text = '') {
    this.recordHistory('add style');
    const id = nextId('stl');
    const node: FlowNode = {
      id,
      kind: 'style',
      position: this.defaultPosition('style', at),
      text,
    };
    this.nodes.push(node);
    this.bumpCanvas();
    return id;
  }

  beginPositionDrag() {
    if (!this.positionDragSnapshotTaken) {
      this.recordHistory('move nodes');
      this.positionDragSnapshotTaken = true;
    }
  }

  endPositionDrag() {
    this.positionDragSnapshotTaken = false;
  }

  updateNodePosition(id: string, position: { x: number; y: number }) {
    const node = this.nodeById(id);
    if (node) node.position = position;
  }

  setPromptNodeText(id: string, text: string) {
    const node = this.nodeById(id);
    if (node?.kind === 'prompt') node.text = text;
  }

  setStyleNodeText(id: string, text: string) {
    const node = this.nodeById(id);
    if (node?.kind === 'style') node.text = text;
  }

  setOutputStatus(id: string, status: OutputFlowNode['status'], extra?: Partial<Pick<OutputFlowNode, 'dataUrl' | 'error'>>) {
    const node = this.nodeById(id);
    if (node?.kind !== 'output') return;
    node.status = status;
    if (extra?.dataUrl !== undefined) node.dataUrl = extra.dataUrl;
    if (extra?.error !== undefined) node.error = extra.error;
    this.bumpCanvas();
  }

  removeNode(id: string) {
    this.recordHistory('remove node');
    this.nodes = this.nodes.filter(n => n.id !== id);
    this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    this.selectedNodeIds = this.selectedNodeIds.filter(sid => sid !== id);
    this.bumpCanvas();
  }

  removeSelectedNodes() {
    if (this.selectedNodeIds.length === 0) return;
    this.recordHistory('remove selected');
    const ids = [...this.selectedNodeIds];
    for (const id of ids) {
      this.nodes = this.nodes.filter(n => n.id !== id);
      this.edges = this.edges.filter(e => e.source !== id && e.target !== id);
    }
    this.selectedNodeIds = [];
    this.bumpCanvas();
  }

  addEdge(source: string, target: string): boolean {
    if (!this.isValidConnection(source, target)) return false;
    const exists = this.edges.some(e => e.source === source && e.target === target);
    if (exists) return false;
    this.recordHistory('connect');
    this.edges.push({ id: `e_${source}_${target}`, source, target });
    this.bumpCanvas();
    return true;
  }

  removeEdge(id: string) {
    this.recordHistory('disconnect');
    this.edges = this.edges.filter(e => e.id !== id);
    this.bumpCanvas();
  }

  isValidConnection(sourceId: string, targetId: string): boolean {
    const source = this.nodeById(sourceId);
    const target = this.nodeById(targetId);
    if (!source || !target || target.kind !== 'output') return false;
    if (source.kind === 'output') return false;
    if (source.kind === 'reference' || source.kind === 'prompt' || source.kind === 'style') return true;
    return false;
  }

  getIncomingEdges(targetId: string) {
    return this.edges.filter(e => e.target === targetId);
  }

  setPrompt(p: string) { this.prompt = p; }

  setModel(m: string) {
    this.selectedModel = m;
    const sizes = MODEL_SIZES[m];
    if (sizes && !sizes.includes(this.selectedSize)) {
      this.selectedSize = sizes[0];
    }
  }

  setMode(m: GenerationMode) { this.generationMode = m; }
  setSize(s: string) { this.selectedSize = s; }

  setApiKey(key: string) {
    this.apiKey = key;
    try { localStorage.setItem(API_KEY_STORAGE, key); } catch { /* quota */ }
  }

  private loadApiKey() {
    try { this.apiKey = localStorage.getItem(API_KEY_STORAGE) || ''; } catch { this.apiKey = ''; }
  }

  setProxyUrl(url: string) {
    this.proxyUrl = url;
    try { localStorage.setItem(PROXY_URL_STORAGE, url); } catch { /* quota */ }
  }

  private loadProxyUrl() {
    try {
      const stored = localStorage.getItem(PROXY_URL_STORAGE);
      this.proxyUrl = stored !== null ? stored : DEFAULT_PROXY_URL;
    } catch {
      this.proxyUrl = DEFAULT_PROXY_URL;
    }
  }

  private loadPanelState() {
    try {
      const stored = localStorage.getItem(PANEL_COLLAPSED_STORAGE);
      if (stored === '1') this.leftPanelCollapsed = true;
    } catch { /* ignore */ }
  }

  private loadCurrentProjectId() {
    try {
      const id = localStorage.getItem(PROJECT_ID_STORAGE);
      if (id) {
        this.currentProjectId = id;
        imageGenHistory.setProjectId(id);
      }
    } catch { /* ignore */ }
  }

  private persistProjectId() {
    try { localStorage.setItem(PROJECT_ID_STORAGE, this.currentProjectId); } catch { /* ignore */ }
  }

  collapseLeftPanel() {
    this.leftPanelCollapsed = true;
    try { localStorage.setItem(PANEL_COLLAPSED_STORAGE, '1'); } catch { /* ignore */ }
  }

  expandLeftPanel() {
    this.leftPanelCollapsed = false;
    try { localStorage.setItem(PANEL_COLLAPSED_STORAGE, '0'); } catch { /* ignore */ }
  }

  toggleLeftPanel() {
    this.leftPanelCollapsed = !this.leftPanelCollapsed;
    try { localStorage.setItem(PANEL_COLLAPSED_STORAGE, this.leftPanelCollapsed ? '1' : '0'); } catch { /* ignore */ }
  }

  setSidebarSection(s: SidebarSection) {
    this.sidebarSection = s;
    this.expandLeftPanel();
  }

  setActiveTeamTab(team: string) { this.activeTeamTab = team; }
  setGenerating(v: boolean) { this.isGenerating = v; }
  setError(e: string | null) { this.error = e; }
  setInputFocused(v: boolean) { this.inputFocused = v; }
  setSelectedNodeIds(ids: string[]) {
    this.selectedNodeIds = ids;
    this.bumpCanvas();
  }

  selectAllNodes() {
    this.selectedNodeIds = this.nodes.map(n => n.id);
    this.bumpCanvas();
  }

  clearSelection() {
    this.selectedNodeIds = [];
    this.bumpCanvas();
  }

  get hasApiKey() { return this.apiKey.trim().length > 0; }
  get hasProxyUrl() { return this.proxyUrl.trim().length > 0; }
  get canGenerate() { return this.hasApiKey && !this.isGenerating; }

  isOutputGenerating(outputId: string) {
    return this.generatingOutputId === outputId;
  }

  cancelGeneration() {
    this.genAbortController?.abort();
  }
  get modelLabel() { return MODEL_LABELS[this.selectedModel] ?? this.selectedModel; }

  applyWorkflow(workflowId: string) {
    const tpl = WORKFLOW_TEMPLATES.find(w => w.id === workflowId);
    if (!tpl) return;
    this.recordHistory('apply workflow');
    const offset = {
      x: CANVAS_ORIGIN.x + (this.nodes.length % 3) * 40,
      y: CANVAS_ORIGIN.y + Math.floor(this.nodes.length / 3) * 40,
    };
    const ids: string[] = [];
    for (const n of tpl.nodes) {
      const pos = { x: offset.x + n.x, y: offset.y + n.y };
      if (n.kind === 'reference') {
        ids.push(this.addReferenceNodeWithoutHistory({
          sourceId: `wf_${workflowId}_${ids.length}`,
          imageUrl: '/imgs/icons/75px-Di.png',
          name: n.name ?? 'Reference',
        }, pos));
      } else if (n.kind === 'output') {
        ids.push(this.addOutputNodeWithoutHistory(pos));
      } else if (n.kind === 'prompt') {
        ids.push(this.addPromptNodeWithoutHistory(pos, n.text ?? ''));
      } else if (n.kind === 'style') {
        ids.push(this.addStyleNodeWithoutHistory(pos, n.text ?? ''));
      }
    }
    for (const [si, ti] of tpl.edges) {
      const src = ids[si];
      const tgt = ids[ti];
      if (src && tgt) this.addEdgeWithoutHistory(src, tgt);
    }
    this.bumpCanvas();
  }

  private addReferenceNodeWithoutHistory(payload: ReferencePayload, at?: { x: number; y: number }) {
    const id = nextId('ref');
    this.nodes.push({
      id,
      kind: 'reference',
      position: this.defaultPosition('reference', at),
      imageUrl: payload.imageUrl,
      name: payload.name,
      team: payload.team,
      sourceId: payload.sourceId,
    });
    return id;
  }

  private addOutputNodeWithoutHistory(at?: { x: number; y: number }) {
    const id = nextId('out');
    this.nodes.push({ id, kind: 'output', position: this.defaultPosition('output', at), status: 'empty' });
    return id;
  }

  private addPromptNodeWithoutHistory(at?: { x: number; y: number }, text = '') {
    const id = nextId('prm');
    this.nodes.push({ id, kind: 'prompt', position: this.defaultPosition('prompt', at), text });
    return id;
  }

  private addStyleNodeWithoutHistory(at?: { x: number; y: number }, text = '') {
    const id = nextId('stl');
    this.nodes.push({ id, kind: 'style', position: this.defaultPosition('style', at), text });
    return id;
  }

  private addEdgeWithoutHistory(source: string, target: string) {
    if (!this.isValidConnection(source, target)) return;
    if (this.edges.some(e => e.source === source && e.target === target)) return;
    this.edges.push({ id: `e_${source}_${target}`, source, target });
  }

  async refreshGallery() {
    const items = await listGalleryItems();
    runInAction(() => {
      this.galleryItems = items;
      this.galleryLoaded = true;
    });
  }

  async addToGallery(dataUrl: string, meta?: { promptSnippet?: string; model?: string; size?: string }) {
    const item: GalleryRecord = {
      id: `gal_${Date.now()}`,
      dataUrl,
      promptSnippet: meta?.promptSnippet,
      model: meta?.model,
      size: meta?.size,
      createdAt: Date.now(),
    };
    await addGalleryItem(item);
    runInAction(() => {
      this.galleryItems = [item, ...this.galleryItems].slice(0, 60);
    });
  }

  async removeGalleryItem(id: string) {
    await deleteGalleryItem(id);
    runInAction(() => {
      this.galleryItems = this.galleryItems.filter(g => g.id !== id);
    });
  }

  async refreshProjects() {
    const list = await listProjects();
    runInAction(() => {
      this.projects = list;
      this.projectsLoaded = true;
    });
  }

  async saveCurrentProject(name?: string) {
    const snapshot = this.getSnapshot();
    const out = this.nodes.find((n): n is OutputFlowNode => n.kind === 'output' && !!n.dataUrl);
    const thumb = out?.dataUrl;
    const now = Date.now();
    const record: ProjectRecord = {
      id: this.currentProjectId,
      name: name ?? this.currentProjectName,
      snapshot,
      thumbnail: thumb,
      createdAt: now,
      updatedAt: now,
    };
    const existing = await getProject(this.currentProjectId);
    if (existing) {
      record.createdAt = existing.createdAt;
      record.updatedAt = now;
    }
    await saveProject(record);
    runInAction(() => {
      this.currentProjectName = record.name;
      void this.refreshProjects();
    });
  }

  async createNewProject(name?: string, record = true) {
    const id = `proj_${Date.now()}`;
    if (record) this.recordHistory('new project');
    runInAction(() => {
      this.currentProjectId = id;
      this.currentProjectName = name ?? `Project ${this.projects.length + 1}`;
      this.nodes = [];
      this.edges = [];
      this.prompt = '';
      this.selectedNodeIds = [];
      imageGenHistory.setProjectId(id);
      this.persistProjectId();
      this.bumpCanvas();
    });
    await this.saveCurrentProject();
    void this.refreshProjects();
  }

  async loadProject(projectId: string, record = true) {
    const p = await getProject(projectId);
    if (!p) return;
    if (record) this.recordHistory('load project');
    runInAction(() => {
      this.currentProjectId = p.id;
      this.currentProjectName = p.name;
      imageGenHistory.setProjectId(p.id);
      this.persistProjectId();
      this.applySnapshot(p.snapshot);
    });
  }

  async deleteProjectById(projectId: string) {
    await deleteProject(projectId);
    if (this.currentProjectId === projectId) {
      await this.createNewProject('Untitled');
    }
    void this.refreshProjects();
  }

  gatherOutputInputs(outputId: string) {
    const incoming = this.getIncomingEdges(outputId);
    const refs: Array<{ imageUrl: string; team?: string; name: string }> = [];
    const prompts: string[] = [];
    const styles: string[] = [];

    for (const edge of incoming) {
      const src = this.nodeById(edge.source);
      if (!src) continue;
      if (src.kind === 'reference') {
        refs.push({ imageUrl: src.imageUrl, team: src.team, name: src.name });
      } else if (src.kind === 'prompt' && src.text.trim()) {
        prompts.push(src.text.trim());
      } else if (src.kind === 'style' && src.text.trim()) {
        styles.push(src.text.trim());
      }
    }

    const bar = this.prompt.trim();
    if (bar) prompts.unshift(bar);

    const userText = [...prompts, ...styles.map(s => `Style: ${s}`)].filter(Boolean).join('. ');
    const teamColor = refs[0]?.team;

    return { refs, userText, teamColor };
  }

  async generateOutputNode(outputId: string): Promise<void> {
    if (!this.hasApiKey) {
      this.setError('API key missing');
      return;
    }
    const output = this.nodeById(outputId);
    if (output?.kind !== 'output') return;

    const { refs, userText, teamColor } = this.gatherOutputInputs(outputId);
    if (!userText && refs.length === 0) {
      this.setError('Connect a prompt or reference node first');
      return;
    }

    this.recordHistory('generate');
    this.genAbortController?.abort();
    this.genAbortController = new AbortController();
    const signal = this.genAbortController.signal;
    this.generatingOutputId = outputId;
    this.setGenerating(true);
    this.setError(null);
    this.setOutputStatus(outputId, 'generating');

    const promptBase = userText || 'Blood on the Clocktower character icon';
    const prompt = buildPrompt(promptBase, teamColor);
    const promptSnippet = promptBase.slice(0, 80);

    try {
      const is50 = this.selectedModel === MODELS.SEEDREAM_5_0;
      const params: ImageGenParams = {
        model: this.selectedModel,
        prompt,
        size: this.selectedSize,
        response_format: 'b64_json',
        ...(is50 ? { output_format: 'png' } : {}),
      };

      let mode = this.generationMode;
      if (refs.length > 0 && mode === 'text-to-image') {
        mode = refs.length > 1 ? 'multi-image-fusion' : 'image-to-image';
      }

      if (mode === 'image-to-image' && refs.length > 0) {
        params.image = await urlToBase64(refs[0].imageUrl);
      } else if (mode === 'multi-image-fusion' && refs.length > 0) {
        params.image = await Promise.all(refs.map(r => urlToBase64(r.imageUrl)));
      } else if (mode === 'group-generation') {
        params.sequential_image_generation = 'auto';
        params.sequential_image_generation_options = { max_images: 4 };
        if (refs.length > 0) {
          params.image = refs.length === 1
            ? await urlToBase64(refs[0].imageUrl)
            : await Promise.all(refs.map(r => urlToBase64(r.imageUrl)));
        }
      }

      const response = await generateImage(this.apiKey, params, signal, this.proxyUrl || undefined);
      const item = response.data[0];
      const dataUrl = item?.b64_json
        ? `data:image/png;base64,${item.b64_json}`
        : item?.url;

      if (!dataUrl) throw new Error('No images in API response');

      runInAction(() => {
        this.setOutputStatus(outputId, 'done', { dataUrl });
        void this.addToGallery(dataUrl, {
          promptSnippet,
          model: this.selectedModel,
          size: this.selectedSize,
        });
      });
    } catch (e: unknown) {
      const aborted = signal.aborted || (e instanceof Error && e.name === 'AbortError');
      if (aborted) {
        runInAction(() => {
          const out = this.nodeById(outputId);
          if (out?.kind === 'output' && out.dataUrl) {
            this.setOutputStatus(outputId, 'done');
          } else {
            this.setOutputStatus(outputId, 'empty');
          }
          this.setError(null);
        });
        return;
      }
      const msg = e instanceof Error ? e.message : String(e);
      runInAction(() => {
        this.setOutputStatus(outputId, 'error', { error: msg });
        this.setError(msg);
      });
      throw e;
    } finally {
      runInAction(() => {
        this.generatingOutputId = null;
        this.genAbortController = null;
        this.setGenerating(false);
      });
    }
  }

  async runGeneration(): Promise<void> {
    const target = this.selectedOutputNode?.id
      ?? this.nodes.find(n => n.kind === 'output' && n.status === 'empty')?.id
      ?? this.nodes.find(n => n.kind === 'output')?.id;

    if (!target) {
      const newId = this.addOutputNode();
      await this.generateOutputNode(newId);
      return;
    }
    await this.generateOutputNode(target);
  }

  addGalleryToCanvas(item: GalleryRecord) {
    this.addReferenceNode({
      sourceId: `gal_${item.id}`,
      imageUrl: item.dataUrl,
      name: item.promptSnippet?.slice(0, 24) ?? 'Gallery',
    });
  }
}

export const imageGenStore = new ImageGenStore();
