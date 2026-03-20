#!/usr/bin/env node

/**
 * Benchmark script to measure import performance
 * Compares loading the full module vs direct path imports
 */

async function benchmarkImport(label, importFn, iterations = 100) {
  const times = []

  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await importFn()
    const end = performance.now()
    times.push(end - start)
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length
  const min = Math.min(...times)
  const max = Math.max(...times)
  const median = times.sort((a, b) => a - b)[Math.floor(times.length / 2)]

  return { label, avg, min, max, median, times }
}

async function main() {
  console.log('🔬 Benchmarking @heroku/heroku-cli-util imports\n')
  console.log('Running 100 iterations for each import pattern...\n')

  // Benchmark full module import (current approach)
  const fullModuleResult = await benchmarkImport(
    'Full module import',
    async () => {
      const module = await import('@heroku/heroku-cli-util')
      // Access color to ensure it's loaded
      return module.color
    }
  )

  // Benchmark direct color import (optimized approach)
  const directColorResult = await benchmarkImport(
    'Direct color import',
    async () => {
      const color = await import('@heroku/heroku-cli-util/dist/ux/colors.js')
      return color
    }
  )

  console.log('📊 Results:')
  console.log('─'.repeat(60))
  console.log(`${fullModuleResult.label}:`)
  console.log(`  Average: ${fullModuleResult.avg.toFixed(3)}ms`)
  console.log(`  Median:  ${fullModuleResult.median.toFixed(3)}ms`)
  console.log(`  Min:     ${fullModuleResult.min.toFixed(3)}ms`)
  console.log(`  Max:     ${fullModuleResult.max.toFixed(3)}ms`)
  console.log('')
  console.log(`${directColorResult.label}:`)
  console.log(`  Average: ${directColorResult.avg.toFixed(3)}ms`)
  console.log(`  Median:  ${directColorResult.median.toFixed(3)}ms`)
  console.log(`  Min:     ${directColorResult.min.toFixed(3)}ms`)
  console.log(`  Max:     ${directColorResult.max.toFixed(3)}ms`)
  console.log('─'.repeat(60))

  const improvement = ((fullModuleResult.avg - directColorResult.avg) / fullModuleResult.avg * 100)
  const improvementMedian = ((fullModuleResult.median - directColorResult.median) / fullModuleResult.median * 100)

  console.log('\n💡 Performance Impact:')
  console.log(`  Average improvement: ${improvement.toFixed(2)}% faster`)
  console.log(`  Median improvement:  ${improvementMedian.toFixed(2)}% faster`)
  console.log(`  Time saved (avg):    ${(fullModuleResult.avg - directColorResult.avg).toFixed(3)}ms per import`)

  console.log('\n🎯 Projected Impact:')
  console.log(`  With ~85 files importing color only:`)
  console.log(`  Total time saved: ~${((fullModuleResult.avg - directColorResult.avg) * 85 / 1000).toFixed(2)}s per cold start`)
}

main().catch(console.error)
