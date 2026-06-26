#!/usr/bin/env node
/**
 * scan-clean.mjs — Dead file scanner & cleaner for the Harness framework update pipeline.
 *
 * Runs AFTER a successful wf-update to find and remove dead files — files that were
 * tracked in the previous harness version but removed from the new remote template.
 *
 * Also detects orphan files: files physically on disk in framework-managed directories
 * that are not tracked by either local or remote checksums.
 *
 * Usage:
 *   node Harness/scripts/scan-clean.mjs                  # report mode: show what WOULD be cleaned
 *   node Harness/scripts/scan-clean.mjs --clean          # delete DEAD files (prompts for confirmation)
 *   node Harness/scripts/scan-clean.mjs --clean --yes    # delete without confirmation prompt
 *   node Harness/scripts/scan-clean.mjs --json           # machine-readable JSON output
 */

import { readFileSync, writeFileSync, existsSync, lstatSync, readdirSync, unlinkSync, rmdirSync } from 'fs';
import { resolve, dirname, sep, join } from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.WF_ROOT ? resolve(process.env.WF_ROOT) : resolve(__dirname, '..', '..');
const VERSION_FILE = resolve(ROOT, 'Harness', '.harness-version');
const SOURCE_BASE = 'https://raw.githubusercontent.com/zingspark/create-harness-vibe-coding/main/templates/common/';

// ── Classification constants ────────────────────────────────────────

/** Files we NEVER delete, even if dead. */
const PRESERVE_PATTERNS = [
  /^Harness\/PROGRESS\.md$/,
  /^Harness\/tasks\//,
  /^Harness\/memory\//,
  /^Harness\/research\/PRD\.md$/,
  /^Harness\/research\/research-results\.md$/,
  /^Harness\/architecture\.md$/,
  /^README\.md$/,
  /^\.gitignore$/,
  /^package\.json$/,
  /^package-lock\.json$/,
];

/** Directories scanned for orphan files (untracked by either checksum set). */
const FRAMEWORK_DIRS = [
  '.claude/agents',
  '.claude/skills',
  '.claude/commands',
  '.claude/rules',
  'Harness/scripts',
  'Harness/workflows',
];

// ── Helpers ──────────────────────────────────────────────────────────

/** Reject paths that escape ROOT (traversal, absolute, .., etc.). */
function safePath(file) {
  let normalized = file.replace(/\\/g, '/').replace(/^\/+/, '');
  if (/\/\//.test(normalized)) return null;
  if (normalized.split('/').some(p => p === '..')) return null;
  if (file.startsWith('/') || file.startsWith('\\')) return null;
  if (normalized === '.' || normalized === '') return null;
  const resolved = resolve(ROOT, normalized);
  if (!resolved.startsWith(ROOT + sep) && resolved !== ROOT) return null;
  return resolved;
}

/** Canonical normalization for classification matching. */
function canonicalPath(file) {
  return file.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/** Check whether a canonical path matches any PRESERVE pattern. */
function isPreserved(canonical) {
  for (const p of PRESERVE_PATTERNS) {
    if (p.test(canonical)) return true;
  }
  return false;
}

/** Detect template placeholders in remote content. */
function isTemplate(raw) {
  return /\{\{[a-zA-Z]+\}\}/.test(raw);
}

async function fetchRemote(url, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
    return res.text();
  } finally {
    clearTimeout(timer);
  }
}

// ── Orphan detection ─────────────────────────────────────────────────

/**
 * Recursively list all files under a directory, returning canonical paths
 * relative to ROOT. Skips symlinks and directories that don't exist.
 */
function listFilesRecursive(relDir) {
  const absDir = resolve(ROOT, relDir);
  if (!existsSync(absDir)) return [];
  const results = [];
  try {
    const entries = readdirSync(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const absPath = join(absDir, entry.name);
      const relPath = canonicalPath(join(relDir, entry.name));
      try {
        if (lstatSync(absPath).isSymbolicLink()) continue;
      } catch (_) { continue; }
      if (entry.isFile()) {
        results.push(relPath);
      } else if (entry.isDirectory()) {
        results.push(...listFilesRecursive(relPath));
      }
    }
  } catch (_) { /* permission errors etc. — skip */ }
  return results;
}

/**
 * Find orphan files: files physically in FRAMEWORK_DIRS that are not
 * tracked by local or remote checksums AND do not match PRESERVE patterns.
 */
function findOrphanFiles(localChecksums, remoteChecksums) {
  const allTracked = new Set([...Object.keys(localChecksums), ...Object.keys(remoteChecksums)]);
  const orphans = [];

  for (const dir of FRAMEWORK_DIRS) {
    const diskFiles = listFilesRecursive(dir);
    for (const file of diskFiles) {
      if (allTracked.has(file)) continue;
      if (isPreserved(file)) continue;
      orphans.push({ file, reason: 'untracked in framework directory' });
    }
  }

  return orphans;
}

// ── Empty directory detection ────────────────────────────────────────

/**
 * Given a set of file paths that will be removed, find directories that
 * would become empty. Returns canonical paths of empty directories.
 */
function findEmptyDirs(filesToRemove) {
  const removeSet = new Set(filesToRemove.map(canonicalPath));
  // Collect all unique directories touched by the files to remove
  const dirSet = new Set();
  for (const file of removeSet) {
    let dir = dirname(file);
    while (dir !== '.' && dir !== '/') {
      dirSet.add(dir);
      dir = dirname(dir);
    }
  }

  const emptyDirs = [];
  for (const dir of dirSet) {
    const absDir = resolve(ROOT, dir);
    if (!existsSync(absDir)) continue;
    // Gather all files recursively under this directory
    const allFiles = listFilesRecursive(dir);
    // If every file in this tree is slated for removal, the dir becomes empty
    if (allFiles.length > 0 && allFiles.every(f => removeSet.has(f))) {
      emptyDirs.push(dir);
    }
  }

  // Return sorted, removing children whose parents are also empty
  // (only report the highest-level empty dirs)
  const result = [];
  for (const dir of emptyDirs.sort()) {
    // Skip if any parent is already in the result
    if (result.some(p => dir.startsWith(p + '/'))) continue;
    result.push(dir);
  }

  return result;
}

// ── Clean helpers ────────────────────────────────────────────────────

/**
 * Remove empty parent directories, walking up from the given file path.
 * Stops when a directory is non-empty or we reach ROOT.
 */
function removeEmptyParents(fileAbsPath) {
  let dir = dirname(fileAbsPath);
  const removed = [];

  while (dir !== ROOT && dir.startsWith(ROOT + sep)) {
    if (!existsSync(dir)) break;
    try {
      const entries = readdirSync(dir);
      if (entries.length === 0) {
        rmdirSync(dir);
        removed.push(dir);
        dir = dirname(dir);
      } else {
        break;
      }
    } catch (_) { break; }
  }

  return removed;
}

// ── Main ─────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const clean = args.includes('--clean');
  const yes = args.includes('--yes');
  const jsonOut = args.includes('--json');

  // 1. Read local state
  if (!existsSync(VERSION_FILE)) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Local .harness-version not found.' }));
    } else {
      console.error('ERROR: Harness/.harness-version not found. Nothing to scan.');
    }
    process.exit(1);
  }

  let localVersion;
  try {
    localVersion = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'));
  } catch (e) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Failed to parse local .harness-version: ' + e.message }));
    } else {
      console.error('ERROR: Failed to parse Harness/.harness-version:', e.message);
    }
    process.exit(1);
  }

  const localChecksums = localVersion.checksums || {};

  // 2. Fetch remote version file
  let remoteVersion;
  try {
    const raw = await fetchRemote(SOURCE_BASE + '.harness-version');
    if (isTemplate(raw)) {
      if (jsonOut) {
        console.log(JSON.stringify({ status: 'error', message: 'Remote .harness-version is a template (contains {{placeholders}}). Cannot determine dead files.' }));
      } else {
        console.error('ERROR: Remote .harness-version is a template (contains placeholders).');
        console.error('  Cannot determine what files have been removed from the template.');
        console.error('  Re-run after the remote template is generated.');
      }
      process.exit(1);
    }
    remoteVersion = JSON.parse(raw);
  } catch (e) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Cannot reach GitHub or invalid remote JSON: ' + e.message }));
    } else {
      console.error('ERROR: Cannot reach GitHub or invalid remote JSON. Offline?');
      console.error(e.message);
    }
    process.exit(1);
  }

  const remoteChecksums = remoteVersion.checksums || {};

  // 3. Classify dead files
  // DEAD = in local checksums but NOT in remote checksums, AND NOT preserved
  const deadFiles = [];
  for (const file of Object.keys(localChecksums)) {
    const canonical = canonicalPath(file);
    if (remoteChecksums[file]) continue; // still in remote, not dead
    if (isPreserved(canonical)) continue; // user data, never dead
    deadFiles.push({ file, reason: 'not in remote template' });
  }

  // 4. Find orphan files
  const orphanFiles = findOrphanFiles(localChecksums, remoteChecksums);

  // 5. Find empty dirs (predictive — what WOULD become empty)
  const deadPaths = deadFiles.map(d => canonicalPath(d.file));
  const emptyDirs = findEmptyDirs(deadPaths);

  // 6. Output
  if (jsonOut) {
    const status = deadFiles.length > 0 || orphanFiles.length > 0 ? 'dead-found' : 'clean';
    console.log(JSON.stringify({
      status,
      dead: deadFiles,
      orphan: orphanFiles,
      emptyDirs,
      summary: {
        dead: deadFiles.length,
        orphan: orphanFiles.length,
        emptyDirs: emptyDirs.length,
      },
    }, null, 2));
    return;
  }

  // ── Report mode ──────────────────────────────────────────────────

  if (!clean) {
    if (deadFiles.length === 0 && orphanFiles.length === 0) {
      console.log('✅ Harness is clean — no dead files detected.');
      return;
    }

    if (deadFiles.length > 0) {
      console.log('DEAD FILES (safe to delete — tracked locally but not in remote template):');
      for (const d of deadFiles) {
        const onDisk = existsSync(safePath(d.file));
        const marker = onDisk ? '' : ' [already deleted on disk]';
        console.log(`  ${d.file}${marker}`);
      }
      console.log('');
    }

    if (orphanFiles.length > 0) {
      console.log('ORPHAN FILES (review needed — untracked in framework directories):');
      for (const o of orphanFiles) {
        console.log(`  ${o.file}`);
      }
      console.log('');
    }

    if (emptyDirs.length > 0) {
      console.log('EMPTY DIRS (would become empty after cleaning):');
      for (const d of emptyDirs) {
        console.log(`  ${d}/`);
      }
      console.log('');
    }

    console.log(`Summary: ${deadFiles.length} dead, ${orphanFiles.length} orphan, ${emptyDirs.length} empty dirs.`);
    if (deadFiles.length > 0) {
      console.log('Run with --clean to delete dead files.');
    }
    return;
  }

  // ── Clean mode ───────────────────────────────────────────────────

  if (deadFiles.length === 0) {
    console.log('✅ Harness is clean — no dead files to delete.');
    return;
  }

  // Show what will be deleted
  console.log(`Will delete ${deadFiles.length} dead file(s):`);
  for (const d of deadFiles) {
    console.log(`  ${d.file}`);
  }
  console.log('');

  // Confirmation prompt (skip if --yes)
  if (!yes) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise(resolve => {
      rl.question(`Delete ${deadFiles.length} dead files? [y/N]: `, ans => {
        rl.close();
        resolve(ans.trim().toLowerCase());
      });
    });
    if (answer !== 'y' && answer !== 'yes') {
      console.log('Aborted.');
      return;
    }
    console.log('');
  }

  // Delete dead files
  let deletedCount = 0;
  let failedCount = 0;

  for (const d of deadFiles) {
    const diskPath = safePath(d.file);
    if (!diskPath) {
      if (!jsonOut) console.error(`  ✗ Traversal rejected: ${d.file}`);
      failedCount++;
      continue;
    }

    // Re-verify PRESERVE before deletion (defense in depth)
    if (isPreserved(canonicalPath(d.file))) {
      if (!jsonOut) console.error(`  ✗ PRESERVE override — skipped: ${d.file}`);
      failedCount++;
      continue;
    }

    // If file doesn't exist on disk, just clean the checksum entry
    if (!existsSync(diskPath)) {
      delete localChecksums[d.file];
      deletedCount++;
      continue;
    }

    // Symlink rejection
    try {
      if (lstatSync(diskPath).isSymbolicLink()) {
        if (!jsonOut) console.error(`  ✗ Symlink rejected: ${d.file}`);
        failedCount++;
        continue;
      }
    } catch (_) {
      if (!jsonOut) console.error(`  ✗ Cannot stat: ${d.file}`);
      failedCount++;
      continue;
    }

    // Delete the file
    try {
      unlinkSync(diskPath);
      delete localChecksums[d.file];
      deletedCount++;
    } catch (e) {
      if (!jsonOut) console.error(`  ✗ Failed to delete: ${d.file} — ${e.message}`);
      failedCount++;
    }
  }

  // Remove empty parent directories
  let emptyRemoved = 0;
  for (const d of deadFiles) {
    const diskPath = safePath(d.file);
    if (!diskPath) continue;
    const parentDir = dirname(diskPath);
    if (existsSync(parentDir)) {
      const removed = removeEmptyParents(parentDir);
      emptyRemoved += removed.length;
    }
  }

  // Write updated checksums
  try {
    writeFileSync(VERSION_FILE, JSON.stringify(localVersion, null, 2) + '\n', 'utf-8');
  } catch (e) {
    console.error(`  ✗ Failed to update .harness-version: ${e.message}`);
  }

  // Summary
  if (failedCount > 0) {
    console.log(`\n⚠ Cleaned ${deletedCount} files, removed ${emptyRemoved} empty directories. ${failedCount} failed (see above).`);
  } else {
    console.log(`\n✅ Cleaned ${deletedCount} files, removed ${emptyRemoved} empty directories.`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
