import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {Errors} from '@oclif/core'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/container/rm.js'

describe('container removal', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com:443')
  })

  afterEach(function () {
    api.done()
  })

  it('requires a container to be specified', async function () {
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
    ])
    const {message} = error as unknown as Errors.CLIError
    expect(message).to.contain('Requires one or more process types')
    expectOutput(stdout, '')
  })

  it('exits when the app stack is not "container"', async function () {
    api
      .get('/apps/testapp')
      .reply(200, {name: 'testapp', stack: {name: 'heroku-24'}})
    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'testapp',
      'web',
    ])
    const {message, oclif} = error as unknown as Errors.CLIError
    expect(message).to.equal('This command is for Docker apps only.')
    expect(oclif.exit).to.equal(1)
    expectOutput(stdout, '')
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
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
      ])
      expectOutput(stdout, '')
      expect(stderr).to.contain('Removing container web for ⬢ testapp... done')
    })

    it('removes two containers', async function () {
      apiV3DockerRelease
        .patch('/apps/testapp/formation/web')
        .reply(200, {})
        .patch('/apps/testapp/formation/worker')
        .reply(200, {})
      const {stderr, stdout} = await runCommand(Cmd, [
        '--app',
        'testapp',
        'web',
        'worker',
      ])
      expectOutput(stdout, '')
      expect(stderr).to.contain('Removing container web for ⬢ testapp... done')
      expect(stderr).to.contain('Removing container worker for ⬢ testapp... done')
    })
  })
})
