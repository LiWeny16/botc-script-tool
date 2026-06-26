#!/usr/bin/env node
/**
 * wf-mode-hook.mjs — Claude Code hook for WF-MAX / WF-REVIEW CEO enforcement
 *
 * Hook events:
 *   SessionStart    → reads Harness/.runtime/current-mode.json, injects CEO role
 *   UserPromptSubmit→ detects /wf-max, /wf-review, writes mode state,
 *                      emits per-turn reinforcement (prevents drift after compression)
 *   PreToolUse      → blocks CEO Edit/Write/MultiEdit/Bash on source files
 *
 * Inspired by caveman's hook architecture:
 *   - Symlink-safe I/O (O_NOFOLLOW, atomic rename, size cap, whitelist)
 *   - Per-turn reinforcement (model drifts without it post-compression)
 *   - Fail-silent (hook must never block session start)
 *
 * Designed to be invoked from .claude/settings.json hooks section.
 * Exit 0 = allow/continue. Exit 2 = block with stderr message.
 */

import { constants, openSync, readSync, writeSync, closeSync, readFileSync, writeFileSync, existsSync, mkdirSync, lstatSync, renameSync, unlinkSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RUNTIME_DIR = join(__dirname, '..', '.runtime');
const MODE_FILE = join(RUNTIME_DIR, 'current-mode.json');
const MAX_MODE_BYTES = 4096; // JSON config, not a tiny flag — enough for the struct

const VALID_MODES = ['wf-max', 'wf-review', null];
const VALID_ROLES = ['ceo', null];
const VALID_PHASES = ['W0_EXPLORE', 'W1_ARCHITECTURE', 'W2_IMPLEMENT', 'W2R_REVIEW', 'W3_DEPENDENT', 'INTEGRATION', 'CLOSEOUT', 'REVIEW', null];
const BLOCKED_TOOLS = ['Edit', 'Write', 'MultiEdit', 'Bash'];
const MAX_TASKID_BYTES = 128; // Sanitize user-controlled strings injected into context

// ── Symlink-safe I/O (from caveman: O_NOFOLLOW + atomic write + whitelist) ──

// Resolve and verify path stays within the project's Harness directory.
// Rejects symlinks at EVERY path component (not just the final file).
function safeResolveHarnessPath(filePath) {
  try {
    // Walk each component, resolving symlinks at every level
    const parts = filePath.replace(/\\/g, '/').split('/').filter(Boolean);
    let resolved = '';
    for (const part of parts) {
      if (part === '..') return null; // Reject traversal
      resolved = resolved ? join(resolved, part) : (resolved || part);
      try {
        const st = lstatSync(resolved);
        if (st.isSymbolicLink()) return null; // Symlink at any component = reject
      } catch (e) {
        if (e.code === 'ENOENT' && part !== parts[parts.length - 1]) return null;
      }
    }
    // Final component must be under Harness/ directory
    const normalized = resolved.replace(/\\/g, '/');
    if (!normalized.includes('Harness/')) return null;
    return resolved;
  } catch {
    return null;
  }
}

function safeReadJSON(filePath, maxBytes = MAX_MODE_BYTES) {
  try {
    const safe = safeResolveHarnessPath(filePath);
    if (!safe) return null;

    const st = lstatSync(safe);
    if (!st.isFile()) return null;
    if (st.size > maxBytes) return null;

    const O_NOFOLLOW = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
    let fd;
    try {
      fd = openSync(safe, constants.O_RDONLY | O_NOFOLLOW);
      const buf = Buffer.alloc(maxBytes);
      const n = readSync(fd, buf, 0, maxBytes, 0);
      const raw = buf.slice(0, n).toString('utf8').trim();
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Full whitelist validation — everything that touches LLM context must be validated
      if (!VALID_MODES.includes(parsed.mode)) return null;
      if (!VALID_ROLES.includes(parsed.role)) return null;
      if (parsed.active !== undefined && typeof parsed.active !== 'boolean') return null;
      if (parsed.phase !== undefined && !VALID_PHASES.includes(parsed.phase)) return null;
      if (parsed.explicitInvocation !== undefined && typeof parsed.explicitInvocation !== 'boolean') return null;
      // Sanitize free-text fields injected into context
      if (parsed.taskId && typeof parsed.taskId === 'string') {
        parsed.taskId = parsed.taskId.replace(/[^\w-]/g, '').slice(0, MAX_TASKID_BYTES);
        if (!parsed.taskId) parsed.taskId = 'current';
      }
      return parsed;
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
  } catch {
    return null;
  }
}

function safeWriteJSON(filePath, obj) {
  try {
    mkdirSync(dirname(filePath), { recursive: true });

    // Refuse if target is a symlink
    try {
      if (lstatSync(filePath).isSymbolicLink()) return;
    } catch (e) {
      if (e.code !== 'ENOENT') return;
    }

    // Atomic write: temp file + rename (from caveman)
    const tmp = join(dirname(filePath),
      `.${basename(filePath)}.${process.pid}.${randomBytes(4).toString('hex')}.tmp`);
    const O_NOFOLLOW = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0;
    let fd;
    try {
      fd = openSync(tmp, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL | O_NOFOLLOW, 0o600);
      const content = JSON.stringify(obj, null, 2) + '\n';
      writeSync(fd, content);
    } finally {
      if (fd !== undefined) closeSync(fd);
    }
    renameSync(tmp, filePath);
  } catch {
    // Silent-fail — mode state is best-effort
  }
}

// ── Validation helpers ────────────────────────────────────────────────────

function normalizePath(filePath) {
  // Resolve, normalize separators, reject traversal
  try {
    const resolved = join('/', filePath).replace(/\\/g, '/');
    if (resolved.includes('..')) return null; // Reject traversal
    return resolved;
  } catch { return null; }
}

function isTaskFile(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) return false;
  // Must start with /Harness/tasks/ (after join above), end with allowed file
  return /^\/Harness\/tasks\/[^/]+\/(PLAN|PROGRESS|ARTIFACTS|NOTES)\.md$/.test(normalized);
}

function isHarnessMeta(filePath) {
  const normalized = normalizePath(filePath);
  if (!normalized) return false;
  return /^\/Harness\/(memory\/|MEMORY\.md$|PROGRESS\.md$|\.runtime\/)/.test(normalized);
}

// ── stdin ─────────────────────────────────────────────────────────────────

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString().trim();
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}

// ── event handlers ────────────────────────────────────────────────────────

function handleSessionStart() {
  let mode;
  try { mode = safeReadJSON(MODE_FILE); } catch { /* silent-fail */ }

  if (!mode?.active) return;

  if (mode.mode === 'wf-max') {
    // Plain-text stdout → injected as hidden system context (same format as caveman)
    process.stdout.write([
      'WF-MAX MODE ACTIVE — You are CEO, not implementer.',
      `Task: ${mode.taskId || 'current'} | Phase: ${mode.phase || 'W0_EXPLORE'}`,
      '',
      'CEO RULES:',
      '1. Spawn read-only subagents in ONE message for exploration',
      '2. NEVER Edit/Write/MultiEdit source files — delegate to Workers via Agent tool',
      '3. Bash: only ls/dir/tree/git status/git diff, and harness scripts',
      '4. PLAN.md and PROGRESS.md writes are your ONLY write exceptions',
      '5. Any temptation to Read/Edit a source file → STOP. Spawn a Worker.',
    ].join('\n'));
  } else if (mode.mode === 'wf-review') {
    process.stdout.write([
      'WF-REVIEW MODE ACTIVE — Cross-model peer review.',
      'Use Bash to invoke the OTHER CLI (codex/claude). NEVER self-review.',
      'Your role: prepare context, invoke peer, synthesize findings.',
    ].join('\n'));
  }
}

function handleUserPromptSubmit(event) {
  // ── Mode activation detection ──
  try {
    const prompt = (event.prompt || event.input || '').toString();
    const lower = prompt.toLowerCase();

    if (lower.includes('/wf-max') || lower.match(/\bwf\s+max\b/)) {
      safeWriteJSON(MODE_FILE, {
        active: true,
        mode: 'wf-max',
        role: 'ceo',
        taskId: 'wf-max-current-task',
        phase: 'W0_EXPLORE',
        explicitInvocation: true,
        startedAt: new Date().toISOString(),
      });
    } else if (lower.includes('/wf-review') || lower.match(/\bwf\s+review\b/)) {
      safeWriteJSON(MODE_FILE, {
        active: true,
        mode: 'wf-review',
        role: 'ceo',
        taskId: 'wf-review-current',
        phase: 'REVIEW',
        explicitInvocation: true,
        startedAt: new Date().toISOString(),
      });
    }
  } catch { /* silent-fail */ }

  // ── Per-turn reinforcement (from caveman: prevents drift after compression) ──
  try {
    const mode = safeReadJSON(MODE_FILE);
    if (!mode?.active || mode.role !== 'ceo') return;

    if (mode.mode === 'wf-max') {
      // hookSpecificOutput = the standard Claude Code per-turn injection format
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: [
            'WF-MAX ACTIVE — You are CEO (' + (mode.phase || 'W0_EXPLORE') + ').',
            'Spawn Workers. NEVER Edit/Write/MultiEdit source files.',
            'Bash only: ls/dir/tree/git. PLAN.md/PROGRESS.md writes allowed.',
          ].join(' '),
        },
      }));
    } else if (mode.mode === 'wf-review') {
      process.stdout.write(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: 'WF-REVIEW ACTIVE. Use Bash to invoke the OTHER CLI. NEVER self-review.',
        },
      }));
    }
  } catch { /* silent-fail — never let per-turn reinforcement block the prompt */ }
}

function handlePreToolUse(event) {
  let mode;
  try { mode = safeReadJSON(MODE_FILE); } catch { /* silent-fail — allow */ }
  if (!mode?.active || mode.role !== 'ceo') return;

  const toolName = event.tool_name || event.tool || '';
  if (!BLOCKED_TOOLS.includes(toolName)) return;

  const input = event.tool_input || event.input || {};
  const filePath = input.file_path || '';
  const command = input.command || '';

  // ── Bash exceptions for CEO ──
  if (toolName === 'Bash') {
    const trimmed = command.trim();
    // Reject newlines/control chars — can't reliably defend against multi-line injection
    if (/[\r\n\0]/.test(trimmed)) {
      process.stderr.write('[CEO BLOCK] Bash command contains newlines or control characters.\n');
      process.exit(2);
    }
    // Reject shell metacharacters that could chain commands or redirect output
    if (/[;&|>`$]/.test(trimmed)) {
      process.stderr.write('[CEO BLOCK] Bash command contains shell metacharacters. Use a Worker.\n');
      process.exit(2);
    }
    // Anchored exact-command allowlist — no flexible git subcommands beyond safe ones
    const allowed = /^(ls|dir|tree|git\s+status|git\s+diff|git\s+log|git\s+branch|node\s+Harness\/scripts\/[a-z0-9_.-]+\.mjs|which|echo|type|codex|claude)(\s+[^;&|>`$]*)?$/;
    if (allowed.test(trimmed)) return; // allow
  }

  // ── Write exceptions ──
  if (filePath) {
    if (isTaskFile(filePath) || isHarnessMeta(filePath)) return; // allow
  }

  // ── Block ──
  const blockMsg = mode.mode === 'wf-max'
    ? `[WF-MAX CEO BLOCK] ${toolName} on source files is forbidden for CEO. Delegate to a Worker via Agent tool. File: ${filePath || command}`
    : `[WF-REVIEW BLOCK] ${toolName} is forbidden during peer review. Use Bash to invoke the other CLI for review.`;

  process.stderr.write(blockMsg + '\n');
  process.exit(2);
}

// ── main ───────────────────────────────────────────────────────────────────

const event = await readStdin();
const eventType = event.hook_event_name || event.event || event.type || '';

switch (eventType) {
  case 'SessionStart':
    handleSessionStart();
    break;
  case 'UserPromptSubmit':
    handleUserPromptSubmit(event);
    break;
  case 'PreToolUse':
    handlePreToolUse(event);
    break;
  default:
    // Unknown event — safe no-op
    break;
}

process.exit(0);
