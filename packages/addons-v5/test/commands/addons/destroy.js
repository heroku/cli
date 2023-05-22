'use strict'
/* globals commands beforeEach afterEach cli nock */

const cmd = commands.find(c => c.topic === 'addons' && c.command === 'destroy')
const {expect} = require('chai')

describe('addons:destroy', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('destroys an add-on', () => {
    let addon = {id: 201, name: 'db3-swiftly-123', addon_service: {name: 'heroku-db3'}, app: {name: 'myapp', id: 101}}

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db3'}).reply(200, [addon])
      .delete('/apps/101/addons/201', {force: false})
      .reply(200, {plan: {price: {cents: 0}}, provision_message: 'provision msg'})

    return cmd.run({app: 'myapp', args: ['heroku-db3'], flags: {confirm: 'myapp'}})
      .then(() => expect(cli.stdout).to.equal(''))
      .then(() => expect(cli.stderr).to.equal('Destroying db3-swiftly-123 on myapp... done\n'))
      .then(() => api.done())
  })

  it('fails when addon app is not the app specified', () => {
    let addon = {id: 201, name: 'db4-swiftly-123', addon_service: {name: 'heroku-db4'}, app: {name: 'myotherapp', id: 101}}

    let api = nock('https://api.heroku.com:443')
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db4'}).reply(200, [addon])

    return cmd.run({app: 'myapp', args: ['heroku-db4'], flags: {confirm: 'myapp'}})
      .then(() => {
        throw new Error('unreachable')
      })
      .catch(error => {
        api.done()
        expect(error.message).to.equal('db4-swiftly-123 is on myotherapp not myapp')
      })
  })
})
