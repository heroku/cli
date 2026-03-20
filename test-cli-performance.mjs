#!/usr/bin/env node

/**
 * Test real CLI command performance
 * Measures time to execute a simple command that uses color imports
 */

import { execSync } from 'child_process'

function measureCommand(command, iterations = 10) {
  const times = []

  console.log(`Running: ${command}`)
  console.log(`Iterations: ${iterations}\n`)

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    try {
      execSync(command, {
        encoding: 'utf-8',
        stdio: 'pipe',
        env: { ...process.env, NODE_ENV: 'production' }
      })
    } catch (error) {
      // Some commands might error, but we're measuring startup time
    }
    const end = performance.now()
    times.push(end - start)
    process.stdout.write('.')
  }

  console.log('\n')

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)]

  return { avg, min, max, median, times }
}

async function main() {
  console.log('🚀 Testing CLI Performance\n')
  console.log('Testing a command that uses color imports...\n')

  // Test a simple command that uses color
  const result = measureCommand('./bin/run.js version', 10)

  console.log('📊 Results:')
  console.log('─'.repeat(60))
  console.log(`Average: ${result.avg.toFixed(2)}ms`)
  console.log(`Median:  ${result.median.toFixed(2)}ms`)
  console.log(`Min:     ${result.min.toFixed(2)}ms`)
  console.log(`Max:     ${result.max.toFixed(2)}ms`)
  console.log('─'.repeat(60))

  console.log('\n💡 Note: Run this test before and after optimization')
  console.log('   to see the real-world performance difference.')
}

main().catch(console.error)
