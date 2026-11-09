import type { Language } from './languages';

export const A4_PREVIEW_TEXT = {
  cn: { previous: '上一页', next: '下一页', zoomOut: '缩小预览', zoomIn: '放大预览', fitPage: '适合页面', fitWidth: '适合宽度', hint: 'Ctrl / ⌘ + 滚轮缩放，拖拽平移；预览缩放不会改变导出内容。' },
  en: { previous: 'Previous page', next: 'Next page', zoomOut: 'Zoom out', zoomIn: 'Zoom in', fitPage: 'Fit page', fitWidth: 'Fit width', hint: 'Ctrl / ⌘ + scroll to zoom; drag to pan. Preview zoom does not change the export.' },
  es: { previous: 'Página anterior', next: 'Página siguiente', zoomOut: 'Reducir vista', zoomIn: 'Ampliar vista', fitPage: 'Ajustar página', fitWidth: 'Ajustar al ancho', hint: 'Ctrl / ⌘ + rueda para ampliar; arrastra para desplazarte. El zoom no cambia la exportación.' },
  de: { previous: 'Vorherige Seite', next: 'Nächste Seite', zoomOut: 'Vorschau verkleinern', zoomIn: 'Vorschau vergrößern', fitPage: 'Seite anpassen', fitWidth: 'Breite anpassen', hint: 'Mit Strg / ⌘ + Mausrad zoomen und zum Verschieben ziehen. Der Vorschauzoom ändert den Export nicht.' },
} satisfies Record<Language, Record<string, string>>;
