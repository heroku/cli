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

  // Find min and max for normalization
  const min = Math.min(...validValues)
  const max = Math.max(...validValues)

  // If all values are the same, return flat line
  if (min === max) {
    return '▁'.repeat(validValues.length)
  }

  // Unicode block characters for different heights
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']

  // Normalize values to 0-7 range and map to block characters
  return validValues.map(value => {
    const normalized = ((value - min) / (max - min)) * (blocks.length - 1)
    const index = Math.round(normalized)
    return blocks[Math.max(0, Math.min(blocks.length - 1, index))]
  }).join('')
}
