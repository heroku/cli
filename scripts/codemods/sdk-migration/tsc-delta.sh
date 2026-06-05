#!/usr/bin/env bash
# Run tsc and filter pre-existing errors against /tmp/tsc-baseline.txt.
#
# The `[ -s "$BASELINE" ]` guard is load-bearing: when the baseline file is
# empty (clean repo at pre-flight time), `grep -v -F -f` matches *nothing*
# because the empty pattern file has no patterns — yielding a false "no
# errors" signal in exactly the case where strict checking matters most.
#
# Usage: tsc-delta.sh [tail-lines]
#   tail-lines: optional, pipes through `tail -N` (use "all" for unfiltered)
set -euo pipefail

BASELINE="${TSC_BASELINE:-/tmp/tsc-baseline.txt}"
TAIL="${1:-all}"

run_tsc() {
  if [ -s "$BASELINE" ]; then
    npx tsc --noEmit -p tsconfig.json 2>&1 | grep -v -F -f "$BASELINE" || true
  else
    npx tsc --noEmit -p tsconfig.json 2>&1 || true
  fi
}

if [ "$TAIL" = "all" ]; then
  run_tsc
else
  run_tsc | tail -"$TAIL"
fi
