#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = new Set(process.argv.slice(2));
const strict = args.has('--strict') || args.has('--post-bootstrap');

if (args.has('--help') || args.has('-h')) {
  console.log(`Usage: node Harness/scripts/validate-harness.mjs [--strict]

Default mode checks scaffold structure, links, agents, and skills.
--strict also fails when project fact docs still contain unresolved {{TOKEN}} placeholders.
Literal explanatory {{...}} text is allowed.`);
  process.exit(0);
}

const commonAgents = [
  'researcher',
  'docs-researcher',
  'planner',
  'architect',
  'test-writer',
  'implementer',
  'debugger',
  'reviewer',
  'verifier',
  'memory-master',
  'context-master',
  'explore-manager',
  'architect-manager',
  'implement-manager',
  'review-manager',
];

const commonSkills = [
  'wf-update',
  'wf-max',
  'wf-review',
  'wf-learn',
  'subagent-orchestrator',
  'wf-readme',
  'wf-remove',
];

const memoryFiles = [
  'Harness/memory/tool-usage-reflections.md',
  'Harness/memory/user-corrections-preferences.md',
  'Harness/memory/agent-lessons-patterns.md',
];

const required = [
  'AGENTS.md',
  'CLAUDE.md',
  'README.md',
  'Harness/MEMORY.md',
  'Harness/WF.md',
  'Harness/WF-MAX.md',
  ...memoryFiles,
  '.claude/settings.json',
  '.claude/commands/wf.md',
  '.claude/commands/wf-max.md',
  '.claude/rules/ecc/common.md',
  ...commonAgents.map(agent => `.claude/agents/${agent}.md`),
  ...commonSkills.map(skill => `.claude/skills/${skill}/SKILL.md`),
  'Harness/README.md',
  'Harness/PROGRESS.md',
  'Harness/lifecycle.md',
  'Harness/subagents.md',
  'Harness/dispatch.md',
  'Harness/extension.md',
  'Harness/context-loading.md',
  'Harness/agent-workflow.md',
  'Harness/architecture.md',
  'Harness/research/README.md',
  'Harness/research/research-results.md',
  'Harness/research/PRD.md',
  '.claude/skills/wf-update/SKILL.md',
  '.claude/commands/wf-update.md',
  'Harness/scripts/wf-update-check.mjs',
  'Harness/scripts/wf-remove.mjs',
  'Harness/scripts/scan-clean.mjs',
  '.claude/commands/wf-remove.md',
  'Harness/.harness-version',
];

const projectFacts = [
  'Harness/PROGRESS.md',
  'Harness/research/PRD.md',
  'Harness/research/research-results.md',
  'Harness/architecture.md',
];

const contextPacks = [
  'Explorer Pass:',
  'Planner:',
  'Researcher:',
  'Docs Researcher:',
  'Architect:',
  'Test Writer:',
  'Implementer:',
  'Reviewer:',
  'Debugger:',
  'Verifier:',
  'Memory Master:',
  'Context Master:',
];

const durableCommunicationDocs = [
  'Harness/README.md',
  'Harness/subagents.md',
  'Harness/dispatch.md',
  'Harness/context-loading.md',
];

const errors = [];

function read(rel) {
  const file = path.join(root, rel);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function requireText(rel, text, label = text) {
  const body = read(rel);
  if (body && !body.includes(text)) errors.push(`${rel} missing ${label}`);
}

function frontmatterField(text, field) {
  const match = text.match(new RegExp(`^${field}:\\s*(.+)$`, 'm'));
  return match ? match[1].trim() : '';
}

function listDirectories(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name);
}

function listMarkdownFiles(rel) {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return [];
  const normalizedRel = rel.replaceAll(path.sep, '/');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => `${normalizedRel}/${entry.name}`);
}

function unresolvedTemplatePlaceholders(text) {
  const placeholders = [];
  const pattern = /\{\{([^{}\r\n]+)\}\}/g;

  for (const match of text.matchAll(pattern)) {
    const token = match[1].trim();
    if (token === '...') continue;
    placeholders.push(`{{${token}}}`);
  }

  return [...new Set(placeholders)];
}

function registeredSkillFiles(...texts) {
  const files = new Set();
  const pattern = /(?:\.\.\/)?(\.claude\/skills\/[a-z0-9-]+\/SKILL\.md)/g;

  for (const text of texts) {
    for (const match of text.matchAll(pattern)) {
      files.add(match[1]);
    }
  }

  return [...files].sort();
}

function registeredWorkflowFiles(...texts) {
  const files = new Set();
  const pattern = /(?:Harness\/)?workflows\/([A-Za-z0-9._-]+\.md)/g;

  for (const text of texts) {
    for (const match of text.matchAll(pattern)) {
      files.add(`Harness/workflows/${match[1]}`);
    }
  }

  return [...files].sort();
}

for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) {
    errors.push(`missing required file: ${rel}`);
  }
}

// Task capsule template files
const taskTemplateDir = path.join(root, 'Harness', 'tasks', '_template');
if (!fs.existsSync(taskTemplateDir)) {
  errors.push('missing directory: Harness/tasks/_template/');
} else {
  for (const f of ['PROGRESS.md', 'PLAN.md']) {
    if (!fs.existsSync(path.join(taskTemplateDir, f))) {
      errors.push(`missing task template file: Harness/tasks/_template/${f}`);
    }
  }
}

// Cross-reference: DONE files in task PLAN.md must exist on disk
const taskDirs = fs.existsSync(path.join(root, 'Harness', 'tasks'))
  ? fs.readdirSync(path.join(root, 'Harness', 'tasks'), { withFileTypes: true })
      .filter(e => e.isDirectory() && e.name !== '_template')
      .map(e => e.name)
  : [];
for (const taskDir of taskDirs) {
  const planPath = `Harness/tasks/${taskDir}/PLAN.md`;
  const planText = read(planPath);
  if (!planText) continue;
  const donePattern = /`([^`]+\.(?:md|mjs|js|ts|json|html|css))`[^\n]*DONE/gi;
  for (const match of planText.matchAll(donePattern)) {
    const claimedFile = match[1];
    if (!fs.existsSync(path.join(root, claimedFile))) {
      errors.push(`${planPath} claims '${claimedFile}' is DONE but file does not exist`);
    }
  }
}

if (fs.existsSync(path.join(root, 'Harness/research/scaffolds.md'))) {
  errors.push('legacy research file should be renamed: Harness/research/scaffolds.md -> Harness/research/research-results.md');
}

if (strict) {
  console.log('Strict placeholder scope:');
  for (const rel of projectFacts) {
    console.log(`- ${rel}`);
  }

  for (const rel of projectFacts) {
    const text = read(rel);
    for (const placeholder of unresolvedTemplatePlaceholders(text)) {
      errors.push(`template placeholder remains in project fact file: ${rel}: ${placeholder}`);
    }
  }
}

const docsReadme = read('Harness/README.md');
if (docsReadme) {
  for (const marker of ['## Keyword Routing', '## Load By Task', 'When to Read', 'Keywords']) {
    if (!docsReadme.includes(marker)) errors.push(`Harness/README.md missing router marker: ${marker}`);
  }
}

for (const rel of durableCommunicationDocs) {
  requireText(rel, 'project files are the only durable communication channel', 'durable filesystem communication invariant');
  requireText(rel, 'chat/subagent transcript state is non-authoritative', 'non-authoritative transcript invariant');
}

requireText('CLAUDE.md', 'same tool/use pattern fails 3+ times', 'tool reflection trigger');
requireText('CLAUDE.md', 'user corrects the same assumption/pattern 2+ times', 'user correction reflection trigger');
requireText('CLAUDE.md', 'If `Harness/` exists, this repository is governed by the Harness contract', 'Harness binding contract');
requireText('CLAUDE.md', 'Harness/MEMORY.md` is the memory/resource router', 'memory/resource router');
requireText('CLAUDE.md', 'Harness/README.md#Load By Task', 'Harness task router');
requireText('CLAUDE.md', 'Harness/SETUP.md` exists, follow it before normal project work', 'setup bootstrap contract');
requireText('CLAUDE.md', 'subagent-orchestrator` and `Harness/subagents.md', 'subagent orchestrator entry trigger');
requireText('CLAUDE.md', 'Harness/PROGRESS.md` is the global task index', 'PROGRESS global task index');
requireText('CLAUDE.md', 'Harness/tasks/', 'task capsule directory reference');
requireText('CLAUDE.md', 'Subagents are readers and reporters', 'subagent state committer rule');
for (const heading of ['## 2. Think Before Coding', '## 3. Simplicity First', '## 4. Surgical Changes', '## 5. Goal-Driven Execution']) {
  requireText('CLAUDE.md', heading, `Karpathy-style rule heading: ${heading}`);
}

// Root PROGRESS.md structure check
const progress = read('Harness/PROGRESS.md');
if (progress) {
  for (const heading of ['## Active Task', '## Task Index', '## Cross-Task Decisions']) {
    if (!progress.includes(heading)) errors.push(`Harness/PROGRESS.md missing heading: ${heading}`);
  }
}

// Legacy PLAN.md deprecation check (removed — stub only)

const dispatch = read('Harness/dispatch.md');
if (dispatch) {
  for (const agent of commonAgents) {
    if (!dispatch.includes(`\`${agent}\``)) errors.push(`Harness/dispatch.md missing common agent: ${agent}`);
  }
  if (!dispatch.includes('## Handoff Format')) errors.push('Harness/dispatch.md missing heading: ## Handoff Format');
}

const contextLoading = read('Harness/context-loading.md');
if (contextLoading) {
  if (!contextLoading.includes('Harness/README.md` is the primary router')) {
    errors.push('Harness/context-loading.md must declare Harness/README.md as the primary router');
  }
  for (const pack of contextPacks) {
    if (!contextLoading.includes(pack)) errors.push(`Harness/context-loading.md missing subagent pack: ${pack}`);
  }
}

const memory = read('Harness/MEMORY.md');
if (memory) {
  for (const agent of commonAgents) {
    const rel = `.claude/agents/${agent}.md`;
    if (!memory.includes(rel)) errors.push(`Harness/MEMORY.md missing agent registration: ${rel}`);
  }
  for (const skill of commonSkills) {
    const rel = `.claude/skills/${skill}/SKILL.md`;
    if (!memory.includes(rel)) errors.push(`Harness/MEMORY.md missing skill registration: ${rel}`);
  }
  for (const rel of memoryFiles) {
    const relativeRel = rel.replace(/^Harness\//, '');
    if (!memory.includes(rel) && !memory.includes(relativeRel)) {
      errors.push(`Harness/MEMORY.md missing memory file registration: ${rel}`);
    }
  }
}

for (const workflow of listMarkdownFiles('Harness/workflows')) {
  const relativeWorkflow = workflow.replace(/^Harness\//, '');
  if (!docsReadme.includes(workflow) && !docsReadme.includes(relativeWorkflow) && !memory.includes(workflow) && !memory.includes(relativeWorkflow)) {
    errors.push(`workflow is not registered in Harness/README.md or Harness/MEMORY.md: ${workflow}`);
  }
}

for (const skillFile of registeredSkillFiles(docsReadme, memory)) {
  if (!fs.existsSync(path.join(root, skillFile))) {
    errors.push(`registered skill file is missing: ${skillFile}`);
  }
}

for (const workflowFile of registeredWorkflowFiles(docsReadme, memory)) {
  if (!fs.existsSync(path.join(root, workflowFile))) {
    errors.push(`registered workflow file is missing: ${workflowFile}`);
  }
}

function requireUiSelectorContract(rel) {
  const text = read(rel);
  if (!text) return;

  const markers = [
    'data-testid',
    'accessible labels/roles',
    'inputs, buttons, filters, rows, empty/error/loading states',
  ];

  if (markers.some(marker => !text.includes(marker))) {
    errors.push(`${rel} missing stable UI selector contract`);
  }
}

requireUiSelectorContract('Harness/workflows/browser-e2e.md');
requireUiSelectorContract('Harness/workflows/ts-react-frontend.md');

for (const skill of commonSkills) {
  const rel = `.claude/skills/${skill}/SKILL.md`;
  const text = read(rel);
  if (!text) continue;
  if (frontmatterField(text, 'name') !== skill) errors.push(`${rel} frontmatter name does not match directory`);
  if (!frontmatterField(text, 'description')) errors.push(`${rel} missing frontmatter field: description`);
}

for (const skill of listDirectories('.claude/skills')) {
  if (commonSkills.includes(skill)) continue;

  const rel = `.claude/skills/${skill}/SKILL.md`;
  const text = read(rel);
  if (!text) continue;

  if (frontmatterField(text, 'name') !== skill) errors.push(`${rel} frontmatter name does not match directory`);
  if (!frontmatterField(text, 'description')) errors.push(`${rel} missing frontmatter field: description`);
}

for (const agent of commonAgents) {
  const rel = `.claude/agents/${agent}.md`;
  const text = read(rel);
  if (!text) continue;

  for (const field of ['name', 'description', 'tools', 'model']) {
    if (!frontmatterField(text, field)) errors.push(`${rel} missing frontmatter field: ${field}:`);
  }

  if (frontmatterField(text, 'name') !== agent) {
    errors.push(`${rel} frontmatter name does not match filename`);
  }

  const skill = frontmatterField(text, 'skills');
  if (skill && !commonSkills.includes(skill)) {
    errors.push(`${rel} references unknown skill: ${skill}`);
  }

  if (skill && !fs.existsSync(path.join(root, `.claude/skills/${skill}/SKILL.md`))) {
    errors.push(`${rel} references missing skill file: .claude/skills/${skill}/SKILL.md`);
  }
}

requireText('Harness/extension.md', 'Skills should extend the harness');
requireText('Harness/agent-workflow.md', 'Harness/tasks/<task-id>/PROGRESS.md');
requireText('Harness/research/README.md', 'research-results.md');
requireText('Harness/WF.md', 'Ralph-style harness loop', 'WF loop description');
requireText('Harness/WF.md', 'Heartbeat Protocol', 'heartbeat protocol');
requireText('Harness/WF.md', 'WF mode requires multi-subagent orchestration by default', 'WF multi-subagent default');
requireText('Harness/WF.md', 'Explicit `/wf`, `wf mode`, `workflow mode`, or `wk mode` MUST spawn at least 3 distinct subagents', 'explicit WF/WK subagent minimum');
requireText('Harness/WF.md', '.claude/agents/', 'WF built-in agent roster path');
requireText('Harness/WF.md', 'Collaboration decision tree', 'WF decision tree');
requireText('Harness/WF.md', 'Harness/tasks/', 'WF task directory reference');
requireText('Harness/README.md', '`wf mode`, `workflow mode`, or `wk mode`', 'WF/WK router aliases');
requireText('Harness/README.md', 'explicit WF/WK loads subagent docs immediately', 'explicit WF/WK router output');
// harness-* wrapper skills removed — routing table in README.md is the single source
// wf-mode skill removed — WF rules now live directly in Harness/WF.md and .claude/commands/wf.md
requireText('.claude/skills/subagent-orchestrator/SKILL.md', 'Harness/subagents.md', 'subagent-orchestrator loads subagents doc');
requireText('.claude/skills/subagent-orchestrator/SKILL.md', '.claude/agents/', 'subagent-orchestrator built-in agent roster path');
requireText('.claude/skills/subagent-orchestrator/SKILL.md', '`workflow mode`, `wk mode`', 'subagent-orchestrator WF/WK aliases');
requireText('.claude/skills/wf-readme/SKILL.md', 'README.md', 'wf-readme loads README');
requireText('.claude/skills/wf-readme/SKILL.md', 'Harness/architecture.md', 'wf-readme links architecture docs');
requireText('Harness/subagents.md', '## Source Attribution', 'subagent source attribution');
requireText('Harness/subagents.md', 'npx skills find', 'find-skills discovery attribution');
requireText('Harness/subagents.md', 'superpowers:dispatching-parallel-agents', 'parallel-agent source attribution');
requireText('Harness/subagents.md', 'superpowers:subagent-driven-development', 'subagent-driven source attribution');
requireText('Harness/subagents.md', '## Built-in Agent Roster', 'built-in agent roster');
requireText('Harness/subagents.md', '## WF Default Fan-Out', 'WF default fan-out');
requireText('Harness/subagents.md', 'concrete conditions', 'subagent decision tree');
requireText('Harness/subagents.md', 'parallel planner/researcher/docs-researcher/architect subagents', 'WF roster orchestration shape');
requireText('Harness/subagents.md', '## Efficiency Ladder', 'subagent efficiency ladder');
requireText('Harness/subagents.md', '## Review Gates', 'subagent review gates');
requireText('Harness/architecture.md', '## 2. Interface Decoupling', 'architecture interface decoupling');
requireText('Harness/architecture.md', '## 3. State Design', 'architecture state design');
requireText('Harness/architecture.md', 'Avoid speculative abstraction', 'anti-overengineering architecture rule');
requireText('CLAUDE.md', 'Use explicit interfaces or state models only when they protect a real boundary', 'CLAUDE interface/state simplicity rule');
requireText('CLAUDE.md', '/wf-update', 'wf update startup instruction');
requireText('Harness/README.md', 'Need harness update', 'update routing row');
requireText('Harness/WF-MAX.md', 'write-set coloring', 'WF-MAX coloring algorithm');
requireText('Harness/WF-MAX.md', 'wave dispatch', 'WF-MAX wave dispatch');
requireText('Harness/README.md', '/wf-max', 'wf max router alias');
requireText('Harness/README.md', 'WF-MAX.md', 'WF-MAX router reference');
requireText('Harness/subagents.md', 'Max parallelism', 'subagents max parallelism row');
requireText('Harness/dispatch.md', 'Concurrency group', 'dispatch concurrency group field');
requireText('Harness/dispatch.md', 'File claim', 'dispatch file claim field');
requireText('CLAUDE.md', '/wf-max', 'wf max startup instruction');

if (errors.length) {
  console.error(`Harness validation failed${strict ? ' (strict)' : ''}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Harness validation passed${strict ? ' (strict)' : ''}.`);
if (!strict) {
  console.log('Tip: run `node Harness/scripts/validate-harness.mjs --strict` after bootstrap to check unresolved project placeholders.');
}
