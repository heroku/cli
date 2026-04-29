/**
 * Parses provision options from an array of KEY:VALUE or KEY strings.
 *
 * @param provisionOpts - Array of strings in KEY:VALUE or KEY format
 * @returns Record mapping keys to values (keys without values default to "true")
 *
 * @example
 * parseProvisionOpts(['fork:DATABASE', 'rollback:true', 'follow:', 'foo'])
 * // Returns: { fork: 'DATABASE', rollback: 'true', follow: 'true', foo: 'true' }
 *
 * @example
 * parseProvisionOpts(['key:value:with:colons'])
 * // Returns: { key: 'value:with:colons' } (splits on first colon only)
 */
export function parseProvisionOpts(provisionOpts: string[]): Record<string, string> {
  const provisionConfig: Record<string, string> = {}
  for (const opt of provisionOpts) {
    const colonIndex = opt.indexOf(':')
    if (colonIndex === -1) {
      // No colon means just a key, default to "true"
      provisionConfig[opt.trim()] = 'true'
    } else {
      const key = opt.slice(0, colonIndex).trim()
      const value = opt.slice(colonIndex + 1).trim()
      // If no value is provided after the colon, default to "true"
      provisionConfig[key] = value || 'true'
    }
  }

  return provisionConfig
}
