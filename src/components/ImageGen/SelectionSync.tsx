import { useEffect } from 'react';
import { useOnSelectionChange } from '@xyflow/react';
import { imageGenStore } from '../../stores/ImageGenStore';

/** 将 React Flow 框选/多选状态同步到 MobX store */
export default function SelectionSync() {
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      imageGenStore.setSelectedNodeIds(nodes.map(n => n.id));
    },
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        imageGenStore.selectAllNodes();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        imageGenStore.undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        imageGenStore.redo();
      }
      if (e.key === 'Escape') {
        imageGenStore.clearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
