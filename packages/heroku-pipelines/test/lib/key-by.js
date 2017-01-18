'use strict'

const keyBy = require('../../lib/key-by')

describe('keyBy', function () {
  let item1, item2, item3
  let list

  beforeEach(function () {
    item1 = { id: 1, props: { name: 'apples' } }
    item2 = { id: 2, props: { name: 'pears' } }
    item3 = { id: 3, props: { name: 'bananas' } }

    list = [item1, item2, item3]
  })

  context('given a property', function () {
    it('groups by that property', function () {
      const result = keyBy(list, 'id')
      result.should.deep.equal({
        1: item1,
        2: item2,
        3: item3
      })
    })
  })

  context('given a callback', function () {
    it('groups by the callback result', function () {
      const result = keyBy(list, (item) => item.props.name)
      result.should.deep.equal({
        apples: item1,
        pears: item2,
        bananas: item3
      })
    })
  })
})
