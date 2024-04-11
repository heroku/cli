import {expect} from '@oclif/test'
import {multiSortCompareFn, type Comparator} from '../../../../src/lib/utils/multisort'

describe('MultiSort', () => {
  it('sorts based on precedence', () => {
    type User = {
      firstName: string
      lastName: string
    }
    const comparators: Comparator[] = [
      (a: User, b: User) => a.firstName.localeCompare(b.firstName),
      (a: User, b: User) => a.lastName.localeCompare(b.lastName),
    ]

    const users: User[] = [
      {firstName: 'Jill', lastName: 'Kemp'},
      {firstName: 'Bill', lastName: 'Stevens'},
      {firstName: 'Jill', lastName: 'Ames'},
      {firstName: 'Bill', lastName: 'Bernard'},
    ]
    const shouldBe: User[] = [
      {firstName: 'Bill', lastName: 'Bernard'},
      {firstName: 'Bill', lastName: 'Stevens'},
      {firstName: 'Jill', lastName: 'Ames'},
      {firstName: 'Jill', lastName: 'Kemp'},
    ]
    users.sort(multiSortCompareFn(comparators)) // Bill Bernard, Bill Stevens, Jill Ames, Jill Kemp
    expect(users).to.deep.eq(shouldBe)
  })
})
