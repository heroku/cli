import {stdout, stderr} from 'stdout-stderr'
import * as nock from 'nock'
import {expect} from 'chai'
import Cmd  from '../../../../src/commands/apps/unlock'
import runCommand from '../../../helpers/runCommand'

describe('heroku apps:unlock', () => {
  afterEach(() => nock.cleanAll())
  it('unlocks the app', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {name: 'myapp', locked: true})
      .patch('/teams/apps/myapp', {locked: false})
      .reply(200)
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    expect('').to.eq(stdout.output)
    expect('Unlocking myapp...\nUnlocking myapp... done\n').to.eq(stderr.output)
    api.done()
  })
  it('returns an error if the app is already unlocked', async () => {
    const api = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {name: 'myapp', locked: false})
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .catch((error: unknown) => {
        const {message, oclif} = error as CLIError
        expect(message).to.eq('cannot unlock \u001B[36mmyapp\u001B[39m\nThis app is not locked.')
        expect(oclif.exit).to.equal(1) // You can add testing for the correct exit status if you're using `ux.error` to throw.
      })
    api.done()
  })
})
