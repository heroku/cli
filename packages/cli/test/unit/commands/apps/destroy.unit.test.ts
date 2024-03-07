import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout, stderr} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import Cmd from '../../../../src/commands/apps/destroy'

describe('apps:destroy', function () {
  beforeEach(() => {
    nock.cleanAll()
  })

  it('deletes the app', async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .delete('/apps/myapp')
      .reply(200)
    await runCommand(Cmd, ['--app', 'myapp', '--confirm', 'myapp'])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.include('Destroying ⬢ myapp (including all add-ons)... done\n')
  })

  it('deletes the app via arg',  async () => {
    nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .delete('/apps/myapp')
      .reply(200)
    await runCommand(Cmd, ['myapp', '--confirm', 'myapp'])
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.include('Destroying ⬢ myapp (including all add-ons)... done\n')
  })

  it('errors without an app', async () => {
    try {
      await runCommand(Cmd, ['--app', ''])
    } catch (error) {
      const {message} = error as {message: string}
      expect(message).to.include('No app specified.')
    }
  })
})
