import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import strftime from 'strftime'
import stripAnsi from 'strip-ansi'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/ps/index.js'
import runCommand from '../../../helpers/runCommand.js'
import normalizeTableOutput from '../../../helpers/utils/normalizeTableOutput.js'

const heredoc = tsheredoc.default

const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)

function stubAccountQuota(code: number, body: Record<string, unknown>) {
  nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
    .get('/apps/myapp')
    .reply(200, {id: '6789', owner: {id: '1234'}, process_tier: 'eco'})
  nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
    .get('/apps/myapp/dynos')
    .reply(200, [{command: 'bash', name: 'run.1', size: 'Eco', state: 'up', type: 'run', updated_at: hourAgo}])
  nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
    .get('/account')
    .reply(200, {id: '1234'})
  nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}})
    .get('/accounts/1234/actions/get-quota')
    .reply(code, body)
}

function stubAppAndAccount() {
  nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
    .get('/apps/myapp')
    .reply(200, {id: '6789', owner: {id: '1234'}, process_tier: 'basic'})
  nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
    .get('/account')
    .reply(200, {id: '1234'})
}

describe('ps', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows dyno list', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {
          command: 'npm start',
          name: 'web.1',
          size: 'Eco',
          state: 'up',
          type: 'web',
          updated_at: hourAgo,
        },
        {
          command: 'bash',
          name: 'run.1',
          size: 'Eco',
          state: 'up',
          type: 'run',
          updated_at: hourAgo,
        },
      ])
    stubAppAndAccount()

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()

    expect(stdout.output).to.equal(heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

      === web (Eco): npm start (1)

      web.1: up ${hourAgoStr} (~ 1h ago)

    `)
    expect(stderr.output).to.equal('')
  })

  it('shows dyno list for Fir apps', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', name: 'web.4ed720fa31-ur8z1', size: '1X-Classic', state: 'up', type: 'web', updated_at: hourAgo},
        {command: 'npm start', name: 'web.4ed720fa31-5om2v', size: '1X-Classic', state: 'up', type: 'web', updated_at: hourAgo},
        {command: 'npm start ./worker.js', name: 'node-worker.4ed720fa31-w4llb', size: '2X-Compute', state: 'up', type: 'node-worker', updated_at: hourAgo},
      ])
    stubAppAndAccount()

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()

    expect(stdout.output).to.equal(heredoc`
      === node-worker (2X-Compute): npm start ./worker.js (1)

      node-worker.4ed720fa31-w4llb: up ${hourAgoStr} (~ 1h ago)

      === web (1X-Classic): npm start (2)

      web.4ed720fa31-5om2v: up ${hourAgoStr} (~ 1h ago)
      web.4ed720fa31-ur8z1: up ${hourAgoStr} (~ 1h ago)

    `)
    expect(stderr.output).to.equal('')
  })

  it('shows shield dynos in dyno list for apps in a shielded private space', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp')
      .reply(200, {space: {shield: true}})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', name: 'web.1', size: 'Private-M', state: 'up', type: 'web', updated_at: hourAgo},
        {command: 'bash', name: 'run.1', size: 'Private-L', state: 'up', type: 'run', updated_at: hourAgo},
      ])

    stubAppAndAccount()

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()

    expect(stdout.output).to.equal(heredoc`
      === run: one-off processes (1)

      run.1 (Shield-L): up ${hourAgoStr} (~ 1h ago): bash

      === web (Shield-M): npm start (1)

      web.1: up ${hourAgoStr} (~ 1h ago)

    `)
    expect(stderr.output).to.equal('')
  })

  it('errors when no dynos found', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', name: 'web.1', size: 'Eco', state: 'up', type: 'web', updated_at: hourAgo},
        {command: 'bash', name: 'run.1', size: 'Eco', state: 'up', type: 'run', updated_at: hourAgo},
      ])

    stubAppAndAccount()

    try {
      await runCommand(Cmd, [
        'foo',
        '--app',
        'myapp',
      ])
    } catch (error: any) {
      expect(stripAnsi(error.message)).to.include('No foo dynos on ⬢ myapp')
    }

    api.done()

    expect(stdout.output).to.equal('')
  })

  it('shows dyno list as json', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', name: 'web.1', size: 'Eco', state: 'up', type: 'web', updated_at: hourAgo},
      ])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--json',
    ])

    api.done()
    expect(JSON.parse(stdout.output)[0].command).to.equal('npm start')
    expect(stderr.output).to.equal('')
  })

  it('shows extended info', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [{
        command: 'npm start',
        extended: {
          az: 'us-east',
          execution_plane: 'execution_plane',
          fleet: 'fleet',
          instance: 'instance',
          ip: '10.0.0.1',
          port: 8000,
          region: 'us',
          route: 'da route',
        },
        id: '100',
        name: 'web.1',
        release: {id: '10', version: '40'},
        size: 'Eco',
        state: 'up',
        type: 'web',
        updated_at: hourAgo,
      }, {
        command: 'bash',
        extended: {
          az: 'us-east',
          execution_plane: 'execution_plane',
          fleet: 'fleet',
          instance: 'instance',
          ip: '10.0.0.2',
          port: 8000,
          region: 'us',
          route: 'da route',
        },
        id: '101',
        name: 'run.1',
        release: {id: '10', version: '40'},
        size: 'Eco',
        state: 'up',
        type: 'run',
        updated_at: hourAgo,
      }])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    api.done()

    expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`
      Id  Process State                                   Region Execution plane Fleet Instance Ip       Port Az      Release Command   Route    Size
      ─── ─────── ─────────────────────────────────────── ────── ─────────────── ───── ──────── ──────── ──── ─────── ─────── ───────── ──────── ────
      101 run.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.2 8000 us-east 40      bash      da route Eco
      100 web.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.1 8000 us-east 40      npm start da route Eco
    `))

    expect(stderr.output).to.equal('')
  })

  it('shows extended info for Private Space app', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [{
        command: 'npm start',
        extended: {
          az: null,
          execution_plane: null,
          fleet: null,
          instance: 'instance',
          ip: '10.0.0.1',
          port: null,
          region: 'us',
          route: null,
        },
        id: '100',
        name: 'web.1',
        release: {id: '10', version: '40'},
        size: 'Eco',
        state: 'up',
        type: 'web',
        updated_at: hourAgo,
      }, {
        command: 'bash',
        extended: {
          az: null,
          execution_plane: null,
          fleet: null,
          instance: 'instance',
          ip: '10.0.0.1',
          port: null,
          region: 'us',
          route: null,
        },
        id: '101',
        name: 'run.1',
        release: {id: '10', version: '40'},
        size: 'Eco',
        state: 'up',
        type: 'run',
        updated_at: hourAgo,
      }])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    api.done()

    expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`
      Id  Process State                                   Region Execution plane Fleet Instance Ip       Port Az Release Command   Route Size
      ─── ─────── ─────────────────────────────────────── ────── ─────────────── ───── ──────── ──────── ──── ── ─────── ───────── ───── ────
      101 run.1   up ${hourAgoStr} (~ 1h ago) us                           instance 10.0.0.1         40      bash            Eco
      100 web.1   up ${hourAgoStr} (~ 1h ago) us                           instance 10.0.0.1         40      npm start       Eco
    `))
    expect(stderr.output).to.equal('')
  })

  it('shows shield dynos in extended info if app is in a shielded private space', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {space: {shield: true}})
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [{
        command: 'npm start',
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'},
        id: 100,
        name: 'web.1',
        release: {id: '10', version: '40'},
        size: 'Private-M',
        state: 'up',
        type: 'web',
        updated_at: hourAgo,
      }, {
        command: 'bash',
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'},
        id: 101,
        name: 'run.1',
        release: {id: '10', version: '40'},
        size: 'Private-L',
        state: 'up',
        type: 'run',
        updated_at: hourAgo,
      }])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    api.done()

    expect(normalizeTableOutput(stdout.output)).to.equal(normalizeTableOutput(`
      Id  Process State                                   Region Execution plane Fleet Instance Ip       Port Az      Release Command   Route    Size
      ─── ─────── ─────────────────────────────────────── ────── ─────────────── ───── ──────── ──────── ──── ─────── ─────── ───────── ──────── ────────
      101 run.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.2 8000 us-east 40      bash      da route Shield-L
      100 web.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.1 8000 us-east 40      npm start da route Shield-M
    `))
    expect(stderr.output).to.equal('')
  })

  it('shows eco quota remaining', async function () {
    const ecoExpression = heredoc`
      Eco dyno hours quota remaining this month: 0h 16m (99%)
      Eco dyno usage for this app: 0h 0m (0%)
      For more information on Eco dyno hours, see:
      https://devcenter.heroku.com/articles/eco-dyno-hours

      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(200, {account_quota: 1000, apps: [], quota_used: 1})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('shows eco quota remaining in hours and minutes', async function () {
    const ecoExpression = heredoc`
      Eco dyno hours quota remaining this month: 950h 30m (95%)
      Eco dyno usage for this app: 0h 0m (0%)
      For more information on Eco dyno hours, see:
      https://devcenter.heroku.com/articles/eco-dyno-hours

      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(200, {account_quota: 3600000, apps: [], quota_used: 178200})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('shows eco quota usage of eco apps', async function () {
    const ecoExpression = heredoc`
      Eco dyno hours quota remaining this month: 950h 30m (95%)
      Eco dyno usage for this app: 49h 30m (4%)
      For more information on Eco dyno hours, see:
      https://devcenter.heroku.com/articles/eco-dyno-hours

      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(200, {account_quota: 3600000, apps: [{app_uuid: '6789', quota_used: 178200}], quota_used: 178200})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('shows eco quota remaining even when account_quota is zero', async function () {
    const ecoExpression = heredoc`
      Eco dyno hours quota remaining this month: 0h 0m (0%)
      Eco dyno usage for this app: 0h 0m (0%)
      For more information on Eco dyno hours, see:
      https://devcenter.heroku.com/articles/eco-dyno-hours

      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(200, {account_quota: 0, apps: [], quota_used: 0})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('handles quota 404 properly', async function () {
    const ecoExpression = heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(404, {id: 'not_found'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('handles quota 200 not_found properly', async function () {
    const ecoExpression = heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(200, {id: 'not_found'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('does not print out for apps that are not owned', async function () {
    nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp')
      .reply(200, {
        owner: {id: '5678'}, process_tier: 'eco',
      })
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}})
      .get('/accounts/1234/actions/get-quota')
      .reply(200, {account_quota: 1000, apps: [], quota_used: 1})
    const dynos = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [{command: 'bash', name: 'run.1', size: 'Eco', state: 'up', type: 'run', updated_at: hourAgo}])
    const ecoExpression = heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    dynos.done()

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('does not print out for non-eco apps', async function () {
    nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/account')
      .reply(200, {id: '1234'})
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp')
      .reply(200, {owner: {id: 1234}, process_tier: 'eco'})
    const dynos = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [{command: 'bash', name: 'run.1', size: 'Eco', state: 'up', type: 'run', updated_at: hourAgo}])
    const ecoExpression = heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    dynos.done()

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('traps errors properly', async function () {
    const ecoExpression = heredoc`
      === run: one-off processes (1)

      run.1 (Eco): up ${hourAgoStr} (~ 1h ago): bash

    `
    stubAccountQuota(503, {id: 'server_error'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    expect(stdout.output).to.equal(ecoExpression)
    expect(stderr.output).to.equal('')
  })

  it('logs to stdout and exits zero when no dynos', async function () {
    const dynos = nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .get('/apps/myapp/dynos')
      .reply(200, [])
    stubAppAndAccount()

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    dynos.done()

    expect(stdout.output).to.equal('No dynos on ⬢ myapp\n')
    expect(stderr.output).to.equal('')
  })
})
