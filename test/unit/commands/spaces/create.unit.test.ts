import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/spaces/create.js'
import {getGeneration} from '../../../../src/lib/apps/generation.js'
import runCommand from '../../../helpers/runCommand.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

const heredoc = tsheredoc.default

describe('spaces:create', function () {
  const now = new Date()
  const features = ['one', 'two']
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com', {reqheaders: {Accept: 'application/vnd.heroku+json; version=3.sdk'}})
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('creates a Standard space', async function () {
    api
      .post('/spaces', {
        features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
      })
      .reply(201, {
        cidr: '10.0.0.0/16',
        created_at: now,
        data_cidr: '172.23.0.0/20',
        features: ['one', 'two'],
        generation: 'cedar',
        name: 'my-space',
        region: {name: 'my-region'},
        shield: false,
        state: 'allocated',
        team: {name: 'my-team'},
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    expect(stdout.output).to.eq(heredoc`
      === ⬡ my-space

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
    api
      .post('/spaces', {
        features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
      })
      .reply(201, {
        cidr: '10.0.0.0/16',
        created_at: now,
        data_cidr: '172.23.0.0/20',
        features: ['one', 'two'],
        generation: 'cedar',
        name: 'my-space',
        region: {name: 'my-region'},
        shield: false,
        state: 'allocated',
        team: {name: 'my-team'},
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
    ])

    expect(unwrap(stderr.output)).to.include('Warning: Spend Alert. Each Heroku Standard Private Space costs ~$1.39/hour (max $1000/month), pro-rated to the second.')
  })

  it('creates a Shield space', async function () {
    api
      .post('/spaces', {
        features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        shield: true,
        team: 'my-team',
      })
      .reply(201, {
        cidr: '10.0.0.0/16',
        created_at: now,
        data_cidr: '172.23.0.0/20',
        features: ['one', 'two'],
        generation: 'cedar',
        name: 'my-space',
        region: {name: 'my-region'},
        shield: true,
        state: 'allocated',
        team: {name: 'my-team'},
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    expect(stdout.output).to.eq(heredoc`
      === ⬡ my-space

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
    api
      .post('/spaces', {
        features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        shield: true,
        team: 'my-team',
      })
      .reply(201, {
        cidr: '10.0.0.0/16',
        created_at: now,
        data_cidr: '172.23.0.0/20',
        features: ['one', 'two'],
        generation: 'cedar',
        name: 'my-space',
        region: {name: 'my-region'},
        shield: true,
        state: 'allocated',
        team: {name: 'my-team'},
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--shield',
    ])

    expect(unwrap(stderr.output)).to.include('Warning: Spend Alert. Each Heroku Shield Private Space costs ~$4.17/hour (max $3000/month), pro-rated to the second.')
  })

  it('creates a space with custom cidr and data cidr', async function () {
    api
      .post('/spaces', {
        cidr: '10.0.0.0/24',
        data_cidr: '172.23.0.0/28',
        features,
        generation: 'cedar',
        name: 'my-space',
        region: 'my-region',
        team: 'my-team',
      })
      .reply(201, {
        cidr: '10.0.0.0/24',
        created_at: now,
        data_cidr: '172.23.0.0/28',
        features: ['one', 'two'],
        name: 'my-space',
        region: {name: 'my-region'},
        shield: false,
        state: 'allocated',
        team: {name: 'my-team'},
      })

    await runCommand(Cmd, [
      '--team=my-team',
      '--space=my-space',
      '--region=my-region',
      '--features=one, two',
      '--cidr=10.0.0.0/24',
      '--data-cidr=172.23.0.0/28',
    ])

    expect(stdout.output).to.eq(heredoc`
      === ⬡ my-space

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
    api
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
    expect(stdout.output).to.eq(heredoc`
      === ⬡ ${firSpace.name}

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
