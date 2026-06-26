#!/usr/bin/env pwsh
# wf-statusline.ps1 — Windows statusline badge for WF-MAX / WF-REVIEW
# Reads Harness/.runtime/current-mode.json and outputs a colored badge.
#
# Usage in .claude/settings.json:
#   "statusLine": { "type": "command", "command": "pwsh -File Harness/scripts/wf-statusline.ps1" }
#
# Security: refuses symlinks, validates JSON, caps read size.

param()

$MODE_FILE = Join-Path $PSScriptRoot '..' '.runtime' 'current-mode.json'

# Refuse symlinks / missing file
if (-not (Test-Path $MODE_FILE -PathType Leaf)) { exit 0 }
$item = Get-Item $MODE_FILE -Force
if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) { exit 0 }

# Size cap
if ($item.Length -gt 4096) { exit 0 }

try {
  $json = Get-Content $MODE_FILE -Raw -ErrorAction Stop | ConvertFrom-Json
} catch {
  exit 0 # Silent-fail — never crash statusline
}

if (-not $json.active -or $json.role -ne 'ceo') { exit 0 }

switch ($json.mode) {
  'wf-max' {
    $phase = if ($json.phase) { ":$($json.phase -replace 'W\d_','W')" } else { '' }
    Write-Host -NoNewline "`e[38;5;75m[WF-MAX$phase]`e[0m"
  }
  'wf-review' {
    Write-Host -NoNewline "`e[38;5;178m[WF-REVIEW]`e[0m"
  }
}
