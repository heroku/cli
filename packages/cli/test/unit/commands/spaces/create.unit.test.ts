import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/create'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import {CLIError} from '@oclif/core/lib/errors'

describe('spaces:create', function () {
  const now = new Date()
  const features = ['one', 'two']

  afterEach(() => {
    nock.cleanAll()
  })

  it('creates a Standard space', async () => {
    const api = nock('https://api.heroku.com')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
      })
      .reply(201, {
        shield: false,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        state: 'allocated',
        created_at: now,
        cidr: '10.0.0.0/16',
        data_cidr: '172.23.0.0/20',
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    api.done()

    expect(stdout.output).to.eq(heredoc`
      === my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/16
      Data CIDR:  172.23.0.0/20
      State:      allocated
      Shield:     off
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Standard Private Space Add-on cost warning', async () => {
    const api = nock('https://api.heroku.com')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
      })
      .reply(201, {
        shield: false,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        state: 'allocated',
        created_at: now,
        cidr: '10.0.0.0/16',
        data_cidr: '172.23.0.0/20',
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    api.done()

    expect(stderr.output).to.include('Warning: Spend Alert. During the limited GA period, each Heroku Standard')
    expect(stderr.output).to.include('Private Space costs ~$1.39/hour (max $1000/month), pro-rated to the')
    expect(stderr.output).to.include('second.')
  })

  it('creates a Shield space', async () => {
    const api = nock('https://api.heroku.com')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
        shield: true,
      })
      .reply(201, {
        shield: true,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        state: 'allocated',
        created_at: now,
        cidr: '10.0.0.0/16',
        data_cidr: '172.23.0.0/20',
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    api.done()

    expect(stdout.output).to.eq(heredoc`
      === my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/16
      Data CIDR:  172.23.0.0/20
      State:      allocated
      Shield:     on
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Shield Private Space Add-on cost warning', async () => {
    const api = nock('https://api.heroku.com')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        features: features,
        shield: true,
      })
      .reply(201, {
        shield: true,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        state: 'allocated',
        created_at: now,
        cidr: '10.0.0.0/16',
        data_cidr: '172.23.0.0/20',
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    api.done()

    expect(stderr.output).to.include('Warning: Spend Alert. During the limited GA period, each Heroku Shield')
    expect(stderr.output).to.include('Private Space costs ~$4.17/hour (max $3000/month), pro-rated to the')
    expect(stderr.output).to.include('second.')
  })

  it('creates a space with custom cidr and data cidr', async () => {
    const api = nock('https://api.heroku.com')
      .post('/spaces', {
        name: 'my-space',
        team: 'my-team',
        region: 'my-region',
        cidr: '10.0.0.0/24',
        data_cidr: '172.23.0.0/28',
        features: features,
      })
      .reply(201, {
        shield: false,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        state: 'allocated',
        created_at: now,
        cidr: '10.0.0.0/24',
        data_cidr: '172.23.0.0/28',
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--cidr=10.0.0.0/24',
      '--data-cidr=172.23.0.0/28',
    ])

    api.done()

    expect(stdout.output).to.eq(heredoc`
      === my-space

      Team:       my-team
      Region:     my-region
      CIDR:       10.0.0.0/24
      Data CIDR:  172.23.0.0/28
      State:      allocated
      Shield:     off
      Created at: ${now.toISOString()}
    `)
  })

  it('create fails without team name', async () => {
    try {
      await runCommand(Cmd, [
        '--space=my-space',
        '--region=my-region',
      ])
    } catch (error) {
      const {message} = error as CLIError
      expect(message).to.eq('No team specified')
    }
  })
})
