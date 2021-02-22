'use strict'
/* globals describe it beforeEach afterEach cli nock expect */

let cmd = require('../../../commands/orgs/default')
let unwrap = require('../../unwrap')

describe('heroku orgs:default', () => {
  beforeEach(() => cli.mockConsole())
  afterEach(() => nock.cleanAll())

  it('shows a deprecation message', async () => {
    await cmd.run({})

    expect('').to.eq(cli.stdout);

    return expect(unwrap(cli.stderr)).to.equal(`orgs:default is no longer in the CLI. \
Use the HEROKU_ORGANIZATION environment variable instead. \
See https://devcenter.heroku.com/articles/develop-orgs#default-org for more info.
`)
  })
})
