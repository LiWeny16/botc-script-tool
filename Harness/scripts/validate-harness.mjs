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
];

const commonSkills = [
  'harness-router',
  'harness-lifecycle',
  'harness-research',
  'harness-context',
  'harness-build-loop',
  'wf-mode',
  'subagent-orchestrator',
  'readme-optimizer',
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
  ...memoryFiles,
  '.claude/settings.json',
  '.claude/commands/wf.md',
  '.claude/rules/ecc/common.md',
  ...commonAgents.map(agent => `.claude/agents/${agent}.md`),
  ...commonSkills.map(skill => `.claude/skills/${skill}/SKILL.md`),
  'Harness/README.md',
  'Harness/PLAN.md',
  'Harness/lifecycle.md',
  'Harness/subagents.md',
  'Harness/dispatch.md',
  'Harness/extension.md',
  'Harness/context-loading.md',
  'Harness/agent-workflow.md',
  'Harness/architecture.md',
  'Harness/data-flow.md',
  'Harness/state-machines.md',
  'Harness/features/_template.md',
  'Harness/research/README.md',
  'Harness/research/research-results.md',
  'Harness/research/PRD.md',
  'Harness/domain/ports.md',
];

const projectFacts = [
  'Harness/PLAN.md',
  'Harness/research/PRD.md',
  'Harness/research/research-results.md',
  'Harness/architecture.md',
  'Harness/domain/ports.md',
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
for (const heading of ['## 2. Think Before Coding', '## 3. Simplicity First', '## 4. Surgical Changes', '## 5. Goal-Driven Execution']) {
  requireText('CLAUDE.md', heading, `Karpathy-style rule heading: ${heading}`);
}

const plan = read('Harness/PLAN.md');
if (plan) {
  for (const heading of ['## Current Goal', '## Phase', '## Heartbeat', '## Success Criteria', '## Loaded Context', '## Tasks', '## Parallel Dispatch', '## Subagent Synthesis', '## Verification']) {
    if (!plan.includes(heading)) errors.push(`Harness/PLAN.md missing heading: ${heading}`);
  }
  for (const marker of ['Next beat trigger', 'Recovery action']) {
    if (!plan.includes(marker)) errors.push(`Harness/PLAN.md missing heartbeat marker: ${marker}`);
  }
}

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
requireUiSelectorContract('Harness/features/_template.md');

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

  for (const field of ['name', 'description', 'tools', 'model', 'skills']) {
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
requireText('Harness/agent-workflow.md', 'Harness/PLAN.md');
requireText('Harness/research/README.md', 'research-results.md');
requireText('Harness/WF.md', 'Ralph-style harness loop', 'WF loop description');
requireText('Harness/WF.md', 'Heartbeat Protocol', 'heartbeat protocol');
requireText('.claude/skills/wf-mode/SKILL.md', 'Harness/WF.md', 'wf-mode loads WF document');
requireText('.claude/skills/wf-mode/SKILL.md', 'Harness/subagents.md', 'wf-mode loads subagent orchestration');
requireText('.claude/skills/subagent-orchestrator/SKILL.md', 'Harness/subagents.md', 'subagent-orchestrator loads subagents doc');
requireText('.claude/skills/harness-context/SKILL.md', 'Harness/subagents.md', 'harness-context loads subagents doc');
requireText('.claude/skills/readme-optimizer/SKILL.md', 'README.md', 'readme-optimizer loads README');
requireText('.claude/skills/readme-optimizer/SKILL.md', 'Harness/architecture.md', 'readme-optimizer links architecture docs');
requireText('Harness/subagents.md', '## Source Attribution', 'subagent source attribution');
requireText('Harness/subagents.md', 'npx skills find', 'find-skills discovery attribution');
requireText('Harness/subagents.md', 'superpowers:dispatching-parallel-agents', 'parallel-agent source attribution');
requireText('Harness/subagents.md', 'superpowers:subagent-driven-development', 'subagent-driven source attribution');
requireText('Harness/subagents.md', '## Efficiency Ladder', 'subagent efficiency ladder');
requireText('Harness/subagents.md', '## Review Gates', 'subagent review gates');

if (errors.length) {
  console.error(`Harness validation failed${strict ? ' (strict)' : ''}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Harness validation passed${strict ? ' (strict)' : ''}.`);
if (!strict) {
  console.log('Tip: run `node Harness/scripts/validate-harness.mjs --strict` after bootstrap to check unresolved project placeholders.');
}
