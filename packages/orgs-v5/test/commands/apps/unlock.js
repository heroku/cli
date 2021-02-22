'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/apps/unlock')[0]

describe('heroku apps:unlock', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('unlocks the app', async () => {
    let api = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, { name: 'myapp', locked: true })
      .patch('/teams/apps/myapp', { locked: false })
      .reply(200)

    await cmd.run({ app: 'myapp' })

    expect('').to.eq(cli.stdout);

    expect(`Unlocking myapp... done
`).to.eq(cli.stderr);

    return api.done()
  })
})
