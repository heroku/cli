export type Comparator = Parameters<typeof Array.prototype.sort>[0]
/**
 * The multiSortCompareFn function is used to
 * build a single comparator function for use
 * in Array.sort when multiple sort criteria
 * is needed on an object type. The indices of
 * specified array of SortCriteria indicate the
 * precedence of each comparator.
 *
 * @example
 * ```ts
 * type User = {
 *  firstName: string
 *  lastName: string
 * }
 * const localeCompare = (a: string, b: string) => a.localeCompare(b)
 * const comparators = [
 *  (a: User, b: User) => localeCompare(a.firstName, b.firstName),
 *  (a: User, b: User) => localeCompare(a.lastName, b.lastName)
 *  ]
 *
 * const users: User[] = [
 *  {fistName: 'Bill', lastName: 'Stevens'},
 *  {firstName: 'Jill', lastName: 'Ames'},
 *  {firstName: 'Bill', lastName: 'Bernard'},
 * ]
 * users.sort(multiSortCompareFn(comparators)) // Bill Bernard, Bill Stevens, Jill Ames
 * ```
 * @param comparators The array of Comparators whose indices indicate sort precedence
 * @returns Comparator
 */
export function multiSortCompareFn(comparators: Comparator[]): Comparator {
  // Typical bitmask strategy whereas the most
  // significant bit represents the comparator
  // result in the zero index and thus has the
  // highest precedence. The bit length
  // is determined by the number of comparators
  // and the positional notation mirrors the
  // comparator indices.
  // There is a 32 bit limit in total. 2 bits
  // are used for 1. the bitLength and 2. the two's
  // compliment signed bit. This means we have a
  // limit of 30 comparators max.
  return (a: unknown, b: unknown): 1 | -1 | 0 => {
    const bitLen = comparators.length - 1
    let bitA = 0
    let bitB = 0

    comparators.forEach((comparator, index) => {
      const priority = 1 << (bitLen - index)
      const score = comparator?.(a, b)
      if (score === -1) {
        bitA |= priority
      }

      if (score === 1) {
        bitB |= priority
      }
    })
    return bitA > bitB ? -1 : (bitA < bitB ? 1 : 0)
  }
}

