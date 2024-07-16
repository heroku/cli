import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/ps/index'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import * as strftime from 'strftime'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')

const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)

function stubAccountQuota(code: number, body: Record<string, unknown>) {
  nock('https://api.heroku.com', {reqheaders: {accept: 'application/vnd.heroku+json; version=3.process-tier'}})
    .get('/apps/myapp')
    .reply(200, {process_tier: 'eco', owner: {id: '1234'}, id: '6789'})
  nock('https://api.heroku.com')
    .get('/apps/myapp/dynos')
    .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
  nock('https://api.heroku.com')
    .get('/account')
    .reply(200, {id: '1234'})
  nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}})
    .get('/accounts/1234/actions/get-quota')
    .reply(code, body)
}

function stubAppAndAccount() {
  nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.process-tier'}})
    .get('/apps/myapp')
    .reply(200, {process_tier: 'basic', owner: {id: '1234'}, id: '6789'})
  nock('https://api.heroku.com')
    .get('/account')
    .reply(200, {id: '1234'})
}

describe('ps', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows dyno list', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
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

  it('shows shield dynos in dyno list for apps in a shielded private space', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp')
      .reply(200, {space: {shield: true}})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Private-L', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
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
    const api = nock('https://api.heroku.com')
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
        {command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'},
      ])

    stubAppAndAccount()

    try {
      await runCommand(Cmd, [
        'foo',
        '--app',
        'myapp',
      ])
    } catch (error: any) {
      expect(stripAnsi(error.message)).to.include('No foo dynos on myapp')
    }

    api.done()

    expect(stdout.output).to.equal('')
  })

  it('shows dyno list as json', async function () {
    const api = nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .get('/apps/myapp/dynos')
      .reply(200, [
        {command: 'npm start', size: 'Eco', name: 'web.1', type: 'web', updated_at: hourAgo, state: 'up'},
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
    const api = nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {name: 'myapp'})
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [{
        id: '100',
        command: 'npm start',
        size: 'Eco',
        name: 'web.1',
        type: 'web',
        updated_at: hourAgo,
        state: 'up',
        release: {id: '10', version: '40'},
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'},
      }, {
        id: '101',
        command: 'bash',
        size: 'Eco',
        name: 'run.1',
        type: 'run',
        updated_at: hourAgo,
        state: 'up',
        release: {id: '10', version: '40'},
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'},
      }])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    api.done()

    expect(heredoc(stdout.output)).to.equal(heredoc`
      Id  Process State                                   Region Execution plane Fleet Instance Ip       Port Az      Release Command   Route    Size 
      ─── ─────── ─────────────────────────────────────── ────── ─────────────── ───── ──────── ──────── ──── ─────── ─────── ───────── ──────── ──── 
      101 run.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.2 8000 us-east 40      bash      da route Eco  
      100 web.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.1 8000 us-east 40      npm start da route Eco  
    `)
    expect(stderr.output).to.equal('')
  })

  it('shows shield dynos in extended info if app is in a shielded private space', async function () {
    const api = nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {id: '1234'})
      .get('/apps/myapp')
      .reply(200, {space: {shield: true}})
      .get('/apps/myapp/dynos?extended=true')
      .reply(200, [{
        id: 100,
        command: 'npm start',
        size: 'Private-M',
        name: 'web.1',
        type: 'web',
        updated_at: hourAgo,
        state: 'up',
        release: {id: '10', version: '40'},
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.1', port: 8000, az: 'us-east', route: 'da route'},
      }, {
        id: 101,
        command: 'bash',
        size: 'Private-L',
        name: 'run.1',
        type: 'run',
        updated_at: hourAgo,
        state: 'up',
        release: {id: '10', version: '40'},
        extended: {region: 'us', execution_plane: 'execution_plane', fleet: 'fleet', instance: 'instance', ip: '10.0.0.2', port: 8000, az: 'us-east', route: 'da route'},
      }])

    await runCommand(Cmd, [
      '--app',
      'myapp',
      '--extended',
    ])

    api.done()

    expect(heredoc(stdout.output)).to.equal(heredoc`
      Id  Process State                                   Region Execution plane Fleet Instance Ip       Port Az      Release Command   Route    Size     
      ─── ─────── ─────────────────────────────────────── ────── ─────────────── ───── ──────── ──────── ──── ─────── ─────── ───────── ──────── ──────── 
      101 run.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.2 8000 us-east 40      bash      da route Shield-L 
      100 web.1   up ${hourAgoStr} (~ 1h ago) us     execution_plane fleet instance 10.0.0.1 8000 us-east 40      npm start da route Shield-M 
    `)
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
    stubAccountQuota(200, {account_quota: 1000, quota_used: 1, apps: []})

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
    stubAccountQuota(200, {account_quota: 3600000, quota_used: 178200, apps: []})

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
    stubAccountQuota(200, {account_quota: 3600000, quota_used: 178200, apps: [{app_uuid: '6789', quota_used: 178200}]})

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
    stubAccountQuota(200, {account_quota: 0, quota_used: 0, apps: []})

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
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {id: '1234'})
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.process-tier'}})
      .get('/apps/myapp')
      .reply(200, {
        process_tier: 'eco', owner: {id: '5678'},
      })
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.account-quotas'}})
      .get('/accounts/1234/actions/get-quota')
      .reply(200, {account_quota: 1000, quota_used: 1, apps: []})
    const dynos = nock('https://api.heroku.com')
      .get('/apps/myapp/dynos')
      .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
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
    nock('https://api.heroku.com')
      .get('/account')
      .reply(200, {id: '1234'})
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.process-tier'}})
      .get('/apps/myapp')
      .reply(200, {process_tier: 'eco', owner: {id: 1234}})
    const dynos = nock('https://api.heroku.com')
      .get('/apps/myapp/dynos')
      .reply(200, [{command: 'bash', size: 'Eco', name: 'run.1', type: 'run', updated_at: hourAgo, state: 'up'}])
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
    const dynos = nock('https://api.heroku.com')
      .get('/apps/myapp/dynos')
      .reply(200, [])
    stubAppAndAccount()

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    dynos.done()

    expect(stdout.output).to.equal('No dynos on myapp\n')
    expect(stderr.output).to.equal('')
  })
})
