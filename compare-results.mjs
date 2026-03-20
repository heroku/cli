#!/usr/bin/env node

/**
 * Compare performance results across different import strategies
 */

import { readFileSync } from 'fs'

const files = [
  { name: 'Original (baseline)', file: 'timing-results-original.json', color: '\x1b[33m' },
  { name: 'With /dist imports', file: 'timing-results-with-individual-files.json', color: '\x1b[36m' },
  { name: 'With granular exports', file: 'timing-results-with-granular-exports.json', color: '\x1b[32m' }
]

const reset = '\x1b[0m'
const bold = '\x1b[1m'

function loadResults(filename) {
  try {
    return JSON.parse(readFileSync(filename, 'utf-8'))
  } catch (e) {
    console.error(`Error loading ${filename}:`, e.message)
    return null
  }
}

function formatTime(ms) {
  return ms.toFixed(2) + 'ms'
}

function formatDiff(current, baseline) {
  const diff = current - baseline
  const pct = (diff / baseline) * 100
  const sign = diff >= 0 ? '+' : ''
  const color = diff < 0 ? '\x1b[32m' : diff > 0 ? '\x1b[31m' : '\x1b[37m'
  return `${color}${sign}${formatTime(diff)} (${sign}${pct.toFixed(2)}%)${reset}`
}

console.log(`${bold}🔬 Performance Comparison Across Import Strategies${reset}`)
console.log('='.repeat(80))
console.log()

// Load all results
const results = files.map(f => ({ ...f, data: loadResults(f.file) }))

// Check if all files loaded
const allLoaded = results.every(r => r.data !== null)
if (!allLoaded) {
  console.error('Could not load all result files. Exiting.')
  process.exit(1)
}

const baseline = results[0].data

// Get all command names
const commands = Object.keys(baseline.commands)

// Compare each command
for (const cmd of commands) {
  console.log(`${bold}Command: heroku ${cmd}${reset}`)
  console.log('-'.repeat(80))

  // Print table header
  console.log(`${'Strategy'.padEnd(30)} ${'Avg'.padStart(12)} ${'Median'.padStart(12)} ${'vs Baseline'.padStart(25)}`)
  console.log('-'.repeat(80))

  for (const result of results) {
    const cmdData = result.data.commands[cmd]
    const baselineData = baseline.commands[cmd]

    const avgStr = formatTime(cmdData.avg)
    const medianStr = formatTime(cmdData.median)

    let diffStr = ''
    if (result.name === 'Original (baseline)') {
      diffStr = 'baseline'.padStart(25)
    } else {
      diffStr = formatDiff(cmdData.avg, baselineData.avg)
    }

    console.log(`${result.color}${result.name.padEnd(30)}${reset} ${avgStr.padStart(12)} ${medianStr.padStart(12)} ${diffStr}`)
  }

  console.log()
}

// Overall summary
console.log('='.repeat(80))
console.log(`${bold}📊 Overall Summary${reset}`)
console.log('='.repeat(80))
console.log()

const summaryData = []

for (const result of results) {
  let totalAvg = 0
  let totalMedian = 0
  let count = 0

  for (const cmd of commands) {
    const cmdData = result.data.commands[cmd]
    totalAvg += cmdData.avg
    totalMedian += cmdData.median
    count++
  }

  summaryData.push({
    name: result.name,
    color: result.color,
    avgAcrossCommands: totalAvg / count,
    medianAcrossCommands: totalMedian / count
  })
}

console.log(`${'Strategy'.padEnd(30)} ${'Avg Time'.padStart(15)} ${'Improvement'.padStart(20)}`)
console.log('-'.repeat(80))

for (let i = 0; i < summaryData.length; i++) {
  const data = summaryData[i]
  const avgStr = formatTime(data.avgAcrossCommands)

  let improvementStr = ''
  if (i === 0) {
    improvementStr = 'baseline'.padStart(20)
  } else {
    improvementStr = formatDiff(data.avgAcrossCommands, summaryData[0].avgAcrossCommands)
  }

  console.log(`${data.color}${files[i].name.padEnd(30)}${reset} ${avgStr.padStart(15)} ${improvementStr}`)
}

console.log()
console.log('='.repeat(80))

// Determine winner
const distImports = summaryData[1]
const granularExports = summaryData[2]

console.log(`${bold}🏆 Results:${reset}`)
console.log()

if (granularExports.avgAcrossCommands < distImports.avgAcrossCommands) {
  const improvement = distImports.avgAcrossCommands - granularExports.avgAcrossCommands
  console.log(`✅ Granular exports are ${bold}${formatTime(improvement)} faster${reset} than /dist imports!`)
} else if (granularExports.avgAcrossCommands > distImports.avgAcrossCommands) {
  const regression = granularExports.avgAcrossCommands - distImports.avgAcrossCommands
  console.log(`⚠️  Granular exports are ${bold}${formatTime(regression)} slower${reset} than /dist imports`)
} else {
  console.log(`➡️  Both strategies perform similarly`)
}

const baselineAvg = summaryData[0].avgAcrossCommands
const granularDiff = baselineAvg - granularExports.avgAcrossCommands

if (granularDiff > 0) {
  console.log(`✅ Granular exports are ${bold}${formatTime(granularDiff)} faster${reset} than baseline!`)
} else if (granularDiff < 0) {
  console.log(`⚠️  Granular exports are ${bold}${formatTime(Math.abs(granularDiff))} slower${reset} than baseline`)
} else {
  console.log(`➡️  Granular exports perform the same as baseline`)
}
