import {expect} from 'chai'
import sinon from 'sinon'

import {parseExclusions, prepare} from '../../../../src/lib/pg/push_pull.js'

describe('push_pull', function () {
  describe('parseExclusions', function () {
    it('returns an empty array when rawExcludeList is undefined', function () {
      expect(parseExclusions(undefined)).to.deep.equal([])
    })

    it('returns an array of trimmed exclusions when rawExcludeList is a valid string', function () {
      expect(parseExclusions('table1; table2 ; table3')).to.deep.equal(['table1', 'table2', 'table3'])
    })
  })

  describe('prepare', function () {
    describe('local database operations', function () {
      let execStub: sinon.SinonStub

      beforeEach(function () {
        execStub = sinon.stub()
      })

      it('creates a local database when host is localhost', async function () {
        const target = {
          database: 'cats_doing_stuff',
          host: 'localhost',
          port: '5432',
          user: 'me',
        }

        await prepare(target as any, execStub)

        expect(execStub.calledOnce).to.be.true
        expect(execStub.firstCall.args[0]).to.equal('createdb -U me -h localhost -p 5432 cats_doing_stuff')
      })

      it('creates a local database when host is not specified', async function () {
        const target = {
          database: 'dogs_that_thing_they_are_cats',
          port: '5432',
          user: 'you',
        }

        await prepare(target as any, execStub)

        expect(execStub.calledOnce).to.be.true
        expect(execStub.firstCall.args[0]).to.equal('createdb -U you -p 5432 dogs_that_thing_they_are_cats')
      })
    })
  })
})
