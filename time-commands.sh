#!/bin/bash

# Script to time actual CLI commands
# Tests both simple and complex commands that use color imports

echo "🕐 Timing Heroku CLI Commands"
echo "=============================="
echo ""

# Number of iterations per command
ITERATIONS=10

# Commands to test (chosen because they use color imports)
COMMANDS=(
  "version"
  "apps:destroy --help"
  "run --help"
  "pipelines:destroy --help"
  "spaces:destroy --help"
)

# Function to time a command
time_command() {
  local cmd=$1
  local iterations=$2
  local total=0
  local times=()

  echo "Testing: heroku $cmd"
  echo -n "Runs: "

  for i in $(seq 1 $iterations); do
    # Use GNU time format if available, otherwise use bash time
    start=$(node -e "console.log(Date.now())")
    ./bin/run $cmd > /dev/null 2>&1
    end=$(node -e "console.log(Date.now())")
    elapsed=$((end - start))
    times+=($elapsed)
    total=$((total + elapsed))
    echo -n "."
  done

  echo ""

  # Calculate average
  avg=$((total / iterations))

  # Calculate min and max
  min=${times[0]}
  max=${times[0]}
  for time in "${times[@]}"; do
    ((time < min)) && min=$time
    ((time > max)) && max=$time
  done

  # Sort for median
  IFS=$'\n' sorted=($(sort -n <<<"${times[*]}"))
  median_idx=$((iterations / 2))
  median=${sorted[$median_idx]}

  echo "  Average: ${avg}ms"
  echo "  Median:  ${median}ms"
  echo "  Min:     ${min}ms"
  echo "  Max:     ${max}ms"
  echo ""

  # Return average for comparison
  echo $avg
}

echo "Testing with OPTIMIZED imports (direct color paths)"
echo "---------------------------------------------------"
echo ""

# Store results
declare -A optimized_results

for cmd in "${COMMANDS[@]}"; do
  result=$(time_command "$cmd" $ITERATIONS)
  optimized_results["$cmd"]=$result
done

echo ""
echo "Results saved. Please run this script again after 'git stash'."
echo ""
echo "To compare:"
echo "  1. Save this output"
echo "  2. Run: git stash"
echo "  3. Run: npm run build"
echo "  4. Run: ./time-commands.sh"
echo "  5. Compare the results"
