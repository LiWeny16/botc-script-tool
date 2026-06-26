#!/bin/bash
# wf-statusline.sh — Unix statusline badge for WF-MAX / WF-REVIEW
# Reads Harness/.runtime/current-mode.json and outputs a colored badge.
#
# Usage in .claude/settings.json:
#   "statusLine": { "type": "command", "command": "bash Harness/scripts/wf-statusline.sh" }
#
# Security: refuses symlinks, validates JSON, caps read size.

MODE_FILE="$(dirname "$0")/../.runtime/current-mode.json"

# Resolve relative path to absolute (from project root or script location)
if [ ! -f "$MODE_FILE" ]; then
  # Try relative to CWD (project root)
  MODE_FILE="Harness/.runtime/current-mode.json"
fi

[ -L "$MODE_FILE" ] && exit 0   # Refuse symlinks
[ ! -f "$MODE_FILE" ] && exit 0 # Missing file

# Read with python for safe JSON parse (jq may not be installed).
# Pass file path as argv to avoid shell injection via MODE_FILE content.
MODE=$(python3 -c "
import json, os, sys
try:
  fpath = sys.argv[1]
  if os.path.getsize(fpath) > 4096: sys.exit(1)
  with open(fpath, 'r') as f:
    d = json.load(f)
  if d.get('active') and d.get('role') == 'ceo':
    print(d.get('mode','') + '|' + d.get('phase',''))
except: pass
" "$MODE_FILE" 2>/dev/null)

[ -z "$MODE" ] && exit 0

MODE_NAME="${MODE%%|*}"
MODE_PHASE="${MODE##*|}"

case "$MODE_NAME" in
  wf-max)
    PHASE_SHORT=$(echo "$MODE_PHASE" | sed 's/W._/W/')
    printf '\033[38;5;75m[WF-MAX:%s]\033[0m' "$PHASE_SHORT"
    ;;
  wf-review)
    printf '\033[38;5;178m[WF-REVIEW]\033[0m'
    ;;
esac
