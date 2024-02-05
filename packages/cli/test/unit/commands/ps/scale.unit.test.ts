import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/ps/scale'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('ps:scale', () => {
  afterEach(() => nock.cleanAll())

  it('shows formation with no args', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal('web=1:Free worker=2:Free\n')
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('shows formation with shield dynos for apps in a shielded private space', async () => {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp/formation')
      .reply(200, [{type: 'web', quantity: 1, size: 'Private-L'}, {type: 'worker', quantity: 2, size: 'Private-M'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal('web=1:Shield-L worker=2:Shield-M\n')
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('errors with no process types', async () => {
    const api = nock('https://api.heroku.com')
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
      expect(stripAnsi(error.message)).to.include('No process types on myapp.')
    }

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.equal('')
    api.done()
  })

  it('scales web=1 worker=2', async () => {
    const api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1'}, {type: 'worker', quantity: '2'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Free'}, {type: 'worker', quantity: 2, size: 'Free'}])
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
    api.done()
  })

  it('scales up a shield dyno if the app is in a shielded private space', async () => {
    const api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '1', size: 'Private-L'}]})
      .reply(200, [{type: 'web', quantity: 1, size: 'Private-L'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp', space: {shield: true}})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web=1:Shield-L',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Scaling dynos... done, now running web at 1:Shield-L\n')
    api.done()
  })

  it('scales web-1', async () => {
    const api = nock('https://api.heroku.com:443')
      .patch('/apps/myapp/formation', {updates: [{type: 'web', quantity: '+1'}]})
      .reply(200, [{type: 'web', quantity: 2, size: 'Free'}])
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'web+1',
    ])

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Scaling dynos... done, now running web at 2:Free\n')
    api.done()
  })
})
