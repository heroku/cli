type Update = {
  update_type: string,
  updated_at: string,
  contents: string,
}

export function getMaxUpdateTypeLength(updatesArray: Update[]): number {
  let max = 0
  for (const update of updatesArray) {
    if (!max || update.update_type.length > max) {
      max = update.update_type.length
    }
  }

  return max
}
