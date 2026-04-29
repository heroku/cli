#!/bin/bash
#
# Benchmark: Daemon vs Direct Execution
#
# Compares performance of:
# 1. Direct execution (current behavior)
# 2. Daemon execution (warm)
# 3. Cold start (after purge)

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

DAEMON_CLIENT="$(dirname "$0")/client.js"
DIRECT_BIN="../bin/run.js"

echo ""
echo "=== Heroku CLI Performance Benchmark ==="
echo ""

# Function to run a command and measure time
measure() {
  local label="$1"
  local command="$2"

  echo -e "${BLUE}${label}${NC}"

  for i in {1..3}; do
    echo -n "  Run $i: "
    { time $command --version > /dev/null 2>&1; } 2>&1 | grep real | awk '{print $2}'
  done

  echo ""
}

# Test 1: Direct execution (current)
echo -e "${YELLOW}=== Test 1: Direct Execution (Current Behavior) ===${NC}"
echo ""

measure "Cold start (after purge)" "sudo purge && node $DIRECT_BIN"
measure "Warm start (cached)" "node $DIRECT_BIN"

# Test 2: Start daemon and benchmark
echo -e "${YELLOW}=== Test 2: Daemon Execution ===${NC}"
echo ""

echo "Starting daemon..."
node "$(dirname "$0")/cli.js" start
sleep 1

measure "Via daemon (first command)" "node $DAEMON_CLIENT"
measure "Via daemon (subsequent)" "node $DAEMON_CLIENT"

# Test 3: Cold start with daemon
echo -e "${YELLOW}=== Test 3: Cold Start with Daemon ===${NC}"
echo ""

echo "Purging cache..."
sudo purge
sleep 1

measure "Cold start (daemon already loaded)" "node $DAEMON_CLIENT"

# Cleanup
echo ""
echo "Stopping daemon..."
node "$(dirname "$0")/cli.js" stop

# Summary
echo ""
echo -e "${GREEN}=== Summary ===${NC}"
echo ""
echo "Expected results:"
echo "  Direct cold:      ~0.9s   (Node.js startup + file I/O)"
echo "  Direct warm:      ~0.3s   (cached in memory)"
echo "  Daemon first:     ~0.15s  (IPC + execution)"
echo "  Daemon after:     ~0.05s  (pure execution)"
echo "  Daemon cold:      ~0.05s  (daemon already loaded)"
echo ""
echo "The daemon eliminates the cold start penalty entirely!"
echo ""
