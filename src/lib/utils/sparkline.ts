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

  const max = Math.max.apply(null, validValues)
  const min = Math.min.apply(null, validValues)
  const range = max - min

  // All values equal (or a single value) — render a flat baseline.
  if (range === 0) {
    return ticks[0].repeat(validValues.length)
  }

  // Map each value onto a tick by its position within the range. Values are
  // used as-is (no integer truncation), so fractional data — e.g. the latency
  // metrics feeding `heroku dashboard` — renders at full resolution. The top of
  // the range scales to ticks.length, so clamp it down to the last tick to keep
  // the index in bounds.
  return validValues
    .map(value => ticks[Math.min(ticks.length - 1, Math.floor(((value - min) / range) * ticks.length))])
    .join('')
}
