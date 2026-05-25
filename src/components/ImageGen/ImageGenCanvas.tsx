import React, { useCallback, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  SelectionMode,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type Connection,
  type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './imageGenFlow.css';
import { observer } from 'mobx-react-lite';
import { useTranslation } from '../../utils/i18n';
import { imageGenStore } from '../../stores/ImageGenStore';
import {
  edgeColorForSourceKind,
  isReferenceDragEvent,
  type ReferencePayload,
} from '../../stores/imageGenCanvasTypes';
import ReferenceNode from './nodes/ReferenceNode';
import OutputNode from './nodes/OutputNode';
import PromptNode from './nodes/PromptNode';
import StyleNode from './nodes/StyleNode';
import CanvasContextMenu, { type ContextMenuState } from './CanvasContextMenu';
import CanvasSelectionBar from './CanvasSelectionBar';
import SelectionSync from './SelectionSync';
import { Box, Typography, alpha } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

const nodeTypes = {
  reference: ReferenceNode,
  output: OutputNode,
  prompt: PromptNode,
  style: StyleNode,
};

function toReactFlowNodes(): Node[] {
  const selected = new Set(imageGenStore.selectedNodeIds);
  return imageGenStore.nodes.map(n => ({
    id: n.id,
    type: n.kind,
    position: { ...n.position },
    data: n as unknown as Record<string, unknown>,
    selected: selected.has(n.id),
  }));
}

function toReactFlowEdges(): Edge[] {
  return imageGenStore.edges.map(e => {
    const source = imageGenStore.nodeById(e.source);
    const color = source ? edgeColorForSourceKind(source.kind) : '#9e9e9e';
    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: 'out',
      targetHandle: 'in',
      animated: true,
      style: { stroke: color, strokeWidth: 2.5 },
    };
  });
}

function parseDropPayload(dt: DataTransfer): ReferencePayload | null {
  for (const type of [dt.getData('application/botc-imagegen-ref'), dt.getData('text/plain'), dt.getData('application/json')]) {
    if (!type) continue;
    try {
      return JSON.parse(type) as ReferencePayload;
    } catch { /* next */ }
  }
  return null;
}

function FlowEmptyState() {
  const { t } = useTranslation();
  if (imageGenStore.nodes.length > 0) return null;
  return (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        px: 3,
        textAlign: 'center',
      }}
    >
      <Box sx={{ maxWidth: 420 }}>
        <AutoAwesomeIcon sx={{ fontSize: 48, color: alpha('#9c27b0', 0.25), mb: 1.5 }} />
        <Typography variant="body1" sx={{ color: 'text.secondary', fontSize: '0.95rem' }}>
          {t('imageGen.emptyHint')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 1 }}>
          {t('imageGen.emptyHintContext')}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block', mt: 0.5 }}>
          {t('imageGen.selection.hint')}
        </Typography>
      </Box>
    </Box>
  );
}

const CanvasFlow = observer(function CanvasFlow() {
  const { screenToFlowPosition } = useReactFlow();
  const [menu, setMenu] = useState<ContextMenuState | null>(null);

  const nodes = toReactFlowNodes();
  const edges = toReactFlowEdges();

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    for (const change of changes) {
      if (change.type === 'position') {
        if (change.dragging) imageGenStore.beginPositionDrag();
        if (change.position) imageGenStore.updateNodePosition(change.id, change.position);
        if (change.dragging === false) imageGenStore.endPositionDrag();
      }
      if (change.type === 'remove') {
        imageGenStore.removeNode(change.id);
      }
    }
  }, []);

  const onConnect: OnConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      imageGenStore.addEdge(connection.source, connection.target);
    }
  }, []);

  const isValidConnection = useCallback(
    (conn: Connection | Edge) =>
      !!conn.source && !!conn.target && imageGenStore.isValidConnection(conn.source, conn.target),
    [],
  );

  const openContextMenu = useCallback((clientX: number, clientY: number) => {
    const flowPos = screenToFlowPosition({ x: clientX, y: clientY });
    setMenu({ mouseX: clientX, mouseY: clientY, flowX: flowPos.x, flowY: flowPos.y });
  }, [screenToFlowPosition]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.react-flow__node')) return;
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY);
  }, [openContextMenu]);

  const acceptRefDrag = useCallback((e: React.DragEvent) => {
    if (!isReferenceDragEvent(e.dataTransfer)) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragover') e.dataTransfer.dropEffect = 'copy';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const payload = parseDropPayload(e.dataTransfer);
    if (!payload) return;
    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    imageGenStore.addReferenceNode(payload, position);
  }, [screenToFlowPosition]);

  const onPaneClick = useCallback(() => {
    imageGenStore.clearSelection();
    setMenu(null);
  }, []);

  return (
    <Box className="image-gen-flow-root" onContextMenu={handleContextMenu}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onPaneClick={onPaneClick}
        onDragEnter={acceptRefDrag}
        onDragOver={acceptRefDrag}
        onDrop={handleDrop}
        deleteKeyCode={['Backspace', 'Delete']}
        minZoom={0.12}
        maxZoom={3}
        defaultViewport={{ x: 0, y: 0, zoom: 0.85 }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable
        elementsSelectable
        selectNodesOnDrag={false}
        selectionOnDrag
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Shift', 'Meta', 'Control']}
        panOnDrag={[1, 2]}
        panOnScroll
        zoomOnScroll
        connectionLineStyle={{ stroke: '#9c27b0', strokeWidth: 2 }}
        snapToGrid
        snapGrid={[20, 20]}
        style={{ width: '100%', height: '100%' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={18}
          size={2}
          color="#a8a8b0"
          bgColor="#ececef"
        />
        <Controls
          showInteractive={false}
          position="bottom-right"
          style={{
            display: 'flex',
            flexDirection: 'row',
            gap: 2,
            background: 'white',
            borderRadius: 12,
            padding: '4px 8px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            marginBottom: 160,
          }}
        />
        <SelectionSync />
      </ReactFlow>
      <CanvasContextMenu state={menu} onClose={() => setMenu(null)} />
      <CanvasSelectionBar />
    </Box>
  );
});

export default observer(function ImageGenCanvas() {
  return (
    <Box
      sx={{
        flex: 1,
        position: 'relative',
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        overflow: 'hidden',
        bgcolor: '#ececef',
      }}
    >
      <FlowEmptyState />
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 1 }}>
        <ReactFlowProvider>
          <CanvasFlow />
        </ReactFlowProvider>
      </Box>
    </Box>
  );
});
