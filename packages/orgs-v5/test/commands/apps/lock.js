'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/apps/lock')[0]

describe('heroku apps:lock', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('locks the app', async () => {
    let apiGetApp = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, { name: 'myapp', locked: false })
      .patch('/teams/apps/myapp', { locked: true })
      .reply(200)

    await cmd.run({ app: 'myapp' })

    expect('').to.eq(cli.stdout);

    expect(`Locking myapp... done
`).to.eq(cli.stderr);

    return apiGetApp.done()
  })
})
