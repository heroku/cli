import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/rm'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as nock from 'nock'
import {expect} from 'chai'

describe('container removal', function () {
  it('removes one container', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.docker-releases'}})
      .patch('/apps/testapp/formation/web')
      .reply(200, {})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    expectOutput(stdout.output, '')
    expectOutput(stderr.output, `
Removing container web for ⬢ testapp...
Removing container web for ⬢ testapp... done
`)
  })

  it('removes two containers', async function () {
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.docker-releases'}})
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
    expectOutput(stderr.output, `
Removing container web for ⬢ testapp...
Removing container web for ⬢ testapp... done
Removing container worker for ⬢ testapp...
Removing container worker for ⬢ testapp... done
`)
  })

  it('requires a container to be specified', async function () {
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error: any) => {
      expect(error.message).to.contain('Requires one or more process types')
    })
    expectOutput(stdout.output, '')
  })
})
