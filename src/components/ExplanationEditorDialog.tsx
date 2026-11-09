import { useCallback, useEffect, useRef, useState, type ClipboardEvent, type MouseEvent } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import {
  FormatAlignCenter, FormatAlignJustify, FormatAlignLeft, FormatAlignRight, FormatBold, FormatClear,
  FormatColorFill, FormatColorText, FormatItalic, FormatListBulleted, FormatListNumbered,
  FormatStrikethrough, FormatUnderlined, Redo, Undo,
} from '@mui/icons-material';
import { observer } from 'mobx-react-lite';
import type { RichTextDocument } from '../types';
import type { Language } from '../utils/languages';
import { useTranslation } from '../utils/i18n';
import { uiConfigStore } from '../stores/UIConfigStore';
import { explanationDocumentFromHtml, explanationDocumentToHtml } from '../utils/explanationRichText';
import { execEditorCommand } from '../utils/richTextContentEditable';
import { footerText } from '../utils/footerText';

const labels: Record<Language, Record<string, string>> = {
  en: { title: 'Edit explanation', font: 'Font', size: 'Font size', customSize: 'Custom size', bold: 'Bold', italic: 'Italic', underline: 'Underline', strike: 'Strikethrough',
    left: 'Align left', center: 'Align center', right: 'Align right', justify: 'Justify', bullets: 'Bullet list', numbers: 'Numbered list',
    color: 'Text color', highlight: 'Highlight color', undo: 'Undo', redo: 'Redo', clear: 'Clear formatting', editor: 'Explanation text' },
  cn: { title: '编辑说明', font: '字体', size: '字号', customSize: '自定义字号', bold: '加粗', italic: '斜体', underline: '下划线', strike: '删除线',
    left: '左对齐', center: '居中对齐', right: '右对齐', justify: '两端对齐', bullets: '项目符号', numbers: '编号列表',
    color: '文字颜色', highlight: '高亮颜色', undo: '撤销', redo: '重做', clear: '清除格式', editor: '说明内容' },
  es: { title: 'Editar explicación', font: 'Fuente', size: 'Tamaño', customSize: 'Tamaño personalizado', bold: 'Negrita', italic: 'Cursiva', underline: 'Subrayado', strike: 'Tachado',
    left: 'Alinear a la izquierda', center: 'Centrar', right: 'Alinear a la derecha', justify: 'Justificar', bullets: 'Viñetas', numbers: 'Lista numerada',
    color: 'Color del texto', highlight: 'Color de resaltado', undo: 'Deshacer', redo: 'Rehacer', clear: 'Borrar formato', editor: 'Texto de explicación' },
  de: { title: 'Erklärung bearbeiten', font: 'Schriftart', size: 'Schriftgröße', customSize: 'Eigene Schriftgröße', bold: 'Fett', italic: 'Kursiv', underline: 'Unterstrichen', strike: 'Durchgestrichen',
    left: 'Linksbündig', center: 'Zentrieren', right: 'Rechtsbündig', justify: 'Blocksatz', bullets: 'Aufzählung', numbers: 'Nummerierung',
    color: 'Textfarbe', highlight: 'Hervorhebungsfarbe', undo: 'Rückgängig', redo: 'Wiederholen', clear: 'Formatierung entfernen', editor: 'Erklärungstext' },
};

const buttonSx = { width: 34, height: 34, borderRadius: 1, color: '#465f4c', '&:hover': { backgroundColor: 'rgba(96,121,99,.12)' } } as const;

const ExplanationEditorDialog = observer(({ value, onClose, onSave }: {
  value: RichTextDocument; onClose: () => void; onSave: (value: RichTextDocument) => void;
}) => {
  const { language } = useTranslation();
  const s = footerText(language), l = labels[language] || labels.en;
  const editorRef = useRef<HTMLDivElement>(null);
  const customSizeRef = useRef<HTMLInputElement>(null);
  const selectionRef = useRef<Range | null>(null);
  const pendingFontSize = useRef<string | null>(null);
  const menuAction = useRef<{ kind: 'font' | 'size' | 'custom-size'; value: string } | null>(null);
  const [font, setFont] = useState('');
  const [size, setSize] = useState('');
  const [customSize, setCustomSize] = useState('16');
  const [textColor, setTextColor] = useState('#7e2927');
  const [highlightColor, setHighlightColor] = useState('#fff1a8');
  const [active, setActive] = useState<Record<string, boolean>>({});

  const setEditor = useCallback((editor: HTMLDivElement | null) => {
    editorRef.current = editor;
    if (editor) editor.innerHTML = explanationDocumentToHtml(value);
  }, [value]);
  const rememberSelection = useCallback(() => {
    const selection = window.getSelection(), editor = editorRef.current;
    if (editor && selection?.rangeCount && editor.contains(selection.getRangeAt(0).commonAncestorContainer)) {
      selectionRef.current = selection.getRangeAt(0).cloneRange();
      const next: Record<string, boolean> = {};
      for (const command of ['bold', 'italic', 'underline', 'strikeThrough', 'insertUnorderedList', 'insertOrderedList']) {
        try { next[command] = document.queryCommandState(command); } catch { next[command] = false; }
      }
      setActive(old => Object.keys(next).every(key => old[key] === next[key]) ? old : next);
    }
  }, []);
  useEffect(() => { document.addEventListener('selectionchange', rememberSelection); return () => document.removeEventListener('selectionchange', rememberSelection); }, [rememberSelection]);

  const restoreSelection = () => {
    const editor = editorRef.current;
    if (!editor) return false;
    editor.focus({ preventScroll: true });
    const selection = window.getSelection();
    if (selection && selectionRef.current && editor.contains(selectionRef.current.commonAncestorContainer)) {
      selection.removeAllRanges(); selection.addRange(selectionRef.current);
    }
    return true;
  };
  const command = (name: string, argument?: string) => {
    if (!restoreSelection()) return;
    execEditorCommand(name, argument);
    rememberSelection();
  };
  const convertSizeMarkers = (fontSize: string) => {
    const markers = editorRef.current?.querySelectorAll<HTMLElement>('font[size="7"]');
    markers?.forEach(marker => { marker.removeAttribute('size'); marker.style.fontSize = fontSize; });
    return Boolean(markers?.length);
  };
  const applyFontSize = (raw: string) => {
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 8 || parsed > 96 || !restoreSelection()) return;
    const next = `${Math.round(parsed)}px`;
    const collapsed = Boolean(window.getSelection()?.isCollapsed);
    try { document.execCommand('styleWithCSS', false, 'false'); } catch { /* Browser does not expose this option. */ }
    execEditorCommand('fontSize', '7');
    const applied = convertSizeMarkers(next);
    pendingFontSize.current = collapsed && !applied ? next : null;
    rememberSelection();
  };
  const handleInput = () => {
    if (pendingFontSize.current && convertSizeMarkers(pendingFontSize.current)) pendingFontSize.current = null;
    rememberSelection();
  };
  const preventFocusLoss = (event: MouseEvent<HTMLElement>) => { rememberSelection(); event.preventDefault(); };
  const returnFromMenu = () => {
    const action = menuAction.current;
    menuAction.current = null;
    if (action?.kind === 'custom-size') customSizeRef.current?.focus();
    else if (action?.kind === 'font' && action.value) command('fontName', action.value);
    else if (action?.kind === 'size' && action.value) applyFontSize(action.value);
    else if (action) restoreSelection();
  };
  const menuProps = { disableRestoreFocus: true, transitionDuration: 0, slotProps: { transition: { onExited: returnFromMenu } } } as const;
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const html = event.clipboardData.getData('text/html'), plain = event.clipboardData.getData('text/plain');
    if (html) execEditorCommand('insertHTML', explanationDocumentToHtml(explanationDocumentFromHtml(html)));
    else execEditorCommand('insertText', plain);
    rememberSelection();
  };
  const tool = (name: string, cmd: string, icon: React.ReactNode) => <Tooltip key={cmd} title={l[name]}>
    <IconButton size="small" aria-label={l[name]} aria-pressed={active[cmd] || undefined} onMouseDown={preventFocusLoss}
      onClick={() => command(cmd)} sx={{ ...buttonSx, ...(active[cmd] ? { backgroundColor: 'rgba(96,121,99,.2)' } : {}) }}>{icon}</IconButton>
  </Tooltip>;
  const divider = <Box aria-hidden="true" sx={{ width: '1px', height: 22, mx: 0.5, backgroundColor: '#d8d3c8' }} />;

  return <Dialog open onClose={onClose} fullWidth maxWidth="md" disableScrollLock>
    <DialogTitle>{l.title}</DialogTitle>
    <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', minHeight: { xs: 360, sm: 460 }, gap: 1.5 }}>
      <Box role="toolbar" aria-label={l.title} sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.25,
        p: 0.75, border: '1px solid #ddd5c6', borderRadius: 1, backgroundColor: '#f8f6f1' }}>
        <Select size="small" value={font} displayEmpty inputProps={{ 'aria-label': l.font }} onMouseDown={rememberSelection} MenuProps={menuProps}
          onChange={event => setFont(String(event.target.value))}
          sx={{ minWidth: 140, height: 34, fontSize: '.8rem' }}>
          <MenuItem value="" onClick={() => { menuAction.current = { kind: 'font', value: '' }; }}>{l.font}</MenuItem>
          {uiConfigStore.availableFonts.map(item => <MenuItem key={item.value} value={item.value} sx={{ fontFamily: item.value }}
            onClick={() => { menuAction.current = { kind: 'font', value: item.value }; }}>{item.label}</MenuItem>)}
        </Select>
        <Select size="small" value={size} displayEmpty inputProps={{ 'aria-label': l.size }} onMouseDown={rememberSelection} MenuProps={menuProps}
          onChange={event => setSize(String(event.target.value))}
          sx={{ minWidth: 78, height: 34, fontSize: '.8rem' }}>
          <MenuItem value="" onClick={() => { menuAction.current = { kind: 'size', value: '' }; }}>{l.size}</MenuItem>
          {['8', '9', '10', '11', '12', '14', '16', '18', '20', '24', '28', '36', '48', '72', '96'].map(label => <MenuItem key={label} value={label}
            onClick={() => { menuAction.current = { kind: 'size', value: label }; }}>{label}px</MenuItem>)}
          <MenuItem value="custom" onClick={() => { menuAction.current = { kind: 'custom-size', value: 'custom' }; }}>{l.customSize}</MenuItem>
        </Select>
        {size === 'custom' && <Box ref={customSizeRef} component="input" type="number" min={8} max={96} aria-label={l.customSize} title={l.customSize}
          value={customSize} onMouseDown={rememberSelection} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setCustomSize(event.target.value)}
          onKeyDown={(event: React.KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}
          onBlur={(event: React.FocusEvent<HTMLInputElement>) => applyFontSize(event.target.value)}
          sx={{ width: 64, height: 34, border: '1px solid #b9ad99', borderRadius: 1, px: 0.5, fontSize: '.8rem' }} />}
        {divider}
        {tool('undo', 'undo', <Undo fontSize="small" />)}{tool('redo', 'redo', <Redo fontSize="small" />)}
        {divider}
        {tool('bold', 'bold', <FormatBold fontSize="small" />)}{tool('italic', 'italic', <FormatItalic fontSize="small" />)}
        {tool('underline', 'underline', <FormatUnderlined fontSize="small" />)}{tool('strike', 'strikeThrough', <FormatStrikethrough fontSize="small" />)}
        {[{ label: l.color, value: textColor, set: setTextColor, cmd: 'foreColor', icon: <FormatColorText fontSize="small" /> },
          { label: l.highlight, value: highlightColor, set: setHighlightColor, cmd: 'hiliteColor', icon: <FormatColorFill fontSize="small" /> }].map(item =>
          <Tooltip key={item.cmd} title={item.label}><Box component="label" sx={{ ...buttonSx, display: 'grid', placeItems: 'center', position: 'relative', cursor: 'pointer' }}>
            {item.icon}<Box component="span" sx={{ position: 'absolute', bottom: 2, width: 18, height: 3, backgroundColor: item.value }} />
            <input type="color" aria-label={item.label} value={item.value} onMouseDown={rememberSelection}
              onChange={event => { item.set(event.target.value); command(item.cmd, event.target.value); }}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          </Box></Tooltip>)}
        {divider}
        {tool('left', 'justifyLeft', <FormatAlignLeft fontSize="small" />)}{tool('center', 'justifyCenter', <FormatAlignCenter fontSize="small" />)}
        {tool('right', 'justifyRight', <FormatAlignRight fontSize="small" />)}{tool('justify', 'justifyFull', <FormatAlignJustify fontSize="small" />)}
        {tool('bullets', 'insertUnorderedList', <FormatListBulleted fontSize="small" />)}{tool('numbers', 'insertOrderedList', <FormatListNumbered fontSize="small" />)}
        {tool('clear', 'removeFormat', <FormatClear fontSize="small" />)}
      </Box>
      <Box ref={setEditor} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label={l.editor}
        onInput={handleInput} onKeyUp={rememberSelection} onMouseUp={rememberSelection} onPaste={onPaste}
        sx={{ flex: 1, minHeight: 240, p: 2, border: '1px solid #cfc3ae', borderRadius: 1, backgroundColor: '#fffdf7',
          fontFamily: uiConfigStore.stateRuleContentFont, fontSize: uiConfigStore.specialRuleContentFontSize,
          color: '#302b25', lineHeight: 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', outline: 'none',
          '&:focus': { borderColor: '#607963', boxShadow: '0 0 0 2px rgba(96,121,99,.18)' },
          '& p, & div': { m: 0, '&:not(:last-child)': { mb: 0.5 } },
          '& h2, & h3, & h4': { m: 0, fontFamily: uiConfigStore.stateRuleTitleFont, fontSize: uiConfigStore.specialRuleTitleFontSize, lineHeight: 1.2 },
          '& ul, & ol': { my: 0.5, pl: 2.5 },
        }} />
    </DialogContent>
    <DialogActions><Button onClick={onClose}>{s.cancel}</Button>
      <Button variant="contained" onClick={() => { if (editorRef.current) onSave(explanationDocumentFromHtml(editorRef.current.innerHTML)); }}>{s.save}</Button></DialogActions>
  </Dialog>;
});

export default ExplanationEditorDialog;
