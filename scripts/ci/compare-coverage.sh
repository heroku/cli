#!/usr/bin/env bash
set -e

# Script to compare test coverage between two lcov.info files
# Usage: compare-coverage.sh <pr-coverage-dir> <base-coverage-dir> [--fail-on-decrease]
#
# This script:
# 1. Parses coverage data from both PR and base branch
# 2. Calculates percentage differences
# 3. Outputs formatted comparison to stdout and optionally to GitHub step summary
# 4. Exits with code 1 if coverage decreased (unless all metrics >= 90%)

PR_COVERAGE_DIR="${1:?PR coverage directory required}"
BASE_COVERAGE_DIR="${2:?Base coverage directory required}"
FAIL_ON_DECREASE="${3:-false}"

# Parse coverage from lcov.info file
parse_coverage() {
  local lcov_file="$1"

  if [ ! -f "$lcov_file" ]; then
    echo "0 0 0 0 0 0"
    return
  fi

  local lines_found=$(grep -o "LF:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')
  local lines_hit=$(grep -o "LH:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')
  local funcs_found=$(grep -o "FNF:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')
  local funcs_hit=$(grep -o "FNH:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')
  local branches_found=$(grep -o "BRF:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')
  local branches_hit=$(grep -o "BRH:[0-9]*" "$lcov_file" 2>/dev/null | cut -d: -f2 | awk '{s+=$1} END {print s}')

  # Default to 0 if empty
  echo "${lines_found:-0} ${lines_hit:-0} ${funcs_found:-0} ${funcs_hit:-0} ${branches_found:-0} ${branches_hit:-0}"
}

# Calculate percentage
calc_pct() {
  local hit=$1
  local found=$2
  if [ "$found" -eq 0 ]; then
    echo "0.00"
  else
    awk "BEGIN {printf \"%.2f\", ($hit/$found)*100}"
  fi
}

# Parse PR coverage
read -r LINES_FOUND LINES_HIT FUNCS_FOUND FUNCS_HIT BRANCHES_FOUND BRANCHES_HIT <<< "$(parse_coverage "$PR_COVERAGE_DIR/lcov.info")"

LINES_PCT=$(calc_pct "$LINES_HIT" "$LINES_FOUND")
FUNCS_PCT=$(calc_pct "$FUNCS_HIT" "$FUNCS_FOUND")
BRANCHES_PCT=$(calc_pct "$BRANCHES_HIT" "$BRANCHES_FOUND")

# Parse base coverage
read -r BASE_LINES_FOUND BASE_LINES_HIT BASE_FUNCS_FOUND BASE_FUNCS_HIT BASE_BRANCHES_FOUND BASE_BRANCHES_HIT <<< "$(parse_coverage "$BASE_COVERAGE_DIR/lcov.info")"

# Output current coverage
echo "## 📊 Coverage Comparison"
echo ""
echo "### Current Coverage (PR)"
echo ""
echo "| Metric | Coverage |"
echo "|--------|----------|"
echo "| Lines | ${LINES_PCT}% (${LINES_HIT}/${LINES_FOUND}) |"
echo "| Functions | ${FUNCS_PCT}% (${FUNCS_HIT}/${FUNCS_FOUND}) |"
echo "| Branches | ${BRANCHES_PCT}% (${BRANCHES_HIT}/${BRANCHES_FOUND}) |"
echo ""

# If running in GitHub Actions, also write to step summary
if [ -n "$GITHUB_STEP_SUMMARY" ]; then
  {
    echo "## 📊 Coverage Comparison"
    echo ""
    echo "### Current Coverage (PR)"
    echo ""
    echo "| Metric | Coverage |"
    echo "|--------|----------|"
    echo "| Lines | ${LINES_PCT}% (${LINES_HIT}/${LINES_FOUND}) |"
    echo "| Functions | ${FUNCS_PCT}% (${FUNCS_HIT}/${FUNCS_FOUND}) |"
    echo "| Branches | ${BRANCHES_PCT}% (${BRANCHES_HIT}/${BRANCHES_FOUND}) |"
    echo ""
  } >> "$GITHUB_STEP_SUMMARY"
fi

# Check if base coverage exists
if [ "$BASE_LINES_FOUND" -eq 0 ]; then
  echo "_Note: Base branch does not have coverage reporting configured yet._"
  echo ""
  echo "✅ Coverage check passed (no baseline to compare)"

  [ -n "$GITHUB_STEP_SUMMARY" ] && {
    echo "_Note: Base branch does not have coverage reporting configured yet._" >> "$GITHUB_STEP_SUMMARY"
    echo "" >> "$GITHUB_STEP_SUMMARY"
    echo "✅ Coverage check passed (no baseline to compare)" >> "$GITHUB_STEP_SUMMARY"
  }

  exit 0
fi

# Calculate base coverage percentages
BASE_LINES_PCT=$(calc_pct "$BASE_LINES_HIT" "$BASE_LINES_FOUND")
BASE_FUNCS_PCT=$(calc_pct "$BASE_FUNCS_HIT" "$BASE_FUNCS_FOUND")
BASE_BRANCHES_PCT=$(calc_pct "$BASE_BRANCHES_HIT" "$BASE_BRANCHES_FOUND")

# Calculate diffs
LINES_DIFF=$(awk "BEGIN {printf \"%.2f\", $LINES_PCT - $BASE_LINES_PCT}")
FUNCS_DIFF=$(awk "BEGIN {printf \"%.2f\", $FUNCS_PCT - $BASE_FUNCS_PCT}")
BRANCHES_DIFF=$(awk "BEGIN {printf \"%.2f\", $BRANCHES_PCT - $BASE_BRANCHES_PCT}")

# Add indicators
LINES_INDICATOR=$(awk "BEGIN {if ($LINES_DIFF > 0) print \"🟢\"; else if ($LINES_DIFF < 0) print \"🔴\"; else print \"⚪\"}")
FUNCS_INDICATOR=$(awk "BEGIN {if ($FUNCS_DIFF > 0) print \"🟢\"; else if ($FUNCS_DIFF < 0) print \"🔴\"; else print \"⚪\"}")
BRANCHES_INDICATOR=$(awk "BEGIN {if ($BRANCHES_DIFF > 0) print \"🟢\"; else if ($BRANCHES_DIFF < 0) print \"🔴\"; else print \"⚪\"}")

# Output comparison
echo "### Compared to base branch"
echo ""
echo "| Metric | Base | Current | Change |"
echo "|--------|------|---------|--------|"
echo "| Lines | ${BASE_LINES_PCT}% | ${LINES_PCT}% | ${LINES_INDICATOR} ${LINES_DIFF}% |"
echo "| Functions | ${BASE_FUNCS_PCT}% | ${FUNCS_PCT}% | ${FUNCS_INDICATOR} ${FUNCS_DIFF}% |"
echo "| Branches | ${BASE_BRANCHES_PCT}% | ${BRANCHES_PCT}% | ${BRANCHES_INDICATOR} ${BRANCHES_DIFF}% |"
echo ""

[ -n "$GITHUB_STEP_SUMMARY" ] && {
  echo "### Compared to base branch" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
  echo "| Metric | Base | Current | Change |" >> "$GITHUB_STEP_SUMMARY"
  echo "|--------|------|---------|--------| " >> "$GITHUB_STEP_SUMMARY"
  echo "| Lines | ${BASE_LINES_PCT}% | ${LINES_PCT}% | ${LINES_INDICATOR} ${LINES_DIFF}% |" >> "$GITHUB_STEP_SUMMARY"
  echo "| Functions | ${BASE_FUNCS_PCT}% | ${FUNCS_PCT}% | ${FUNCS_INDICATOR} ${FUNCS_DIFF}% |" >> "$GITHUB_STEP_SUMMARY"
  echo "| Branches | ${BASE_BRANCHES_PCT}% | ${BRANCHES_PCT}% | ${BRANCHES_INDICATOR} ${BRANCHES_DIFF}% |" >> "$GITHUB_STEP_SUMMARY"
  echo "" >> "$GITHUB_STEP_SUMMARY"
}

# If not checking for decrease, exit successfully
if [ "$FAIL_ON_DECREASE" != "--fail-on-decrease" ]; then
  exit 0
fi

# Check if coverage decreased by more than 0.2%
COVERAGE_DECREASED=false
THRESHOLD=-0.2
if (( $(awk "BEGIN {print ($LINES_DIFF < $THRESHOLD)}") )); then
  echo "⚠️ Lines coverage decreased by ${LINES_DIFF}%"
  [ -n "$GITHUB_STEP_SUMMARY" ] && echo "⚠️ Lines coverage decreased by ${LINES_DIFF}%" >> "$GITHUB_STEP_SUMMARY"
  COVERAGE_DECREASED=true
fi
if (( $(awk "BEGIN {print ($FUNCS_DIFF < $THRESHOLD)}") )); then
  echo "⚠️ Functions coverage decreased by ${FUNCS_DIFF}%"
  [ -n "$GITHUB_STEP_SUMMARY" ] && echo "⚠️ Functions coverage decreased by ${FUNCS_DIFF}%" >> "$GITHUB_STEP_SUMMARY"
  COVERAGE_DECREASED=true
fi
if (( $(awk "BEGIN {print ($BRANCHES_DIFF < $THRESHOLD)}") )); then
  echo "⚠️ Branches coverage decreased by ${BRANCHES_DIFF}%"
  [ -n "$GITHUB_STEP_SUMMARY" ] && echo "⚠️ Branches coverage decreased by ${BRANCHES_DIFF}%" >> "$GITHUB_STEP_SUMMARY"
  COVERAGE_DECREASED=true
fi

# Check if all coverage metrics are >= 90%
ALL_ABOVE_90=$(awk "BEGIN {print ($LINES_PCT >= 90 && $FUNCS_PCT >= 90 && $BRANCHES_PCT >= 90)}")

if [ "$COVERAGE_DECREASED" = true ]; then
  if [ "$ALL_ABOVE_90" -eq 1 ]; then
    echo ""
    echo "✅ Coverage check passed - all metrics are >= 90%"
    [ -n "$GITHUB_STEP_SUMMARY" ] && {
      echo "" >> "$GITHUB_STEP_SUMMARY"
      echo "✅ Coverage check passed - all metrics are >= 90%" >> "$GITHUB_STEP_SUMMARY"
    }
    exit 0
  else
    echo ""
    echo "❌ Coverage has decreased compared to the base branch. Please add tests to maintain or improve coverage."
    [ -n "$GITHUB_STEP_SUMMARY" ] && {
      echo "" >> "$GITHUB_STEP_SUMMARY"
      echo "❌ **Coverage has decreased compared to the base branch. Please add tests to maintain or improve coverage.**" >> "$GITHUB_STEP_SUMMARY"
    }
    exit 1
  fi
else
  echo ""
  echo "✅ Coverage check passed - no decrease detected"
  [ -n "$GITHUB_STEP_SUMMARY" ] && {
    echo "" >> "$GITHUB_STEP_SUMMARY"
    echo "✅ Coverage check passed - no decrease detected" >> "$GITHUB_STEP_SUMMARY"
  }
  exit 0
fi
