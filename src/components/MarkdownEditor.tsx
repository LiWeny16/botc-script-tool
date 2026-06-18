import { useState, useRef, useCallback, useEffect, type ClipboardEvent } from 'react';
import {
  Box,
  IconButton,
  Paper,
  Popover,
  alpha,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatColorText,
  FormatClear,
  FormatSize,
  KeyboardReturn,
  DensitySmall,
} from '@mui/icons-material';
import { THEME_COLORS } from '../theme/colors';
import { normalizeColor, normalizeFontSize, sanitizeAbilitySource } from '../utils/richTextSanitizer';
import { abilitySourceToEditorHtml, serializeEditorHtml } from '../utils/richTextConvert';
import { applyColorSpan, applyFontSizeSpan, removeColorSpan, removeFontSizeSpan, execEditorCommand } from '../utils/richTextContentEditable';
import { markdownRichTextSx } from '../utils/richTextStyles';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  textFieldSx?: object;
  teamColor: string;
  label?: string;
  minRows?: number;
  maxRows?: number;
}

interface ToolDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  shortcut: string;
  run: (editor: HTMLDivElement) => void;
}

interface BlockToolDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  shortcut: string;
  command: string;
}

const PRESET_COLORS = [
  { label: 'Evil', color: THEME_COLORS.evil },
  { label: 'Good', color: THEME_COLORS.good },
  { label: 'Purple', color: THEME_COLORS.purple },
  { label: 'Fabled', color: THEME_COLORS.fabled },
  { label: 'Loric', color: THEME_COLORS.loric },
  { label: 'Black', color: '#000000' },
  { label: 'Gray', color: THEME_COLORS.gray },
];

const PRESET_FONT_SIZES = [12, 13, 14, 15, 16, 18, 20, 24];

/** Popover opens upward above the toolbar button. */
const popoverAboveProps = {
  anchorOrigin: { vertical: 'top' as const, horizontal: 'left' as const },
  transformOrigin: { vertical: 'bottom' as const, horizontal: 'left' as const },
};

const btnSx = {
  width: 30,
  height: 30,
  borderRadius: 1,
  color: '#475467',
  '&:hover': { backgroundColor: alpha('#101828', 0.08), color: '#101828' },
};

function runCommand(editor: HTMLDivElement, command: string, commandValue?: string) {
  editor.focus();
  execEditorCommand(command, commandValue);
}

function buildTools(onSync: () => void): ToolDef[] {
  return [
    {
      key: 'bold',
      icon: <FormatBold fontSize="small" />,
      title: 'Bold',
      shortcut: 'Ctrl+B',
      run: (editor) => {
        runCommand(editor, 'bold');
        onSync();
      },
    },
    {
      key: 'italic',
      icon: <FormatItalic fontSize="small" />,
      title: 'Italic',
      shortcut: 'Ctrl+I',
      run: (editor) => {
        runCommand(editor, 'italic');
        onSync();
      },
    },
    {
      key: 'boldItalic',
      icon: (
        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>
          <FormatBold sx={{ fontSize: 14 }} />
          <FormatItalic sx={{ fontSize: 14, ml: -0.25 }} />
        </Box>
      ),
      title: 'Bold + Italic',
      shortcut: 'Ctrl+Shift+I',
      run: (editor) => {
        runCommand(editor, 'bold');
        runCommand(editor, 'italic');
        onSync();
      },
    },
    {
      key: 'underline',
      icon: <FormatUnderlined fontSize="small" />,
      title: 'Underline',
      shortcut: 'Ctrl+U',
      run: (editor) => {
        runCommand(editor, 'underline');
        onSync();
      },
    },
    {
      key: 'strikethrough',
      icon: <FormatStrikethrough fontSize="small" />,
      title: 'Strikethrough',
      shortcut: 'Ctrl+Shift+S',
      run: (editor) => {
        runCommand(editor, 'strikeThrough');
        onSync();
      },
    },
  ];
}

const BLOCK_TOOLS: BlockToolDef[] = [
  { key: 'lineBreak', icon: <KeyboardReturn fontSize="small" />, title: 'Line Break', command: 'insertLineBreak', shortcut: 'Ctrl+Enter' },
  { key: 'paragraph', icon: <DensitySmall fontSize="small" />, title: 'New Paragraph', command: 'insertParagraph', shortcut: 'Ctrl+Shift+Enter' },
  { key: 'ul', icon: <FormatListBulleted fontSize="small" />, title: 'Bullet List', command: 'insertUnorderedList', shortcut: 'Ctrl+Shift+U' },
  { key: 'ol', icon: <FormatListNumbered fontSize="small" />, title: 'Numbered List', command: 'insertOrderedList', shortcut: 'Ctrl+Shift+O' },
];

export default function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  teamColor,
  label,
  minRows = 4,
  maxRows = 7,
}: MarkdownEditorProps) {
  const [colorAnchor, setColorAnchor] = useState<HTMLElement | null>(null);
  const [fontSizeAnchor, setFontSizeAnchor] = useState<HTMLElement | null>(null);
  const [customColor, setCustomColor] = useState('#0078ba');
  const [isEmpty, setIsEmpty] = useState(!value);
  const editorRef = useRef<HTMLDivElement>(null);
  const internalUpdateRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  const syncFromEditor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const serialized = serializeEditorHtml(editor.innerHTML);
    setIsEmpty(!serialized);
    if (serialized !== valueRef.current) {
      internalUpdateRef.current = true;
      onChange(serialized);
    }
  }, [onChange]);

  const tools = buildTools(syncFromEditor);

  const applyEditorHtml = useCallback((source: string) => {
    const editor = editorRef.current;
    if (!editor) return;
    const html = abilitySourceToEditorHtml(source);
    editor.innerHTML = html || '';
    setIsEmpty(!source);
  }, []);

  useEffect(() => {
    if (internalUpdateRef.current) {
      internalUpdateRef.current = false;
      return;
    }
    applyEditorHtml(value);
  }, [value, applyEditorHtml]);

  const insertColor = useCallback(
    (rawColor: string) => {
      const safeColor = normalizeColor(rawColor);
      const editor = editorRef.current;
      if (!safeColor || !editor) return;

      editor.focus();
      const applied = execEditorCommand('foreColor', safeColor);
      if (!applied) applyColorSpan(editor, safeColor);
      syncFromEditor();
      setColorAnchor(null);
    },
    [syncFromEditor],
  );

  const insertFontSize = useCallback(
    (rawSize: string) => {
      const safeSize = normalizeFontSize(rawSize);
      const editor = editorRef.current;
      if (!safeSize || !editor) return;

      editor.focus();
      applyFontSizeSpan(editor, safeSize);
      syncFromEditor();
      setFontSizeAnchor(null);
    },
    [syncFromEditor],
  );

  const clearFormatting = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    // Remove inline formatting (bold, italic, color, font-size, etc.)
    runCommand(editor, 'removeFormat');
    // Also toggle off list formatting — walk up to find LI/UL/OL, then outdent
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      let node: Node | null = sel.getRangeAt(0).commonAncestorContainer;
      while (node && node !== editor) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const tag = (node as HTMLElement).tagName;
          if (tag === 'LI' || tag === 'UL' || tag === 'OL') {
            runCommand(editor, 'outdent');
            break;
          }
        }
        node = node.parentNode;
      }
    }
    syncFromEditor();
  }, [syncFromEditor]);

  const removeFontSize = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    removeFontSizeSpan(editor);
    syncFromEditor();
    setFontSizeAnchor(null);
  }, [syncFromEditor]);

  const removeColor = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    removeColorSpan(editor);
    syncFromEditor();
    setColorAnchor(null);
  }, [syncFromEditor]);

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLDivElement>) => {
      e.preventDefault();
      const editor = editorRef.current;
      if (!editor) return;

      editor.focus();
      const html = e.clipboardData.getData('text/html');
      const text = e.clipboardData.getData('text/plain');

      if (html) {
        execEditorCommand('insertHTML', sanitizeAbilitySource(html));
      } else {
        execEditorCommand('insertText', text);
      }
      syncFromEditor();
    },
    [syncFromEditor],
  );

  const runTool = useCallback(
    (key: string) => {
      const editor = editorRef.current;
      if (!editor) return;
      switch (key) {
        case 'bold':
          runCommand(editor, 'bold');
          break;
        case 'italic':
          runCommand(editor, 'italic');
          break;
        case 'boldItalic':
          runCommand(editor, 'bold');
          runCommand(editor, 'italic');
          break;
        case 'underline':
          runCommand(editor, 'underline');
          break;
        case 'strikethrough':
          runCommand(editor, 'strikeThrough');
          break;
        default:
          return;
      }
      syncFromEditor();
    },
    [syncFromEditor],
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;
      if (document.activeElement !== editorRef.current) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      if (ctrl && !shift && e.key === 'z') return;
      if (ctrl && !shift && e.key === 'y') return;
      if (ctrl && shift && (e.key === 'Z' || e.key === 'z')) return;

      const editor = editorRef.current;
      if (!editor) return;

      if (ctrl && !shift && e.key === 'b') {
        e.preventDefault();
        runTool('bold');
      } else if (ctrl && !shift && e.key === 'i') {
        e.preventDefault();
        runTool('italic');
      } else if (ctrl && shift && (e.key === 'I' || e.key === 'i')) {
        e.preventDefault();
        runTool('boldItalic');
      } else if (ctrl && !shift && e.key === 'u') {
        e.preventDefault();
        runTool('underline');
      } else if (ctrl && shift && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        runTool('strikethrough');
      } else if (ctrl && shift && e.key === 'Enter') {
        e.preventDefault();
        runCommand(editor, 'insertParagraph');
        syncFromEditor();
      } else if (ctrl && !shift && e.key === 'Enter') {
        e.preventDefault();
        runCommand(editor, 'insertLineBreak');
        syncFromEditor();
      } else if (ctrl && shift && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        runCommand(editor, 'insertUnorderedList');
        syncFromEditor();
      } else if (ctrl && shift && (e.key === 'O' || e.key === 'o')) {
        e.preventDefault();
        runCommand(editor, 'insertOrderedList');
        syncFromEditor();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [disabled, syncFromEditor, runTool]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 0.25,
          px: 0.75,
          py: 0.25,
          mb: 0.75,
          borderRadius: 1.5,
          backgroundColor: alpha('#101828', 0.03),
          border: `1px solid ${alpha('#101828', 0.06)}`,
        }}
      >
        {tools.map((t) => (
          <IconButton
            key={t.key}
            size="small"
            disabled={disabled}
            title={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editorRef.current && t.run(editorRef.current)}
            sx={btnSx}
          >
            {t.icon}
          </IconButton>
        ))}

        <Box sx={{ width: 1, height: 18, backgroundColor: alpha('#101828', 0.08), mx: 0.25 }} />

        {BLOCK_TOOLS.map((t) => (
          <IconButton
            key={t.key}
            size="small"
            disabled={disabled}
            title={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const editor = editorRef.current;
              if (!editor) return;
              runCommand(editor, t.command);
              syncFromEditor();
            }}
            sx={btnSx}
          >
            {t.icon}
          </IconButton>
        ))}

        <IconButton
          size="small"
          disabled={disabled}
          title="Font Size"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => setFontSizeAnchor(e.currentTarget)}
          sx={btnSx}
        >
          <FormatSize fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          disabled={disabled}
          title="Text Color"
          onMouseDown={(e) => e.preventDefault()}
          onClick={(e) => setColorAnchor(e.currentTarget)}
          sx={btnSx}
        >
          <FormatColorText fontSize="small" />
        </IconButton>

        <IconButton
          size="small"
          disabled={disabled}
          title="Clear Formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearFormatting}
          sx={btnSx}
        >
          <FormatClear fontSize="small" />
        </IconButton>
      </Paper>

      <Popover
        open={Boolean(fontSizeAnchor)}
        anchorEl={fontSizeAnchor}
        onClose={() => setFontSizeAnchor(null)}
        {...popoverAboveProps}
      >
        <Box sx={{ p: 1.5, width: 220 }}>
          <Box
            component="button"
            type="button"
            onClick={removeFontSize}
            sx={{
              width: '100%',
              height: 32,
              mb: 1,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: alpha('#101828', 0.18),
              backgroundColor: 'transparent',
              cursor: 'pointer',
              p: 0,
              fontSize: 13,
              fontWeight: 640,
              color: '#667085',
              '&:hover': { borderColor: teamColor, color: teamColor, backgroundColor: alpha(teamColor, 0.04) },
            }}
          >
            Default (14px)
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75 }}>
            {PRESET_FONT_SIZES.map((size) => (
              <Box
                key={size}
                component="button"
                type="button"
                onClick={() => insertFontSize(`${size}px`)}
                sx={{
                  height: 36,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: alpha('#101828', 0.12),
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                  p: 0,
                  fontSize: Math.min(size, 18),
                  fontWeight: 600,
                  color: '#344054',
                  '&:hover': { borderColor: teamColor, color: teamColor },
                }}
                aria-label={`${size}px`}
              >
                {size}
              </Box>
            ))}
          </Box>
        </Box>
      </Popover>

      <Popover
        open={Boolean(colorAnchor)}
        anchorEl={colorAnchor}
        onClose={() => setColorAnchor(null)}
        {...popoverAboveProps}
      >
        <Box sx={{ p: 1.5, width: 220 }}>
          <Box
            component="button"
            type="button"
            onClick={removeColor}
            sx={{
              width: '100%',
              height: 32,
              mb: 1,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: alpha('#101828', 0.18),
              backgroundColor: 'transparent',
              cursor: 'pointer',
              p: 0,
              fontSize: 13,
              fontWeight: 640,
              color: '#667085',
              '&:hover': { borderColor: teamColor, color: teamColor, backgroundColor: alpha(teamColor, 0.04) },
            }}
          >
            Default
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0.75, mb: 1.5 }}>
            {PRESET_COLORS.map(({ label: colorLabel, color }) => (
              <Box
                key={colorLabel}
                component="button"
                type="button"
                onClick={() => insertColor(color)}
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: alpha('#101828', 0.12),
                  backgroundColor: color,
                  cursor: 'pointer',
                  p: 0,
                  '&:hover': { borderColor: teamColor },
                }}
                aria-label={colorLabel}
              />
            ))}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Box
              component="input"
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              sx={{ width: 36, height: 36, p: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              aria-label="Custom color"
            />
            <Box
              component="button"
              type="button"
              onClick={() => insertColor(customColor)}
              sx={{
                flex: 1,
                py: 0.75,
                borderRadius: 1,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: alpha(teamColor, 0.12),
                color: teamColor,
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              Apply Color
            </Box>
          </Box>
        </Box>
      </Popover>

      <Box
        sx={{
          borderRadius: 2,
          backgroundColor: '#f4f6f7',
          boxShadow: `inset 0 0 0 1px ${alpha('#101828', 0.06)}, 0 1px 2px ${alpha('#101828', 0.03)}`,
          transition: 'background-color 160ms ease, box-shadow 160ms ease',
          opacity: disabled ? 0.6 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
          '&:focus-within': {
            backgroundColor: '#fff',
            boxShadow: `inset 0 0 0 1px ${alpha(teamColor, 0.32)}, 0 0 0 4px ${alpha(teamColor, 0.12)}`,
          },
        }}
      >
        <Box
          ref={editorRef}
          component="div"
          contentEditable={!disabled}
          suppressContentEditableWarning
          role="textbox"
          aria-multiline
          aria-label={label}
          data-empty={isEmpty ? 'true' : 'false'}
          data-placeholder={label}
          onInput={syncFromEditor}
          onBlur={syncFromEditor}
          onFocus={() => {
            const editor = editorRef.current;
            if (editor && editor.innerHTML === '') editor.innerHTML = '<br>';
          }}
          onPaste={handlePaste}
          sx={{
            minHeight: minRows * 24 + 16,
            maxHeight: maxRows ? maxRows * 24 + 16 : undefined,
            overflowY: 'auto',
            px: 1.75,
            py: 1.5,
            fontSize: 15,
            lineHeight: 1.5,
            outline: 'none',
            wordBreak: 'break-word',
            '&[data-empty="true"]:before': {
              content: 'attr(data-placeholder)',
              color: alpha('#101828', 0.45),
              pointerEvents: 'none',
            },
            ...markdownRichTextSx,
          }}
        />
      </Box>
    </Box>
  );
}
