import {prompter} from '@heroku-cli/command'
import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stub} from 'sinon'

import ConfigSet from '../../../../src/commands/config/set.js'

describe('config:set', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('sets a config var', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production', RAILS_ENV: 'production'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

    expect(stdout).to.equal('RACK_ENV: production\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
  })

  it('sets a config var with an "=" in it', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production=foo'})
      .reply(200)
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    const {stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production=foo', '--app', 'myapp'])

    expect(stdout).to.equal('\n')
    expect(stderr).to.include('Setting RACK_ENV and restarting ⬢ myapp')
    expect(stderr).to.include('done, v10')
  })

  it('prompts for 2fa, preauthorizes, and retries the config update', async function () {
    const originalIsTTY = process.stdin.isTTY
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: true})
    const promptStub = stub(prompter, 'prompt').resolves({factor: '123456'})
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(403, {
        app: {name: 'myapp'},
        id: 'two_factor',
        message: 'Two-factor authentication required',
      })
      .put('/apps/myapp/pre-authorizations')
      .matchHeader('Heroku-Two-Factor-Code', '123456')
      .reply(200, {})
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production'})
      .get('/apps/myapp/releases')
      .reply(200, [{version: 10}])

    try {
      const {stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

      expect(promptStub.calledOnce).to.be.true
      expect(stderr).to.include('done, v10')
      expect(stderr).not.to.include('!')
      expect(stdout).to.equal('RACK_ENV: production\n')
    } finally {
      promptStub.restore()
      Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: originalIsTTY})
    }
  })

  it('ends the action with ! when the 2fa prompt is canceled', async function () {
    const originalIsTTY = process.stdin.isTTY
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: true})
    const promptStub = stub(prompter, 'prompt').rejects(new Error('Two-factor prompt canceled'))
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(403, {
        app: {name: 'myapp'},
        id: 'two_factor',
        message: 'Two-factor authentication required',
      })

    try {
      const {error, stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

      expect(error?.message).to.equal('Two-factor prompt canceled')
      expect(stderr).to.include('!')
      expect(stderr).not.to.include('done')
      expect(stdout).to.equal('')
    } finally {
      promptStub.restore()
      Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: originalIsTTY})
    }
  })

  it('ends the action with ! when app preauthorization fails', async function () {
    const originalIsTTY = process.stdin.isTTY
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: true})
    const promptStub = stub(prompter, 'prompt').resolves({factor: '123456'})
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(403, {
        app: {name: 'myapp'},
        id: 'two_factor',
        message: 'Two-factor authentication required',
      })
      .put('/apps/myapp/pre-authorizations')
      .matchHeader('Heroku-Two-Factor-Code', '123456')
      .reply(403, {id: 'forbidden', message: 'Preauthorization failed'})

    try {
      const {error, stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

      expect(error?.message).to.include('Preauthorization failed')
      expect(stderr).to.include('!')
      expect(stderr).not.to.include('done')
      expect(stdout).to.equal('')
    } finally {
      promptStub.restore()
      Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: originalIsTTY})
    }
  })

  it('ends the action with ! when the config retry fails', async function () {
    const originalIsTTY = process.stdin.isTTY
    Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: true})
    const promptStub = stub(prompter, 'prompt').resolves({factor: '123456'})
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(403, {
        app: {name: 'myapp'},
        id: 'two_factor',
        message: 'Two-factor authentication required',
      })
      .put('/apps/myapp/pre-authorizations')
      .matchHeader('Heroku-Two-Factor-Code', '123456')
      .reply(200, {})
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(500, {id: 'server_error', message: 'Config retry failed'})

    try {
      const {error, stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

      expect(error?.message).to.include('Config retry failed')
      expect(stderr).to.include('!')
      expect(stderr).not.to.include('done')
      expect(stdout).to.equal('')
    } finally {
      promptStub.restore()
      Object.defineProperty(process.stdin, 'isTTY', {configurable: true, value: originalIsTTY})
    }
  })

  it('ends the action with ! when the config update fails', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(422, {id: 'invalid_params', message: 'Config update failed'})

    const {error, stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

    expect(error?.message).to.include('Config update failed')
    expect(stderr).to.include('!')
    expect(stderr).not.to.include('done')
    expect(stdout).to.equal('')
  })

  it('ends the action with ! when the release lookup fails', async function () {
    api
      .patch('/apps/myapp/config-vars', {RACK_ENV: 'production'})
      .reply(200, {RACK_ENV: 'production'})
      .get('/apps/myapp/releases')
      .reply(500, {id: 'server_error', message: 'Release lookup failed'})

    const {error, stderr, stdout} = await runCommand(ConfigSet, ['RACK_ENV=production', '--app', 'myapp'])

    expect(error?.message).to.include('Release lookup failed')
    expect(stderr).to.include('!')
    expect(stderr).not.to.include('done')
    expect(stdout).to.equal('')
  })

  it('errors without args', async function () {
    const {error} = await runCommand(ConfigSet, ['--app', 'myapp'])

    expect(error?.message).to.equal('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.')
    expect(error?.oclif?.exit).to.equal(1)
  })

  it('errors with invalid args', async function () {
    const {error} = await runCommand(ConfigSet, ['--app', 'myapp', 'WRONG'])

    expect(ansis.strip(error?.message || '')).to.equal('WRONG is invalid. Must be in the format FOO=bar.')
    expect(error?.oclif?.exit).to.equal(1)
  })
})
