import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../src/commands/container/rm'
import runCommand from '../../helpers/runCommand'
import expectOutput from '../../helpers/utils/expectOutput'
import * as nock from 'nock'
import {expect} from 'chai'

describe('container removal', () => {
  it('removes one container', async () => {
    nock('https://api.heroku.com')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, 'Removing container web for testapp... done')
  })
  it('removes two containers', async () => {
    nock('https://api.heroku.com')
      .patch('/apps/testapp/formation/web')
      .reply(200, {})
      .patch('/apps/testapp/formation/worker')
      .reply(200, {})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
      'worker',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, 'Removing container web for testapp... done')
    expectOutput(stderr.output, 'Removing container worker for testapp... done')
  })

  it('requires a container to be specified', async () => {
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error: any) => {
      expect(error.message).to.contain('Requires one or more process types')
    })
    expectOutput(stdout.output, '')
  })
})
