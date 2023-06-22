'use strict'
/* global beforeEach afterEach */

const cli = require('heroku-cli-util')
const {expect} = require('chai')
const nock = require('nock')
const proxyquire = require('proxyquire')
const sinon = require('sinon')

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

describe.only('pg:settings', () => {
  let cmd
  let api
  let pg

  beforeEach(() => {
    api = nock('https://api.heroku.com')
    pg = nock('https://postgres-api.heroku.com')
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
})
