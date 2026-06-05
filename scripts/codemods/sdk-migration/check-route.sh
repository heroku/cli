#!/usr/bin/env bash
# Print SDK route metadata for a given (verb, path).
#
# Use to diagnose "body silently dropped at runtime" symptoms: if
# `hasRequestBody` is false but the endpoint logically requires a body, the
# fix is upstream — bump @heroku/types to a version where the route metadata
# is correct. Don't escape-hatch around it.
#
# Usage: check-route.sh <VERB> <PATH>
#   e.g. check-route.sh PATCH /apps/example/config-vars
set -euo pipefail

VERB="${1:-}"
ROUTE_PATH="${2:-}"

if [ -z "$VERB" ] || [ -z "$ROUTE_PATH" ]; then
  echo "usage: $0 <VERB> <PATH>" >&2
  echo "  e.g. $0 PATCH /apps/example/config-vars" >&2
  exit 2
fi

npx tsx -e "
import {RouteIndex} from './scripts/codemods/sdk-migration/routes-index.ts';
const r = RouteIndex.load().lookup('$VERB', '$ROUTE_PATH');
if (!r) { console.log('no match for $VERB $ROUTE_PATH'); process.exit(0); }
console.log('hasRequestBody:', r.entry.hasRequestBody, 'method:', r.entry.resource + '.' + r.entry.method);
"
