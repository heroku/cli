'use strict'
/* globals after before beforeEach afterEach context nock expect */

let cli = require('heroku-cli-util')
let cmd = require('../../../commands/access/remove')[0]
const proxyquire = require('proxyquire')
const sinon = require('sinon')
let stubDelete = require('../../stub/delete')
let apiDelete

describe('heroku access:remove', () => {
  context('with either a personal or org app', () => {
    beforeEach(() => {
      cli.mockConsole()
      apiDelete = stubDelete.collaboratorsPersonalApp('myapp', 'raulb@heroku.com')
    })
    afterEach(() => nock.cleanAll())

    it('removes the user from an app', () => {
      return cmd.run({app: 'myapp', args: {email: 'raulb@heroku.com'}})
        .then(() => expect('').to.eq(cli.stdout))
        .then(() => expect(`Removing raulb@heroku.com access from the app myapp... done
`).to.eq(cli.stderr))
        .then(() => apiDelete.done())
    })
  })

  context('using old command', () => {
    let cmd2
    let cliErrorStub
    let processStub

    before(() => {
      cliErrorStub = sinon.stub(cli, 'error').returns(() => {})
      cmd2 = proxyquire(('../../../commands/access/remove'), {
        cli: cliErrorStub,
      })
      processStub = sinon.stub(process, 'exit').returns(() => {})
      cli.mockConsole()
    })
    after(() => {
      cliErrorStub.restore()
      processStub.restore()
      nock.cleanAll()
    })

    it('errors when attempting to use old command', () => {
      cmd2[1].run({
        app: 'myapp',
      })
      expect(cliErrorStub.called).to.equal(true)
    })
  })
})
