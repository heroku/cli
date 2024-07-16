import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/container/rm'
import runCommand from '../../../helpers/runCommand'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as nock from 'nock'
import {expect} from 'chai'
import {CLIError} from '@oclif/core/lib/errors'

describe('container removal', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
  })

  afterEach(function () {
    api.done()
  })

  it('requires a container to be specified', async function () {
    let error
    await runCommand(Cmd, [
      '--app',
      'testapp',
    ]).catch((error_: any) => {
      error = error_
    })
    const {message} = error as unknown as CLIError
    expect(message).to.contain('Requires one or more process types')
    expectOutput(stdout.output, '')
  })

  it('exits when the app stack is not "container"', async function () {
    let error
    api
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ]).catch((error_: any) => {
      error = error_
    })
    const {message, oclif} = error as unknown as CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)
    expectOutput(stdout.output, '')
  })

  context('when the app is a container app', function () {
    let apiV3DockerRelease: nock.Scope

    beforeEach(function () {
      api
        .get('/apps/testapp')
        .reply(200, {name: 'testapp', stack: {name: 'container'}})
      apiV3DockerRelease = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.docker-releases'}})
    })
    afterEach(function () {
      apiV3DockerRelease.done()
    })

    it('removes one container', async function () {
      apiV3DockerRelease
        .patch('/apps/testapp/formation/web')
        .reply(200, {})
      await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expectOutput(stdout.output, '')
      expect(stderr.output).to.contain('Removing container web for ⬢ testapp... done')
    })

    it('removes two containers', async function () {
      apiV3DockerRelease
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
      expect(stderr.output).to.contain('Removing container web for ⬢ testapp... done')
      expect(stderr.output).to.contain('Removing container worker for ⬢ testapp... done')
    })
  })
})
