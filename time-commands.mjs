#!/usr/bin/env node

/**
 * Accurate CLI command timing script
 * Measures real-world command execution time
 */

import { execSync } from 'child_process'
import { writeFileSync, readFileSync, existsSync } from 'fs'

const ITERATIONS = 15
const RESULTS_FILE = 'timing-results-original.json'

// Commands to test - chosen because they use color imports
const COMMANDS = [
  'version',
  'apps:destroy --help',
  'run --help',
  'pipelines:destroy --help',
  'maintenance:on --help',
]

function timeCommand(command, iterations) {
  const times = []

  process.stdout.write(`Testing: heroku ${command}\n`)
  process.stdout.write('Progress: ')

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    try {
      execSync(`./bin/run ${command}`, {
        stdio: 'pipe',
        encoding: 'utf-8'
      })
    } catch (error) {
      // Command might error, but we're measuring startup time
    }
    const end = performance.now()
    times.push(end - start)
    process.stdout.write('.')
  }

  process.stdout.write('\n')

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const sorted = [...times].sort((a, b) => a - b)
  const min = sorted[0]
  const max = sorted[sorted.length - 1]
  const median = sorted[Math.floor(sorted.length / 2)]

  return { avg, median, min, max, times }
}

async function main() {
  console.log('🕐 Timing Heroku CLI Commands')
  console.log('==============================\n')
  console.log(`Iterations per command: ${ITERATIONS}`)
  console.log('')

  // Check if we have previous results to compare
  let previousResults = null
  if (existsSync(RESULTS_FILE)) {
    try {
      previousResults = JSON.parse(readFileSync(RESULTS_FILE, 'utf-8'))
      console.log('📊 Found previous results for comparison!\n')
    } catch (e) {
      // Ignore if can't read
    }
  }

  const results = {
    timestamp: new Date().toISOString(),
    git_status: execSync('git diff --quiet src/ 2>/dev/null && echo "clean" || echo "modified"', { encoding: 'utf-8' }).trim(),
    commands: {}
  }

  for (const cmd of COMMANDS) {
    const result = timeCommand(cmd, ITERATIONS)
    results.commands[cmd] = result

    console.log(`  Average: ${result.avg.toFixed(2)}ms`)
    console.log(`  Median:  ${result.median.toFixed(2)}ms`)
    console.log(`  Min:     ${result.min.toFixed(2)}ms`)
    console.log(`  Max:     ${result.max.toFixed(2)}ms`)

    // Compare with previous if available
    if (previousResults && previousResults.commands[cmd]) {
      const prev = previousResults.commands[cmd]
      const avgDiff = result.avg - prev.avg
      const avgPct = (avgDiff / prev.avg) * 100
      const medianDiff = result.median - prev.median
      const medianPct = (medianDiff / prev.median) * 100

      console.log(`  Comparison (vs previous):`)
      console.log(`    Average: ${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(2)}ms (${avgPct >= 0 ? '+' : ''}${avgPct.toFixed(2)}%)`)
      console.log(`    Median:  ${medianDiff >= 0 ? '+' : ''}${medianDiff.toFixed(2)}ms (${medianPct >= 0 ? '+' : ''}${medianPct.toFixed(2)}%)`)
    }
    console.log('')
  }

  // Save results for next comparison
  writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))

  // Overall summary if comparing
  if (previousResults) {
    console.log('━'.repeat(60))
    console.log('📈 OVERALL PERFORMANCE COMPARISON')
    console.log('━'.repeat(60))

    let totalAvgDiff = 0
    let totalMedianDiff = 0
    let commandCount = 0

    for (const cmd of COMMANDS) {
      if (previousResults.commands[cmd]) {
        const curr = results.commands[cmd]
        const prev = previousResults.commands[cmd]
        totalAvgDiff += (curr.avg - prev.avg)
        totalMedianDiff += (curr.median - prev.median)
        commandCount++
      }
    }

    const avgDiff = totalAvgDiff / commandCount
    const medianDiff = totalMedianDiff / commandCount

    console.log(`\nAverage across all commands:`)
    console.log(`  Average time change: ${avgDiff >= 0 ? '+' : ''}${avgDiff.toFixed(2)}ms`)
    console.log(`  Median time change:  ${medianDiff >= 0 ? '+' : ''}${medianDiff.toFixed(2)}ms`)

    if (avgDiff < 0) {
      console.log(`\n✅ Commands are ${Math.abs(avgDiff).toFixed(2)}ms FASTER on average!`)
    } else if (avgDiff > 0) {
      console.log(`\n⚠️  Commands are ${avgDiff.toFixed(2)}ms SLOWER on average`)
    } else {
      console.log(`\n➡️  No significant performance change detected`)
    }
  }

  console.log('\n💾 Results saved to', RESULTS_FILE)
  console.log('\nTo compare with original imports:')
  console.log('  1. git stash')
  console.log('  2. npm run build')
  console.log('  3. node time-commands.mjs')
  console.log('  4. git stash pop')
}

main().catch(console.error)
