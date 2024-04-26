'use strict'
/* globals beforeEach afterEach context */

const cli = require('heroku-cli-util')
const cmd = require('../../..').commands.find(c => c.topic === 'container' && c.command === 'rm')
const {expect} = require('chai')
const nock = require('nock')
const testutil = require('../../testutil')

describe('container removal', () => {
  beforeEach(() => {
    cli.mockConsole()
    cli.exit.mock()
  })
  afterEach(() => {
    nock.cleanAll()
  })

  it('exits when the app stack is not "container"', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})

    return testutil.assertExit(1, cmd.run({app: 'testapp', args: ['web'], flags: {}}))
      .then(error => {
        expect(error.message).to.equal('This command is only supported for the container stack. The stack for app testapp is heroku-24.')
        api.done()
      })
  })

  context('when the app is a container app', () => {
    let api
    beforeEach(() => {
      api = nock('https://api.heroku.com:443')
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
    })
    afterEach(() => api.done())

    it('removes one container', () => {
      api
        .patch('/apps/testapp/formation/web')
        .reply(200, {})

      return cmd.run({app: 'testapp', args: ['web'], flags: {}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('Removing container web for testapp... done'))
    })

    it('removes two containers', () => {
      api
        .patch('/apps/testapp/formation/web')
        .reply(200, {})
        .patch('/apps/testapp/formation/worker')
        .reply(200, {})

      return cmd.run({app: 'testapp', args: ['web', 'worker'], flags: {}})
        .then(() => expect(cli.stdout).to.equal(''))
        .then(() => expect(cli.stderr).to.contain('Removing container web for testapp... done'))
        .then(() => expect(cli.stderr).to.contain('Removing container worker for testapp... done'))
    })
  })

  it('requires a container to be specified', () => {
    return testutil.assertExit(1, cmd.run({app: 'testapp', args: [], flags: {}}))
      .then(error => {
        expect(error.message).to.contain('Please specify at least one target process type')
        expect(cli.stdout).to.equal('')
        expect(cli.stderr).to.contain('Please specify at least one target process type')
      })
  })
})
