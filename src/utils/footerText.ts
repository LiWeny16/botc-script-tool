import type { Language } from './languages';

const en = {
  add: 'Add footer component', title: 'Footer components', tower1: 'Left tower', tower2: 'Floral ornament', town: 'Town silhouette',
  image: 'Upload image', legend: 'First-night legend', explanation: 'Explanation', state: 'Poisoned / drunk explanation',
  madness: 'Madness explanation', list: 'Custom explanation list', active: 'Added components',
  empty: 'No components on this page yet.', opacity: 'Opacity', close: 'Close', edit: 'Edit', remove: 'Delete',
  content: 'Text', heading: 'Title', description: 'Introduction', columns: 'Columns', one: 'One column', two: 'Two columns',
  rows: 'List entries', addRow: 'Add entry', icon: 'Upload entry icon', save: 'Save', cancel: 'Cancel',
  legendDefault: '* Except 1st night', listDefault: 'Explanation', rowDefault: 'New entry',
  invalidFile: 'Choose an image smaller than 2 MB.', exists: 'Added', move: 'Drag to move', resize: 'Drag the border to resize',
};
const cn: typeof en = {
  add: '添加底部组件', title: '底部组件', tower1: '左下角塔楼', tower2: '花纹装饰', town: '钟楼小镇', image: '上传图片',
  legend: '非首夜提示', explanation: '说明组件', state: '中毒／醉酒说明', madness: '疯狂说明', list: '自定义说明列表', active: '已添加组件',
  empty: '这一页还没有添加组件。', opacity: '透明度', close: '关闭', edit: '编辑', remove: '删除',
  content: '文字内容', heading: '标题', description: '说明', columns: '列数', one: '单列', two: '双列',
  rows: '列表条目', addRow: '添加条目', icon: '上传条目图标', save: '保存', cancel: '取消',
  legendDefault: '* 不含首夜', listDefault: '说明列表', rowDefault: '新条目',
  invalidFile: '请选择不超过 2MB 的图片。', exists: '已添加', move: '拖动移动', resize: '拖动边框调整大小',
};
const es: typeof en = { ...en, add: 'Añadir componente inferior', title: 'Componentes inferiores', tower1: 'Torre izquierda', tower2: 'Adorno floral', town: 'Silueta de la ciudad', image: 'Subir imagen', legend: 'Aviso de primera noche', explanation: 'Explicación', state: 'Explicación de veneno y ebriedad', madness: 'Explicación de locura', list: 'Lista personalizada', active: 'Componentes añadidos', close: 'Cerrar', edit: 'Editar', remove: 'Eliminar', content: 'Texto', heading: 'Título', description: 'Descripción', columns: 'Columnas', one: 'Una columna', two: 'Dos columnas', rows: 'Elementos', addRow: 'Añadir elemento', icon: 'Subir icono', save: 'Guardar', cancel: 'Cancelar', legendDefault: '* Excepto la 1.ª noche' };
const de: typeof en = { ...en, add: 'Element unten hinzufügen', title: 'Untere Elemente', tower1: 'Linker Turm', tower2: 'Blumenschmuck', town: 'Stadtsilhouette', image: 'Bild hochladen', legend: 'Hinweis zur ersten Nacht', explanation: 'Erklärung', state: 'Erklärung: Vergiftung / Trunkenheit', madness: 'Erklärung: Wahnsinn', list: 'Eigene Erklärungsliste', active: 'Hinzugefügte Elemente', close: 'Schließen', edit: 'Bearbeiten', remove: 'Löschen', content: 'Text', heading: 'Titel', description: 'Beschreibung', columns: 'Spalten', one: 'Eine Spalte', two: 'Zwei Spalten', rows: 'Listeneinträge', addRow: 'Eintrag hinzufügen', icon: 'Symbol hochladen', save: 'Speichern', cancel: 'Abbrechen', legendDefault: '* Außer in der 1. Nacht' };
export const footerText = (language: Language): typeof en => ({ cn, en, es, de }[language] || en);
