import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/create'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'
import stripAnsi = require('strip-ansi')
import {getGeneration} from '../../../../src/lib/apps/generation'

describe('spaces:create', function () {
  const now = new Date()
  const features = ['one', 'two']

  afterEach(function () {
    nock.cleanAll()
  })

  it('creates a Standard space', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        features: features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
      })
      .reply(201, {
        shield: false,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        generation: 'cedar',
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
      Generation: cedar
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Standard Private Space Add-on cost warning', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        features: features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
      })
      .reply(201, {
        shield: false,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        generation: 'cedar',
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
    expect(stripAnsi(stderr.output)).to.include('Warning: Spend Alert. Each Heroku Standard Private Space costs ~$1.39/hour (max $1000/month), pro-rated to the second.')
  })

  it('creates a Shield space', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        features: features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        shield: true,
        team: 'my-team',
      })
      .reply(201, {
        shield: true,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        generation: 'cedar',
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
      Generation: cedar
      Created at: ${now.toISOString()}
    `)
  })

  it('shows Shield Private Space Add-on cost warning', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        features: features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        shield: true,
        team: 'my-team',
      })
      .reply(201, {
        shield: true,
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        features: ['one', 'two'],
        generation: 'cedar',
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

    expect(stripAnsi(stderr.output)).to.include('Warning: Spend Alert. Each Heroku Shield Private Space costs ~$4.17/hour (max $3000/month), pro-rated to the second.')
  })

  it('creates a space with custom cidr and data cidr', async function () {
    const api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        cidr: '10.0.0.0/24',
        data_cidr: '172.23.0.0/28',
        features: features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
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

  it('creates a fir space', async function () {
    const firSpace = {
      cidr: '10.0.0.0/16',
      created_at: now,
      data_cidr: '172.23.0.0/20',
      features: ['one', 'two'],
      generation: 'fir',
      name: 'my-space',
      region: {name: 'my-region'},
      shield: false,
      state: 'allocated',
      team: {name: 'my-team'},
    }
    nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
      .post('/spaces', {
        features: firSpace.features,
        generation: getGeneration(firSpace),
        name: firSpace.name,
        region: firSpace.region.name,
        team: firSpace.team.name,
      })
      .reply(201, firSpace)

    await runCommand(Cmd, [
      '--team',
      firSpace.team.name,
      '--space',
      firSpace.name,
      '--region',
      firSpace.region.name,
      '--features',
      firSpace.features.join(','),
      '--generation',
      getGeneration(firSpace)!,
    ])
    expect(stderr.output).to.include('Fir is currently a pilot service')
    expect(stdout.output).to.eq(heredoc`
      === ${firSpace.name}

      Team:       ${firSpace.team.name}
      Region:     ${firSpace.region.name}
      CIDR:       ${firSpace.cidr}
      Data CIDR:  ${firSpace.data_cidr}
      State:      ${firSpace.state}
      Shield:     off
      Generation: ${getGeneration(firSpace)!}
      Created at: ${now.toISOString()}
    `)
  })
})
