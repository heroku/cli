'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/apps/unlock').apps

describe('heroku apps:unlock', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('unlocks the app', () => {
    let api = nock('https://api.heroku.com:443')
      .get('/organizations/apps/myapp')
      .reply(200, {name: 'myapp', locked: true})
      .patch('/organizations/apps/myapp', {locked: false})
      .reply(200)
    return cmd.run({app: 'myapp'})
      .then(() => expect('').to.eq(cli.stdout))
      .then(() => expect(`Unlocking myapp... done
`).to.eq(cli.stderr))
      .then(() => api.done())
  })
})
