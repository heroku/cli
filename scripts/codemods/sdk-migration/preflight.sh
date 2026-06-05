#!/usr/bin/env bash
# Pre-flight checks for sdk-command-migration: P1 (clean working tree, SDK on
# disk) and P2 (capture baselines).
#
# Why the SDK probe looks the way it does: the SDK's `exports` map doesn't
# expose `./package.json` (so `require('@heroku/sdk/package.json')` fails with
# ERR_PACKAGE_PATH_NOT_EXPORTED), and the SDK's entry uses top-level `await`
# (so `require('@heroku/sdk')` fails with ERR_REQUIRE_ASYNC_MODULE). Reading
# `node_modules/@heroku/sdk/package.json` directly and using
# `--input-type=module` for the import sidesteps both.
#
# Usage: preflight.sh <command-test-path>
#   e.g. preflight.sh test/unit/commands/apps/info.unit.test.ts
set -euo pipefail

TEST_PATH="${1:-}"
if [ -z "$TEST_PATH" ]; then
  echo "usage: $0 <command-test-path>" >&2
  exit 2
fi

BASELINE="${TSC_BASELINE:-/tmp/tsc-baseline.txt}"

echo "=== P1: working tree ==="
git status -sb

echo
echo "=== P1: SDK on disk ==="
grep -E '"(name|version)"' node_modules/@heroku/sdk/package.json
node --input-type=module -e "import {HerokuSDK} from '@heroku/sdk'; console.log('HerokuSDK is', typeof HerokuSDK)"

echo
echo "=== P2: tsc baseline -> $BASELINE ==="
npx tsc --noEmit -p tsconfig.json 2>&1 | tee "$BASELINE" | tail -20

echo
echo "=== P2: target test file ==="
npx mocha "$TEST_PATH" --reporter min 2>&1 | tail -5
