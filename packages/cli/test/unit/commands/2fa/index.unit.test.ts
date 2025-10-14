import {expect} from 'chai'
import nock from 'nock'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/auth/2fa/index.js'
import runCommand from '../../../helpers/runCommand.js'

describe('2fa', function () {
  it('shows 2fa is enabled', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: true})
    await runCommand(Cmd, ['2fa'])
    expect(stdout.output).to.equal('Two-factor authentication is enabled\n')
  })

  it('shows 2fa is not enabled', async function () {
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {two_factor_authentication: false})

    await runCommand(Cmd, ['2fa'])
    expect(stdout.output).to.equal('Two-factor authentication is not enabled\n')
  })
})
