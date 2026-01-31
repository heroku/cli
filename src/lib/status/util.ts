export function getMaxUpdateTypeLength(updateTypes: string[]): number {
  let max = 0
  for (const update of updateTypes) {
    if (!max || update.length > max) {
      max = update.length
    }
  }

  return max
}
