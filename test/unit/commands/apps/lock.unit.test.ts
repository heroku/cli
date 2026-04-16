import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/apps/lock.js'

describe('heroku apps:lock', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('locks the app', async function () {
    const apiGetApp = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {locked: false, name: 'myapp'})
      .patch('/teams/apps/myapp', {locked: true})
      .reply(200)
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect('').to.eq(stdout)
    expect('Locking ⬢ myapp... done\n').to.eq(stderr)
    apiGetApp.done()
  })

  it('returns an error if the app is already locked', async function () {
    const apiGetApp = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {locked: true, name: 'myapp'})
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect('').to.eq(stdout)
    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.eq('Error: cannot lock ⬢ myapp.\nThis app is already locked.')
    apiGetApp.done()
  })
})
