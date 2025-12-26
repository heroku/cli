import {expect} from 'chai'
import sinon from 'sinon'

import { ux } from '@oclif/core'
import { utils } from '@heroku/heroku-cli-util'
import {parseExclusions, prepare} from '../../../../src/lib/pg/push_pull.js'

describe('push_pull', function () {
  describe('parseExclusions', function () {
    it('returns an empty array when rawExcludeList is undefined', function () {
      let x
      expect(parseExclusions(x)).to.deep.equal([])
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

    describe('remote database operations', function () {
      const randomValue = 0.9794701999754457
      const emptyMarker = `${randomValue}${randomValue}`
      const target = {
        database: 'firecrackers',
        host: 'heroku.com',
        port: '5432',
        user: 'vic',
      }

      let uxErrorStub: sinon.SinonStub

      beforeEach(function () {
        sinon.stub(Math, 'random').returns(randomValue)
        uxErrorStub = sinon.stub(ux, 'error')
      })

      afterEach(function () {
        sinon.restore()
      })

      it('prints an error message if the database is not empty', async function () {
        sinon
        .stub(utils.pg.PsqlService.prototype, 'execQuery')
        .resolves('hello')

        await prepare(target as any)
        expect(uxErrorStub.calledOnce).to.be.true
        expect(uxErrorStub.firstCall.args[0]).to.matches(/Remote database is not empty/)
      })

      it('is silent when the remote database is empty', async function () {
        sinon
          .stub(utils.pg.PsqlService.prototype, 'execQuery')
          .resolves(emptyMarker)

        await prepare(target as any)
        expect(uxErrorStub.calledOnce).to.be.false
      })
    })
  })
})
