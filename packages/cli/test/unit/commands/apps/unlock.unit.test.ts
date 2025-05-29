import {stdout, stderr} from 'stdout-stderr'
import nock from 'nock'
import {expect} from 'chai'
import {Errors} from '@oclif/core'
// import Cmd from '../../../../src/commands/apps/unlock.js'
import runCommand from '../../../helpers/runCommand.js'
import stripAnsi from 'strip-ansi'

/*
describe('heroku apps:unlock', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  it('unlocks the app', async function () {
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
    expect(stderr.output).to.eq('Unlocking ⬢ myapp... done\n')
    api.done()
  })

  it('returns an error if the app is already unlocked', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/teams/apps/myapp')
      .reply(200, {name: 'myapp', locked: false})
    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
      .catch((error: unknown) => {
        const {message, oclif} = error as Errors.CLIError
        expect(stripAnsi(message)).to.eq('cannot unlock ⬢ myapp\nThis app is not locked.')
        expect(oclif.exit).to.equal(1) // You can add testing for the correct exit status if you're using `ux.error` to throw.
      })
    api.done()
  })
})

*/
