'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')

const addon = {
  id: 1,
  name: 'postgres-1',
  app: {name: 'myapp'},
  config_vars: ['READONLY_URL', 'DATABASE_URL', 'HEROKU_POSTGRESQL_RED_URL'],
  plan: {name: 'heroku-postgresql:standard-0'},
}

const attachment = {
  name: 'HEROKU_POSTGRESQL_RED',
  app: {name: 'myapp'},
  addon,
}

const db = {
  id: 1,
  name: 'postgres-1',
  plan: {name: 'heroku-postgresql:standard-0'},
}
const fetcher = () => {
  return {
    addon: () => db,
  }
}

let settingsResult
let settingsResultName
let settingResult

const setupSettingsMockData = (cmd, settingValue = 'test_value') => {
  settingsResult = {baseKey: {
    value: settingValue,
    values: {
      test_value: 'foobar',
    },
  }}

  let tempValue = settingsResult.baseKey
  settingsResult[cmd] = tempValue
  delete settingsResult.baseKey

  settingsResultName = Object.keys(settingsResult)[0].replace(/_/g, '-')
  settingResult = settingsResult[`${cmd}`]
}

describe('pg:settings', () => {
  let cmd
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://api.data.heroku.com')
    api.post('/actions/addon-attachments/resolve', {
      addon_attachment: 'test-database',
      addon_service: 'heroku-postgresql',
    }).reply(200, [attachment])
    cli.mockConsole()
  })

  afterEach(() => {
    nock.cleanAll()
    api.done()
    pg.done()
  })

  it('shows settings for log_statements', () => {
    setupSettingsMockData('log_statement')
    cmd = proxyquire('../../../../commands/settings/log_statement', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`${settingsResultName} is set to ${settingResult.value} for postgres-1.\n${settingResult.values[settingResult.value]}\n`))
  })

  it('shows settings for track_functions', () => {
    setupSettingsMockData('track_functions')
    cmd = proxyquire('../../../../commands/settings/track_functions', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal(`${settingsResultName} is set to ${settingResult.value} for postgres-1.\n${settingResult.values[settingResult.value]}\n`))
  })

  it('shows settings for auto_explain_log_nested_statements with value', () => {
    setupSettingsMockData('auto_explain.log_nested_statements')
    cmd = proxyquire('../../../../commands/settings/auto_explain_log_nested_statements', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('auto-explain.log-nested-statements is set to test_value for postgres-1.\nNested statements will be included in execution plan logs.\n'))
  })

  it('shows settings for auto_explain_log_nested_statements with no value', () => {
    setupSettingsMockData('auto_explain.log_nested_statements', '')
    cmd = proxyquire('../../../../commands/settings/auto_explain_log_nested_statements', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('auto-explain.log-nested-statements is set to  for postgres-1.\nOnly top-level execution plans will be included in logs.\n'))
  })

  it('shows settings for auto_explain_log_triggers with value', () => {
    setupSettingsMockData('auto_explain.log_triggers')
    cmd = proxyquire('../../../../commands/settings/auto_explain_log_triggers', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('auto-explain.log-triggers is set to test_value for postgres-1.\nTrigger execution statistics have been enabled for auto_explain.\n'))
  })

  it('shows settings for auto_explain_log_triggers with no value', () => {
    setupSettingsMockData('auto_explain.log_triggers', '')
    cmd = proxyquire('../../../../commands/settings/auto_explain_log_triggers', {
      settings: proxyquire.noCallThru().load('../../../../lib/setter', {
        './fetcher': fetcher,
      }),
    })
    pg.get('/postgres/v0/databases/1/config').reply(200, settingsResult)
    return cmd.run({args: {database: 'test-database', value: ''}, flags: {}})
      .then(() => expect(cli.stdout).to.equal('auto-explain.log-triggers is set to  for postgres-1.\nTrigger execution statistics have been disabled for auto_explain.\n'))
  })
})
