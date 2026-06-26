#!/usr/bin/env node
/**
 * wf-update-check.mjs — Fast harness update comparison.
 * Fetches remote checksums, compares locally, classifies all files instantly.
 * Only CONFLICT files need AI/user decision.
 *
 * Usage:
 *   node Harness/scripts/wf-update-check.mjs          # full plan
 *   node Harness/scripts/wf-update-check.mjs --apply  # apply SAFE+MERGE+NEW, report CONFLICT
 *   node Harness/scripts/wf-update-check.mjs --json   # JSON output for AI consumption
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, lstatSync } from 'fs';
import { createHash } from 'crypto';
import { resolve, dirname, sep } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.WF_ROOT ? resolve(process.env.WF_ROOT) : resolve(__dirname, '..', '..');
const VERSION_FILE = resolve(ROOT, 'Harness', '.harness-version');
const SOURCE_BASE = 'https://raw.githubusercontent.com/zingspark/create-harness-vibe-coding/main/templates/common/';

// ── Tier classification ──────────────────────────────────────────

/** Files we NEVER overwrite or delete. */
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

/** Files that are safe to overwrite if checksums match, otherwise need merge. */
const MERGE_PATTERNS = [
  /^CLAUDE\.md$/,
  /^AGENTS\.md$/,
  /^MEMORY\.md$/,
  /^Harness\/MEMORY\.md$/,
  /^Harness\/README\.md$/,
];

// ── Helpers ────────────────────────────────────────────────────────

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

/** Detect template placeholders in remote content. */
function isTemplate(raw) {
  return /\{\{[a-zA-Z]+\}\}/.test(raw);
}

function sha256(content) {
  return 'sha256-' + createHash('sha256').update(content).digest('hex');
}

function sha256File(path) {
  if (!existsSync(path)) return null;
  let content = readFileSync(path, 'utf-8');
  // Normalize CRLF → LF
  content = content.replace(/\r\n/g, '\n');
  return sha256(content);
}

function classify(file, localHash, storedHash) {
  // PRESERVE
  for (const p of PRESERVE_PATTERNS) {
    if (p.test(file)) return 'PRESERVE';
  }
  // MERGE — dual-purpose, check if user modified
  for (const p of MERGE_PATTERNS) {
    if (p.test(file)) {
      if (localHash === storedHash) return 'SAFE'; // unmodified, safe
      return 'CONFLICT'; // user modified, needs decision
    }
  }
  // Everything else is SAFE runtime file
  if (localHash === storedHash || localHash === null) return 'SAFE';
  return 'CONFLICT'; // modified runtime file — unexpected
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

// ── Main ───────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const jsonOut = args.includes('--json');
  const ignoreVersion = args.includes('--ignore-version') || args.includes('--force-check');

  // 1. Read local state
  if (!existsSync(VERSION_FILE)) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Local Harness/.harness-version not found.' }));
    } else {
      console.error('ERROR: Harness/.harness-version not found. Is Harness installed?');
    }
    return;
  }

  let localVersion;
  try {
    localVersion = JSON.parse(readFileSync(VERSION_FILE, 'utf-8'));
  } catch (e) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Failed to parse Harness/.harness-version: ' + e.message }));
    } else {
      console.error('ERROR: Failed to parse Harness/.harness-version:', e.message);
      console.error('  The file may be corrupted. If this is an old project, try reinstalling the harness.');
    }
    return;
  }

  if (!localVersion || typeof localVersion !== 'object') {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'error', message: 'Invalid Harness/.harness-version structure.' }));
    } else {
      console.error('ERROR: Harness/.harness-version has unexpected structure.');
    }
    return;
  }

  const localChecksums = localVersion.checksums || {};

  // 2. Fetch remote version file
  let remoteVersion;
  try {
    const raw = await fetchRemote(SOURCE_BASE + '.harness-version');
    if (isTemplate(raw)) {
      if (jsonOut) {
        console.log(JSON.stringify({ status: 'template-remote', message: 'Remote .harness-version has not been generated yet.' }));
      } else {
        console.log('⚠ Remote .harness-version is a template (contains {{placeholders}}).');
        console.log('  The generate step has not been run on the remote repo. No update possible.');
        console.log('  This is expected during development — the update mechanism works once the remote is live.');
      }
      return;
    }
    remoteVersion = JSON.parse(raw);
  } catch (e) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'offline', message: 'Cannot reach GitHub.' }));
    } else {
      console.error('ERROR: Cannot reach GitHub or invalid JSON. Offline?');
      console.error(e.message);
    }
    return;
  }

  // Compare versions — warn if remote is older (downgrade prevention)
  function parseSemver(v) {
    if (!v || typeof v !== 'string') return [0, 0, 0];
    return v.replace(/^[^0-9]*/, '').split('-')[0].split('.').map(Number);
  }
  function cmpSemver(a, b) {
    const va = parseSemver(a), vb = parseSemver(b);
    for (let i = 0; i < 3; i++) { if ((va[i]||0) > (vb[i]||0)) return 1; if ((va[i]||0) < (vb[i]||0)) return -1; }
    return 0;
  }

  const localGen = localVersion.generator || '0.0.0';
  const remoteGen = remoteVersion.generator || '0.0.0';

  if (!ignoreVersion && cmpSemver(remoteGen, localGen) <= 0) {
    if (jsonOut) {
      console.log(JSON.stringify({ status: 'up-to-date', version: localGen, remote: remoteGen }));
    } else if (cmpSemver(remoteGen, localGen) < 0) {
      console.log(`⚠ Remote (v${remoteGen}) is OLDER than local (v${localGen}). Downgrade refused.`);
    } else {
      console.log(`✅ Already up to date (v${localGen})`);
    }
    return;
  }

  if (ignoreVersion) {
    if (!jsonOut) console.log('🔧 Version check bypassed (--ignore-version). Comparing files anyway.');
  }

  const remoteChecksums = remoteVersion.checksums || {};
  const remoteSources = remoteVersion.sources || {};

  /** Resolve the remote template-relative path for a dest-keyed file. Falls back to the key itself for back-compat. */
  function remotePath(file) {
    return remoteSources[file] || file;
  }

  const allFiles = new Set([...Object.keys(localChecksums), ...Object.keys(remoteChecksums)]);

  const plan = { updated: [], created: [], conflict: [], skipped: [] };

  for (const file of [...allFiles].sort()) {
    const canonical = canonicalPath(file);

    // Reject paths that escape ROOT before any file access
    const diskPath = safePath(file);
    if (!diskPath) {
      plan.skipped.push({ file, reason: 'path traversal rejected' });
      continue;
    }

    const localHash = sha256File(diskPath);
    const storedHash = localChecksums[file];
    const remoteHash = remoteChecksums[file];

    if (!remoteHash) {
      plan.skipped.push({ file, reason: 'not in remote' });
      continue;
    }

    if (!storedHash) {
      // New file from remote — if local file exists, it's a CONFLICT
      if (localHash) {
        plan.conflict.push({ file, localHash, storedHash: 'none', remoteHash, reason: 'new remote file conflicts with existing local file' });
        continue;
      }
      // New file — still respect PRESERVE classification
      const tier = classify(canonical, null, null);
      if (tier === 'PRESERVE') {
        plan.skipped.push({ file, reason: 'PRESERVE — new file would overwrite user data' });
      } else {
        plan.created.push({ file, remoteHash });
      }
      continue;
    }

    const tier = classify(canonical, localHash, storedHash);

    if (tier === 'PRESERVE') {
      plan.skipped.push({ file, reason: 'PRESERVE — user data' });
    } else if (tier === 'SAFE') {
      plan.updated.push({ file, remoteHash });
    } else if (tier === 'CONFLICT') {
      plan.conflict.push({
        file,
        localHash,
        storedHash,
        remoteHash,
        reason: MERGE_PATTERNS.some(p => p.test(canonical))
          ? 'user modified MERGE file'
          : 'user modified runtime file',
      });
    }
  }

  // 3. Output
  if (jsonOut) {
    console.log(JSON.stringify({
      status: 'update-available',
      from: localGen,
      to: remoteGen,
      updated: plan.updated.length,
      created: plan.created.length,
      conflict: plan.conflict.length,
      skipped: plan.skipped.length,
      plan,
    }, null, 2));
    return;
  }

  console.log(`\n🔄 Update: v${localGen} → v${remoteGen}`);
  console.log(`   ${plan.updated.length} safe update, ${plan.created.length} new, ${plan.conflict.length} conflict, ${plan.skipped.length} skipped\n`);

  // Show conflicts (these need AI/user decision)
  if (plan.conflict.length > 0) {
    console.log('⚠ CONFLICTS (need your decision):');
    for (const c of plan.conflict) {
      console.log(`   📄 ${c.file}  [${c.reason}]`);
    }
    console.log('');
  }

  // Show what will be auto-updated
  if (plan.updated.length + plan.created.length > 0) {
    console.log('✅ AUTO (safe to apply):');
    for (const u of plan.updated) console.log(`   ↑ ${u.file}`);
    for (const c of plan.created) console.log(`   + ${c.file}`);
    console.log('');
  }

  // 4. Apply if requested
  if (apply) {
    // Refuse to apply when conflicts exist — must resolve first
    if (plan.conflict.length > 0) {
      console.log(`❌ Cannot apply: ${plan.conflict.length} conflicts must be resolved first.`);
      console.log('   Resolve conflicts manually, then re-run --apply.');
      return plan;
    }

    const lexists = existsSync;
    let applied = 0;
    let failed = 0;

    for (const u of plan.updated) {
      try {
        const dest = safePath(u.file);
        if (!dest) { console.error(`   ✗ Traversal rejected: ${u.file}`); failed++; continue; }
        // Symlink rejection — don't follow symlinks
        if (lexists(dest)) {
          try { if (lstatSync(dest).isSymbolicLink()) { console.error(`   ✗ Symlink rejected: ${u.file}`); failed++; continue; } } catch (_) {}
        }
        const content = await fetchRemote(SOURCE_BASE + remotePath(u.file));
        const normalized = content.replace(/\r\n/g, '\n');
        const fetchedHash = sha256(normalized);
        if (fetchedHash !== u.remoteHash) {
          console.error(`   ✗ Hash mismatch: ${u.file}`);
          failed++; continue;
        }
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, normalized, 'utf-8');
        applied++;
      } catch (e) {
        console.error(`   ✗ Failed: ${u.file} — ${e.message}`);
        failed++;
      }
    }

    for (const c of plan.created) {
      try {
        const dest = safePath(c.file);
        if (!dest) { console.error(`   ✗ Traversal rejected: ${c.file}`); failed++; continue; }
        // TOCTOU: recheck file didn't appear since planning
        if (lexists(dest)) {
          try { if (lstatSync(dest).isSymbolicLink()) { console.error(`   ✗ Symlink rejected: ${c.file}`); failed++; continue; } } catch (_) {}
          console.error(`   ✗ File created since plan: ${c.file} — treating as CONFLICT`);
          failed++; continue;
        }
        const content = await fetchRemote(SOURCE_BASE + remotePath(c.file));
        const normalized = content.replace(/\r\n/g, '\n');
        const fetchedHash = sha256(normalized);
        if (fetchedHash !== c.remoteHash) {
          console.error(`   ✗ Hash mismatch: ${c.file}`);
          failed++; continue;
        }
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, normalized, 'utf-8');
        applied++;
      } catch (e) {
        console.error(`   ✗ Failed: ${c.file} — ${e.message}`);
        failed++;
      }
    }

    // Only update version on complete success
    if (failed === 0) {
      localVersion.generator = remoteGen;
      localVersion.generated = new Date().toISOString();
      for (const u of plan.updated) localVersion.checksums[u.file] = u.remoteHash;
      for (const c of plan.created) localVersion.checksums[c.file] = c.remoteHash;
      writeFileSync(VERSION_FILE, JSON.stringify(localVersion, null, 2) + '\n', 'utf-8');
      console.log(`✅ Applied ${applied} files. Version updated to ${remoteVersion.generator}.`);
    } else {
      console.log(`❌ ${failed} failures. NO files were version-tracked. Fix and re-run.`);
    }
  }

  return plan;
}

main().catch(e => { console.error(e); process.exit(1); });
