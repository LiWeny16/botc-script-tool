#!/usr/bin/env node
/**
 * wf-remove.mjs — Safely remove Harness framework files.
 *
 * Classifies all Harness-owned files into:
 *   SAFE     — framework files matching stored checksums → auto-remove
 *   MODIFIED — framework files edited by user → MUST confirm
 *   USER     — user data files → NEVER remove
 *
 * Usage:
 *   node Harness/scripts/wf-remove.mjs                    # dry-run: show plan
 *   node Harness/scripts/wf-remove.mjs --apply            # apply SAFE, prompt for MODIFIED
 *   node Harness/scripts/wf-remove.mjs --yes              # auto-yes for SAFE only (non-interactive)
 *   node Harness/scripts/wf-remove.mjs --json             # JSON plan for AI consumption
 *   node Harness/scripts/wf-remove.mjs --apply --yes      # auto-apply SAFE, skip MODIFIED, report
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, rmdirSync, readdirSync, lstatSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, dirname, join, sep } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.WF_ROOT
  ? resolve(process.env.WF_ROOT)
  : (existsSync(resolve(process.cwd(), 'Harness', '.harness-version'))
    ? process.cwd()
    : resolve(__dirname, '..', '..'));
const VERSION_FILE = resolve(ROOT, 'Harness', '.harness-version');

// ── Classification ─────────────────────────────────────────────────

/** Path prefixes that Harness framework is allowed to own. ANY file outside these is NEVER removed. */
const HARNESS_PREFIXES = [
  '.claude/',
  'Harness/',
  'CLAUDE.md',
  'AGENTS.md',
  'MEMORY.md',
  'tests/.gitkeep',
];

/** Files the user owns — NEVER remove. Consistent with wf-update-check PRESERVE_PATTERNS. */
const USER_DATA_PATTERNS = [
  /^Harness\/PROGRESS\.md$/,
  /^Harness\/tasks\//,
  /^Harness\/memory\//,
  /^Harness\/research\/PRD\.md$/,
  /^Harness\/research\/research-results\.md$/,
  /^Harness\/architecture\.md$/,
  /^Harness\/workflows\//,
  /^Harness\/features\//,
  /^Harness\/domain\//,
  /^README\.md$/,
  /^\.gitignore$/,
  /^package\.json$/,
  /^package-lock\.json$/,
];

function isUserData(file) {
  return USER_DATA_PATTERNS.some(p => p.test(file));
}

function isHarnessOwned(file) {
  return HARNESS_PREFIXES.some(p => file.startsWith(p));
}

/** Framework files that should always exist (not part of removal). */
const KEEP_FRAMEWORK = new Set([
  'Harness/.harness-version',
]);

/** Directories to clean up if empty after file removal. */
const CLEANUP_DIRS = [
  '.claude/agents',
  '.claude/skills/wf-auto',
  '.claude/skills/wf-browser',
  '.claude/skills/wf-learn',
  '.claude/skills/wf-max',
  '.claude/skills/wf-readme',
  '.claude/skills/wf-review',
  '.claude/skills/wf-update',
  '.claude/skills/wf-remove',
  '.claude/skills/subagent-orchestrator',
  '.claude/commands',
  '.claude/rules/ecc',
  '.claude/rules',
  'Harness/scripts',
  'Harness/research',
  'Harness/workflows',
  'Harness/domain',
  'Harness/features',
  'Harness/memory',
  'Harness/tasks/_template',
  'Harness/tasks/auto',
  'Harness/tasks',
  'Harness',
];

// ── Helpers ────────────────────────────────────────────────────────

/** Reject paths that escape ROOT (traversal, absolute, .., etc.). Sync with wf-update-check. */
function safePath(file) {
  let normalized = file.replace(/\\/g, '/').replace(/^\/+/, '');
  if (normalized.includes('//')) return null;  // double slash bypass
  if (normalized.split('/').some(p => p === '..')) return null;
  if (file.startsWith('/') || file.startsWith('\\')) return null;
  if (normalized === '.' || normalized === '') return null;
  const resolved = resolve(ROOT, normalized);
  if (!resolved.startsWith(ROOT + sep) && resolved !== ROOT) return null;
  return resolved;
}

function sha256File(path) {
  if (!existsSync(path)) return null;
  let content = readFileSync(path, 'utf-8');
  content = content.replace(/\r\n/g, '\n');
  return 'sha256-' + createHash('sha256').update(content).digest('hex');
}

function removeEmptyDirs(startDir) {
  if (!existsSync(startDir)) return;
  try {
    const entries = readdirSync(startDir);
    for (const e of entries) {
      const full = join(startDir, e);
      if (lstatSync(full).isDirectory() && !lstatSync(full).isSymbolicLink()) removeEmptyDirs(full);
    }
    // After recursing, check if dir is now empty
    const remaining = readdirSync(startDir);
    if (remaining.length === 0) {
      rmdirSync(startDir);
    }
  } catch (_) { /* permissions or already gone */ }
}

async function askUser(question) {
  if (!process.stdin.isTTY) {
    console.log('   (non-interactive — defaulting to KEEP)');
    return 'k';
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question, answer => { rl.close(); resolve(answer.trim().toLowerCase()); });
  });
}

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const yes = args.includes('--yes');
  const jsonOut = args.includes('--json');

  // 1. Build file inventory
  const localVersion = existsSync(VERSION_FILE)
    ? JSON.parse(readFileSync(VERSION_FILE, 'utf-8'))
    : { checksums: {} };
  const storedChecksums = localVersion.checksums || {};

  // All files from checksums + known framework patterns
  const allFiles = new Set(Object.keys(storedChecksums));

  // Add framework files that might not be in checksums (newer additions)
  const extraPatterns = [
    '.claude/skills/wf-auto/SKILL.md',
    '.claude/commands/wf-auto.md',
    '.claude/commands/wf-auto-spark.md',
    'Harness/WF-AUTO.md',
    'Harness/tasks/auto/PROGRESS.md',
    'Harness/tasks/auto/PLAN.md',
    'Harness/scripts/wf-update-check.mjs',
    'Harness/scripts/wf-remove.mjs',
  ];
  for (const f of extraPatterns) {
    if (existsSync(resolve(ROOT, f))) allFiles.add(f);
  }

  // 2. Classify every file
  const safe = [];     // SAFE — matches checksum, auto-remove
  const modified = []; // MODIFIED — user edited, must confirm
  const user = [];     // USER — never remove
  const skipped = [];  // File not on disk, traversal rejected, or framework-keep

  for (const file of [...allFiles].sort()) {
    // Canonical normalization for classification
    const canonical = file.replace(/\\/g, '/').replace(/\/+/g, '/');

    if (KEEP_FRAMEWORK.has(canonical)) {
      skipped.push({ file, reason: 'framework keep' });
      continue;
    }

    if (isUserData(canonical)) {
      user.push({ file, reason: 'user data — NEVER removed' });
      continue;
    }

    // Only allow deletion of files under harness-owned prefixes
    if (!isHarnessOwned(canonical)) {
      user.push({ file, reason: 'outside harness prefix — NEVER removed' });
      continue;
    }

    const diskPath = safePath(file);
    if (!diskPath) {
      skipped.push({ file, reason: 'path traversal rejected' });
      continue;
    }
    if (!existsSync(diskPath)) {
      skipped.push({ file, reason: 'not on disk' });
      continue;
    }

    const currentHash = sha256File(diskPath);
    const storedHash = storedChecksums[file];

    if (!storedHash) {
      modified.push({ file, currentHash, storedHash: 'none', reason: 'not in checksums' });
    } else if (currentHash === storedHash) {
      safe.push({ file, currentHash, storedHash });
    } else {
      modified.push({ file, currentHash, storedHash, reason: 'user modified' });
    }
  }

  // Also check for .claude/settings.json (might have user hooks)
  const settingsFile = resolve(ROOT, '.claude', 'settings.json');
  if (existsSync(settingsFile)) {
    const settingsHash = sha256File(settingsFile);
    const storedSettingsHash = storedChecksums['.claude/settings.json'];
    if (storedSettingsHash && settingsHash !== storedSettingsHash) {
      // User modified settings — move to modified
      // Remove from safe if it was there
      const idx = safe.findIndex(s => s.file === '.claude/settings.json');
      if (idx >= 0) {
        safe.splice(idx, 1);
        modified.push({ file: '.claude/settings.json', currentHash: settingsHash, storedHash: storedSettingsHash, reason: 'user modified settings (may contain hooks/permissions)' });
      }
    }
  }

  // 3. Output plan
  if (jsonOut) {
    console.log(JSON.stringify({
      safe: safe.map(s => s.file),
      modified: modified.map(m => m.file),
      user: user.map(u => u.file),
      totalRemove: safe.length + modified.length,
      totalSafe: safe.length,
      totalModified: modified.length,
    }, null, 2));
    return;
  }

  console.log('\n🧹 WF-REMOVE — Harness framework removal plan\n');

  if (safe.length > 0) {
    console.log(`✅ SAFE (${safe.length} files — auto-remove, unmodified framework):`);
    for (const s of safe) console.log(`   ✕ ${s.file}`);
    console.log('');
  }

  if (modified.length > 0) {
    console.log(`⚠ MODIFIED (${modified.length} files — REQUIRE CONFIRMATION):`);
    for (const m of modified) {
      console.log(`   ? ${m.file}  [${m.reason}]`);
    }
    console.log('');
  }

  if (user.length > 0) {
    console.log(`🔒 USER DATA (${user.length} files — NEVER removed):`);
    for (const u of user) console.log(`   ○ ${u.file}  [${u.reason}]`);
    console.log('');
  }

  console.log(`Summary: ${safe.length} safe, ${modified.length} need confirm, ${user.length} preserved, ${skipped.length} skipped\n`);

  if (!apply) {
    console.log('DRY-RUN. Use --apply to execute the removal.\n');
    return;
  }

  // 4. Apply — remove SAFE files automatically (rehash before unlink)
  let safeRemoved = 0;
  for (const s of safe) {
    const diskPath = safePath(s.file);
    if (!diskPath) { console.error(`   ✗ Traversal rejected: ${s.file}`); continue; }
    // Re-verify hash hasn't changed since classification
    const currentHash = sha256File(diskPath);
    if (currentHash !== s.storedHash) {
      console.log(`   ⊘ Skipped (modified since classification): ${s.file}`);
      continue;
    }
    try {
      unlinkSync(diskPath);
      safeRemoved++;
    } catch (e) {
      console.error(`   ✗ Failed to remove: ${s.file} — ${e.message}`);
    }
  }
  console.log(`✓ Removed ${safeRemoved} safe files.`);

  // 5. Handle MODIFIED files — prompt user
  let modifiedRemoved = 0;
  let modifiedKept = 0;

  for (const m of modified) {
    if (yes) {
      // Non-interactive mode: skip all modified
      console.log(`   ⊘ Skipped (modified): ${m.file}`);
      modifiedKept++;
      continue;
    }

    console.log(`\n─── ${m.file} ───`);
    console.log(`   Reason: ${m.reason}`);
    console.log(`   [D]elete  [K]eep (default)`);

    const answer = await askUser('   Choose [d/k]: ');
    if (answer === 'd' || answer === 'delete') {
      const diskPath = safePath(m.file);
      if (!diskPath) { console.error(`   ✗ Traversal rejected: ${m.file}`); continue; }
      try {
        unlinkSync(diskPath);
        console.log(`   ✓ Deleted: ${m.file}`);
        modifiedRemoved++;
      } catch (e) {
        console.error(`   ✗ Failed: ${m.file} — ${e.message}`);
      }
    } else {
      console.log(`   ⊘ Kept: ${m.file}`);
      modifiedKept++;
    }
  }

  // 6. Cleanup empty directories
  for (const dir of CLEANUP_DIRS) {
    removeEmptyDirs(resolve(ROOT, dir));
  }
  // Remove root Harness/ if empty
  removeEmptyDirs(resolve(ROOT, 'Harness'));
  // Remove root .claude/ if empty (but this is rare)
  removeEmptyDirs(resolve(ROOT, '.claude'));

  // 7. Remove version file if everything is gone
  if (existsSync(VERSION_FILE)) {
    const harPath = resolve(ROOT, 'Harness');
    if (!existsSync(harPath) || (existsSync(harPath) && readdirSync(harPath).filter(f => f !== '.harness-version').length === 0)) {
      unlinkSync(VERSION_FILE);
      console.log('✓ Removed .harness-version (Harness directory empty).');
    }
  }

  // 7.5 Prune stale checksums for files that no longer exist on disk
  if (existsSync(VERSION_FILE)) {
    const versionData = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'));
    const checksums = versionData.checksums || {};
    let pruned = 0;
    for (const file of Object.keys(checksums)) {
      const diskPath = safePath(file);
      if (!diskPath || !existsSync(diskPath)) {
        delete checksums[file];
        pruned++;
      }
    }
    if (pruned > 0) {
      versionData.checksums = checksums;
      writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n', 'utf-8');
      console.log(`✓ Pruned ${pruned} stale checksum(s) from .harness-version.`);
    }
  }

  // 8. Remove CLAUDE.md harness section if it only has harness binding
  const claudePath = resolve(ROOT, 'CLAUDE.md');
  if (existsSync(claudePath)) {
    const content = readFileSync(claudePath, 'utf-8');
    if (content.includes('Harness contract') || content.includes('Harness Binding')) {
      const answer = yes ? 'k' : await askUser('\nCLAUDE.md contains Harness binding section. Remove it? [D]elete harness section / [K]eep as-is (default): ');
      if (answer === 'd' || answer === 'delete') {
        // Strip the harness section: everything from "## 1. Harness Binding" to the next "## "
        const cleaned = content.replace(/## 1\. Harness Binding[\s\S]*?(?=## 2\.)/, '');
        writeFileSync(claudePath, cleaned, 'utf-8');
        console.log('✓ Stripped Harness binding section from CLAUDE.md.');
      }
    }
  }

  console.log(`\n🏁 Done. Safe: ${safeRemoved} removed. Modified: ${modifiedRemoved} removed, ${modifiedKept} kept.`);
  console.log('   Run `git status` to review changes.\n');
}

main().catch(e => { console.error(e); process.exit(1); });
