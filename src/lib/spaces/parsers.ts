/**
 * Splits strings separated by commas into an array
 * If the string is empty or null, an empty array is returned.
 * @param csvString String with comma-separated values
 * @returns An array of strings or an empty array
 *
 */
export function splitCsv(csvString?: string) {
  return (csvString || '')
    .split(',')
    .map(s => s.trim())
    .filter(s => s.length > 0)
}
