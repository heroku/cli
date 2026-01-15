import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import stripAnsi from 'strip-ansi'

import Cmd from '../../../../src/commands/ps/scale.js'
import runCommand from '../../../helpers/runCommand.js'

describe('ps:scale', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows formation with no args', async function () {
    api
      .get('/apps/myapp/formation')
      .reply(200, [{quantity: 1, size: 'Free', type: 'web'}, {quantity: 2, size: 'Free', type: 'worker'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal('web=1:Free worker=2:Free\n')
    expect(stderr.output).to.equal('')
  })

  it('shows formation with shield dynos for apps in a shielded private space', async function () {
    api
      .get('/apps/myapp/formation')
      .reply(200, [{quantity: 1, size: 'Private-L', type: 'web'}, {quantity: 2, size: 'Private-M', type: 'worker'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal('web=1:Shield-L worker=2:Shield-M\n')
    expect(stderr.output).to.equal('')
  })

  it('errors with no process types', async function () {
    api
      .get('/apps/myapp/formation')
      .reply(200, [])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])
    } catch (error: any) {
      expect(stripAnsi(error.message)).to.include('No process types on ⬢ myapp.')
    }

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
  })

  it('scales web=1 worker=2', async function () {
    api
      .patch('/apps/myapp/formation', {updates: [{quantity: '1', type: 'web'}, {quantity: '2', type: 'worker'}]})
      .reply(200, [{quantity: 1, size: 'Free', type: 'web'}, {quantity: 2, size: 'Free', type: 'worker'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=1',
      'worker=2',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Scaling dynos... done, now running web at 1:Free, worker at 2:Free\n')
  })

  it('scales up a shield dyno if the app is in a shielded private space', async function () {
    api
      .patch('/apps/myapp/formation', {updates: [{quantity: '1', size: 'Private-L', type: 'web'}]})
      .reply(200, [{quantity: 1, size: 'Private-L', type: 'web'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=1:Shield-L',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Scaling dynos... done, now running web at 1:Shield-L\n')
  })

  it('scales web-1', async function () {
    api
      .patch('/apps/myapp/formation', {updates: [{quantity: '+1', type: 'web'}]})
      .reply(200, [{quantity: 2, size: 'Free', type: 'web'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web+1',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Scaling dynos... done, now running web at 2:Free\n')
  })
})
