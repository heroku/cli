import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/addons/upgrade'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {AddOn} from '@heroku-cli/schema'
import {expect} from 'chai'
import {afterEach} from 'mocha'
import * as chalk from 'chalk'

describe('addons:upgrade', () => {
  let api: ReturnType<typeof nock>
  const {level} = chalk.default
  beforeEach(() => {
    chalk.default.level = 0
    api = nock('https://api.heroku.com:443')
  })
  afterEach(() => {
    chalk.default.level = level
    api.done()
    nock.cleanAll()
  })

  it('upgrades an add-on', async () => {
    const addon: AddOn = {
      name: 'kafka-swiftly-123',
      addon_service: {name: 'heroku-kafka'},
      app: {name: 'myapp'},
      plan: {name: 'premium-0'},
    }
    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-kafka'})
      .reply(200, [addon])
      .patch('/apps/myapp/addons/kafka-swiftly-123', {plan: {name: 'heroku-kafka:hobby'}})
      .reply(200, {plan: {price: {cents: 0}}, provision_message: 'provision msg'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:hobby',
    ])
    expect(stdout.output).to.equal('provision msg\n')
    expect(stderr.output).to.contain('Changing kafka-swiftly-123 on myapp from premium-0 to heroku-kafka:hobby... done, free\n')
  })

  it('displays hourly and monthly price when upgrading an add-on', async () => {
    const addon: AddOn = {
      name: 'kafka-swiftly-123',
      addon_service: {name: 'heroku-kafka'},
      app: {name: 'myapp'},
      plan: {name: 'premium-0'},
    }

    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-kafka'})
      .reply(200, [addon])
      .patch('/apps/myapp/addons/kafka-swiftly-123', {plan: {name: 'heroku-kafka:standard'}})
      .reply(200, {plan: {price: {cents: 2500, unit: 'month'}}, provision_message: 'provision msg'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:standard',
    ])
    expect(stdout.output).to.equal('provision msg\n')
    expect(stderr.output).to.contain('Changing kafka-swiftly-123 on myapp from premium-0 to heroku-kafka:standard... done, ~$0.035/hour (max $25/month)\n')
  })

  it('does not display a price when upgrading an add-on and no price is returned from the api', async () => {
    const addon = {
      name: 'kafka-swiftly-123',
      addon_service: {name: 'heroku-kafka'},
      app: {name: 'myapp'},
      plan: {name: 'premium-0'},
    }

    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-kafka'})
      .reply(200, [addon])
      .patch('/apps/myapp/addons/kafka-swiftly-123', {plan: {name: 'heroku-kafka:hobby'}})
      .reply(200, {plan: {}, provision_message: 'provision msg'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-kafka',
      'heroku-kafka:hobby',
    ])
    expect(stdout.output).to.equal('provision msg\n')
    expect(stderr.output).to.contain('Changing kafka-swiftly-123 on myapp from premium-0 to heroku-kafka:hobby... done\n')
  })

  it('upgrades to a contract add-on', async () => {
    const addon = {
      name: 'connect-swiftly-123',
      addon_service: {name: 'heroku-connect'},
      app: {name: 'myapp'},
      plan: {name: 'free'},
    }

    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-connect'})
      .reply(200, [addon])
      .patch('/apps/myapp/addons/connect-swiftly-123', {plan: {name: 'heroku-connect:contract'}})
      .reply(200, {plan: {price: {cents: 0, contract: true}}, provision_message: 'provision msg'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-connect',
      'heroku-connect:contract',
    ])
    expect(stdout.output).to.equal('provision msg\n')
    expect(stderr.output).to.contain('Changing connect-swiftly-123 on myapp from free to heroku-connect:contract... done, contract\n')
  })

  it('upgrades an add-on with only one argument', async () => {
    const addon = {
      name: 'postgresql-swiftly-123',
      addon_service: {name: 'heroku-postgresql'},
      app: {name: 'myapp'},
      plan: {name: 'premium-0'},
    }
    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-postgresql'})
      .reply(200, [addon])
      .patch('/apps/myapp/addons/postgresql-swiftly-123', {plan: {name: 'heroku-postgresql:hobby'}})
      .reply(200, {plan: {price: {cents: 0}}})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'heroku-postgresql:hobby',
    ])
    expect(stdout.output, 'to be empty')
    expect(stderr.output).to.contain('Changing postgresql-swiftly-123 on myapp from premium-0 to heroku-postgresql:hobby... done, free\n')
  })

  it('errors with no plan', async () => {
    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'heroku-redis',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('Error: No plan specified')
      }
    }
  })

  it('errors with invalid plan', async () => {
    const addon = {
      name: 'db1-swiftly-123',
      addon_service: {name: 'heroku-db1'},
      app: {name: 'myapp'},
      plan: {name: 'premium-0'},
    }

    api
      .post('/actions/addons/resolve', {app: 'myapp', addon: 'heroku-db1'})
      .reply(200, [addon])
      .get('/addon-services/heroku-db1/plans')
      .reply(200, [
        {name: 'heroku-db1:free', plan: {cents: 0}},
        {name: 'heroku-db1:basic', plan: {cents: 25}},
        {name: 'heroku-db1:premium-0', price: {cents: 3500}},
      ])
      .patch('/apps/myapp/addons/db1-swiftly-123', {plan: {name: 'heroku-db1:invalid'}})
      .reply(422, {message: 'Couldn\'t find either the add-on service or the add-on plan of "heroku-db1:invalid".'})

    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'heroku-db1:invalid',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.equal('Couldn\'t find either the add-on service or the add-on plan of "heroku-db1:invalid".\n\nHere are the available plans for heroku-db1:\nheroku-db1:free\nheroku-db1:basic\nheroku-db1:premium-0\n\nSee more plan information with heroku addons:plans heroku-db1\n\nhttps://devcenter.heroku.com/articles/managing-add-ons')
      }
    }
  })

  it('handles multiple add-ons', async () => {
    api.post('/actions/addons/resolve', {app: null, addon: 'heroku-redis'})
      .reply(200, [{name: 'db1-swiftly-123'}, {name: 'db1-swiftly-456'}])
    try {
      await runCommand(Cmd, [
        'heroku-redis:invalid',
      ])
    } catch (error) {
      if (error instanceof Error) {
        expect(error.message).to.contain('multiple matching add-ons found')
      }
    }
  })
})
