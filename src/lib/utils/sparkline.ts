/**
 * Generate ASCII sparkline from an array of numbers
 * Replaces the outdated 'sparkline' npm package
 * @param values Array of numbers to convert to sparkline
 * @returns ASCII sparkline string using Unicode block characters
 */
export function sparkline(values: number[]): string {
  if (!values || values.length === 0) {
    return ''
  }

  // Filter out non-numeric values and handle edge cases
  const validValues = values.filter(v => typeof v === 'number' && !Number.isNaN(v))
  if (validValues.length === 0) {
    return ''
  }

  // Unicode block characters for different heights
  const ticks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

  // NPM sparkline algorithm
  function lshift(n: number, bits: number): number {
    // eslint-disable-next-line prefer-exponentiation-operator
    return Math.floor(n) * Math.pow(2, bits)
  }

  const max = Math.max.apply(null, validValues)
  const min = Math.min.apply(null, validValues)
  const f = Math.floor(lshift(max - min, 8) / (ticks.length - 1))
  if (f < 1) {
    return '▁'.repeat(validValues.length)
  }

  const results: string[] = []
  for (const validValue of validValues) {
    const value = ticks[Math.floor(lshift(validValue - min, 8) / f)]
    results.push(value)
  }

  return results.join('')
}
