import {runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/apps/unlock.js'

describe('heroku apps:unlock', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    return nock.cleanAll()
  })

  it('unlocks the app', async function () {
    api
      .get('/teams/apps/myapp')
      .reply(200, {locked: true, name: 'myapp'})
      .patch('/teams/apps/myapp', {locked: false})
      .reply(200)
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect('').to.eq(stdout)
    expect(stderr).to.eq('Unlocking ⬢ myapp... done\n')
  })

  it('returns an error if the app is already unlocked', async function () {
    api
      .get('/teams/apps/myapp')
      .reply(200, {locked: false, name: 'myapp'})
    const {error} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect(error).to.exist
    const {message, oclif} = error as Errors.CLIError
    expect(ansis.strip(message)).to.eq('cannot unlock ⬢ myapp\nThis app is not locked.')
    expect(oclif.exit).to.equal(1) // You can add testing for the correct exit status if you're using `ux.error` to throw.
  })
})
