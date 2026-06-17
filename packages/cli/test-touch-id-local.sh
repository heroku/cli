#!/bin/bash
# Local test script for Touch ID authentication
# Usage: ./test-touch-id-local.sh

cd "$(dirname "$0")"

echo "=== Testing Touch ID Authentication Locally ==="
echo ""

# Test 1: GET request (should NOT require Touch ID)
echo "Test 1: GET request (apps:info)"
echo "Expected: No Touch ID prompt"
HEROKU_TOUCH_ID_ENABLED=true ./packages/cli/bin/run apps:info fast-fortress-83917 2>&1 | grep -E "Touch ID|fast-fortress"
echo ""

# Test 2: PATCH request (should require Touch ID)
echo "Test 2: PATCH request (config:set)"
echo "Expected: Touch ID prompt before execution"
HEROKU_TOUCH_ID_ENABLED=true ./packages/cli/bin/run config:set TEST_VAR=test_value -a fast-fortress-83917
echo ""

echo "=== Tests Complete ==="
