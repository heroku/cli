export function maxBy<T>(arr: T[], fn: (i: T) => number): T | undefined {
  let max: {element: T; i: number} | undefined
  for (const cur of arr) {
    const i = fn(cur)
    if (!max || i > max.i) {
      max = {i, element: cur}
    }
  }

  return max && max.element
}
