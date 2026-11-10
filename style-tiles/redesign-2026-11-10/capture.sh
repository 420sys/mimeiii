#!/usr/bin/env bash
# Screenshots of one prototype direction, every screen, Night and Ice.
#
#   ./capture.sh a-hologram                 → .hoplite/artifacts/shots/a-hologram-night-1-desk.png …
#   ./capture.sh a-hologram /tmp/out 2560 1440
#
# Needs the site served on :3000 (the Preview does that) and the agent-browser CLI.
# ?shot holds every loop on one frame and pins the clock, so two runs give the same pixels.
set -euo pipefail

DIR="${1:?which direction, for example a-hologram}"
OUT="${2:-$(git rev-parse --show-toplevel)/.hoplite/artifacts/shots}"
W="${3:-1440}"; H="${4:-900}"
BASE="${BASE:-http://127.0.0.1:3000/style-tiles/redesign-2026-11-10}"
SCENES="${SCENES:-night ice}"
SCREENS="${SCREENS:-1:desk 2:lesson 2.drawer:scripts 3:manual 4:settings 2.course:course 2.launcher:search}"
S="shot-${DIR}"
mkdir -p "$OUT"

ab() { agent-browser --session "$S" "$@"; }
ab set viewport "$W" "$H" >/dev/null
for scene in $SCENES; do
  for pair in $SCREENS; do
    hash="${pair%%:*}"; name="${pair##*:}"
    # A fresh query string per screen, so every shot is a clean load.
    ab open "${BASE}/${DIR}/?shot&menu&time=23:47&date=2026-11-05&scene=${scene}&v=${hash}#${hash}" >/dev/null
    ab wait --fn "window.__ready === true" >/dev/null 2>&1 || true
    ab wait 700 >/dev/null
    file="${OUT}/${DIR}-${scene}-${hash%%.*}-${name}.png"
    ab screenshot "$file" >/dev/null
    echo "$file"
  done
done
echo "--- page errors"; ab errors 2>&1 | tail -8
ab close >/dev/null 2>&1 || true
