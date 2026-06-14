import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  ToggleButton,
  Paper,
  alpha,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatStrikethrough,
  FormatUnderlined,
  Title,
  FormatListBulleted,
  FormatListNumbered,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import MarkdownRenderer from './MarkdownRenderer';

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

type WrappingStyle = [string, string]; // [prefix, suffix]

interface ToolDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  wrap: WrappingStyle;
  shortcut: string;
  /** Alternate marker pairs to recognize when toggling off (e.g. <b>/</b> for bold) */
  altWraps?: WrappingStyle[];
}

const TOOLS: ToolDef[] = [
  { key: 'bold', icon: <FormatBold fontSize="small" />, title: 'Bold', wrap: ['**', '**'], shortcut: 'Ctrl+B', altWraps: [['<b>', '</b>'], ['<strong>', '</strong>']] },
  { key: 'italic', icon: <FormatItalic fontSize="small" />, title: 'Italic', wrap: ['*', '*'], shortcut: 'Ctrl+I', altWraps: [['<i>', '</i>'], ['<em>', '</em>']] },
  { key: 'underline', icon: <FormatUnderlined fontSize="small" />, title: 'Underline', wrap: ['<u>', '</u>'], shortcut: 'Ctrl+U' },
  { key: 'strikethrough', icon: <FormatStrikethrough fontSize="small" />, title: 'Strikethrough', wrap: ['~~', '~~'], shortcut: 'Ctrl+Shift+S', altWraps: [['<s>', '</s>'], ['<del>', '</del>']] },
];

interface BlockToolDef {
  key: string;
  icon: React.ReactNode;
  title: string;
  prefix: string;
  shortcut: string;
}

const BLOCK_TOOLS: BlockToolDef[] = [
  { key: 'heading', icon: <Title fontSize="small" />, title: 'Heading', prefix: '## ', shortcut: 'Ctrl+H' },
  { key: 'ul', icon: <FormatListBulleted fontSize="small" />, title: 'Unordered List', prefix: '- ', shortcut: 'Ctrl+Shift+U' },
  { key: 'ol', icon: <FormatListNumbered fontSize="small" />, title: 'Ordered List', prefix: '1. ', shortcut: 'Ctrl+Shift+O' },
];

const btnSx = {
  width: 30,
  height: 30,
  borderRadius: 1,
  color: '#475467',
  '&:hover': { backgroundColor: alpha('#101828', 0.08), color: '#101828' },
};

// ── Undo-aware helpers ──────────────────────────────────────────────

/**
 * Result of finding a text wrapping.
 */
interface WrappingMatch {
  wrapperStart: number;  // position of the opening marker
  wrapperEnd: number;    // position AFTER the closing marker
  prefix: string;
  suffix: string;
}

/**
 * Check if a position in `value` is wrapped by a marker pair.
 *
 * Handles three cases:
 *   A. Selection boundaries at wrapper edges:  `**|text|**`
 *   B. Cursor inside wrapped text (no selection): `**wo|rld**`
 *   C. Selection includes the markers:           `|**text**|`
 */
function findWrapping(
  value: string,
  selStart: number,
  selEnd: number,
  prefixes: string[],
  suffixes: string[],
): WrappingMatch | null {
  const before = value.substring(0, selStart);
  const after = value.substring(selEnd);
  const selected = value.substring(selStart, selEnd);

  for (let i = 0; i < prefixes.length; i++) {
    const prefix = prefixes[i];
    const suffix = suffixes[i];

    // Case A: selection boundaries at wrapper edges
    if (before.endsWith(prefix) && after.startsWith(suffix)) {
      return { wrapperStart: selStart - prefix.length, wrapperEnd: selEnd + suffix.length, prefix, suffix };
    }

    // Case B: cursor inside wrapped text (no selection)
    if (selStart === selEnd) {
      const prefixPos = before.lastIndexOf(prefix);
      if (prefixPos === -1) continue;
      const between = before.substring(prefixPos + prefix.length);
      if (between.includes(suffix)) continue;
      const suffixPos = after.indexOf(suffix);
      if (suffixPos === -1) continue;
      const afterBetween = after.substring(0, suffixPos);
      if (afterBetween.includes(prefix)) continue;
      return { wrapperStart: prefixPos, wrapperEnd: selEnd + suffixPos + suffix.length, prefix, suffix };
    }

    // Case C: selection includes the markers
    if (selected.startsWith(prefix) && selected.endsWith(suffix) && selected.length >= prefix.length + suffix.length) {
      return { wrapperStart: selStart, wrapperEnd: selEnd, prefix, suffix };
    }
  }
  return null;
}

/**
 * Perform an undoable text replacement via `execCommand('insertText')`.
 * This integrates with the browser's native undo stack, so Ctrl+Z works.
 *
 * If execCommand is unavailable the change falls back to calling `onChange`
 * directly (still works, just not undoable for this one operation).
 */
function execUndoableReplace(
  el: HTMLTextAreaElement,
  currentValue: string,
  replaceStart: number,
  replaceEnd: number,
  replacement: string,
  afterCursor: [number, number],
  onChange: (v: string) => void,
) {
  el.focus();
  el.setSelectionRange(replaceStart, replaceEnd);

  let succeeded = false;
  try {
    succeeded = document.execCommand('insertText', false, replacement);
  } catch {
    // execCommand may throw in some sandboxed environments
  }

  if (!succeeded) {
    // Fallback: manual value update (no undo entry, but at least the change applies)
    const newValue =
      currentValue.substring(0, replaceStart) + replacement + currentValue.substring(replaceEnd);
    onChange(newValue);
  }

  // Restore cursor after React re-render
  requestAnimationFrame(() => {
    el.focus();
    el.setSelectionRange(afterCursor[0], afterCursor[1]);
  });
}

// ════════════════════════════════════════════════════════════════════

export default function MarkdownEditor({
  value,
  onChange,
  disabled = false,
  textFieldSx,
  teamColor,
  label,
  minRows = 4,
  maxRows = 7,
}: MarkdownEditorProps) {
  const [preview, setPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Latest value for keyboard handlers (avoids stale closure)
  const valueRef = useRef(value);
  valueRef.current = value;

  const insertWrap = useCallback(
    (tool: ToolDef) => {
      const { wrap, altWraps } = tool;
      const [prefix, suffix] = wrap;
      const allPrefixes = [prefix, ...(altWraps ?? []).map((w) => w[0])];
      const allSuffixes = [suffix, ...(altWraps ?? []).map((w) => w[1])];

      const el = textareaRef.current;
      if (!el) { onChange(value + prefix + suffix); return; }

      const currentValue = valueRef.current;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const selected = currentValue.substring(start, end);

      // ── Toggle OFF ──
      const wrapping = findWrapping(currentValue, start, end, allPrefixes, allSuffixes);
      if (wrapping) {
        const innerText = currentValue.substring(
          wrapping.wrapperStart + wrapping.prefix.length,
          wrapping.wrapperEnd - wrapping.suffix.length,
        );
        execUndoableReplace(
          el,
          currentValue,
          wrapping.wrapperStart,
          wrapping.wrapperEnd,
          innerText,
          [wrapping.wrapperStart, wrapping.wrapperStart + innerText.length],
          onChange,
        );
        return;
      }

      // ── Toggle ON ──
      const replacement = prefix + selected + suffix;
      const cursorStart = start + prefix.length;
      const cursorEnd = selected ? end + prefix.length : cursorStart;
      execUndoableReplace(el, currentValue, start, end, replacement, [cursorStart, cursorEnd], onChange);
    },
    [value, onChange],
  );

  const insertBlock = useCallback(
    (prefix: string) => {
      const el = textareaRef.current;
      if (!el) { onChange(value + prefix); return; }

      const currentValue = valueRef.current;
      const start = el.selectionStart;
      const before = currentValue.substring(0, start);
      const lineStart = before.lastIndexOf('\n') + 1;
      const cursorAfter = lineStart + prefix.length + (start - lineStart);

      execUndoableReplace(el, currentValue, lineStart, lineStart, prefix, [cursorAfter, cursorAfter], onChange);
    },
    [value, onChange],
  );

  // ── Keyboard shortcuts ──────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled || preview) return;
      if (document.activeElement !== textareaRef.current) return;

      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;

      // Let browser handle undo/redo natively (these bindings are universal)
      if (ctrl && !shift && e.key === 'z') return;
      if (ctrl && !shift && e.key === 'y') return;
      if (ctrl && shift && (e.key === 'Z' || e.key === 'z')) return;

      if (ctrl && !shift && e.key === 'b') {
        e.preventDefault();
        insertWrap(TOOLS[0]);
      } else if (ctrl && !shift && e.key === 'i') {
        e.preventDefault();
        insertWrap(TOOLS[1]);
      } else if (ctrl && !shift && e.key === 'u') {
        e.preventDefault();
        insertWrap(TOOLS[2]);
      } else if (ctrl && shift && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        insertWrap(TOOLS[3]);
      } else if (ctrl && !shift && e.key === 'h') {
        e.preventDefault();
        insertBlock('## ');
      }
    };

    const el = textareaRef.current;
    if (el) el.addEventListener('keydown', handleKeyDown);
    return () => { if (el) el.removeEventListener('keydown', handleKeyDown); };
  }, [disabled, preview, insertWrap, insertBlock]);

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          display: 'flex',
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
        {TOOLS.map((t) => (
          <IconButton
            key={t.key}
            size="small"
            disabled={disabled}
            title={`${t.title} (${t.shortcut})`}
            onClick={() => insertWrap(t)}
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
            title={`${t.title} (${t.shortcut})`}
            onClick={() => insertBlock(t.prefix)}
            sx={btnSx}
          >
            {t.icon}
          </IconButton>
        ))}
        <Box sx={{ flex: 1 }} />
        <ToggleButton
          value="preview"
          size="small"
          disabled={disabled}
          selected={preview}
          onChange={() => setPreview(!preview)}
          title={preview ? 'Edit' : 'Preview'}
          sx={{
            width: 30,
            height: 30,
            borderRadius: 1,
            border: 'none',
            color: preview ? teamColor : '#475467',
            '&.Mui-selected': {
              backgroundColor: alpha(teamColor, 0.1),
              '&:hover': { backgroundColor: alpha(teamColor, 0.15) },
            },
          }}
        >
          {preview ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
        </ToggleButton>
      </Paper>

      {preview ? (
        <Paper
          elevation={0}
          sx={{
            p: 2,
            minHeight: minRows * 24 + 16,
            borderRadius: 2,
            backgroundColor: '#f4f6f7',
            boxShadow: `inset 0 0 0 1px ${alpha('#101828', 0.06)}, 0 1px 2px ${alpha('#101828', 0.03)}`,
            '& p': { m: 0, '&:not(:last-child)': { mb: 0.5 } },
            '& ul, & ol': { m: 0, pl: 2.5, '&:not(:last-child)': { mb: 0.5 } },
            '& li': { '&:not(:last-child)': { mb: 0.25 } },
            '& h1,h2,h3,h4': { m: 0, fontSize: 15, '&:not(:last-child)': { mb: 0.5 } },
            '& strong': { fontWeight: 700 },
            '& em': { fontStyle: 'italic' },
            '& del, & s': { textDecoration: 'line-through', opacity: 0.7 },
            '& u': { textDecoration: 'underline' },
            '& b': { fontWeight: 700 },
            '& i': { fontStyle: 'italic' },
          }}
        >
          <MarkdownRenderer content={value} />
        </Paper>
      ) : (
        <TextField
          fullWidth
          multiline
          minRows={minRows}
          maxRows={maxRows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          sx={textFieldSx}
          slotProps={{ htmlInput: { ref: textareaRef, 'aria-label': label } }}
        />
      )}
    </Box>
  );
}
