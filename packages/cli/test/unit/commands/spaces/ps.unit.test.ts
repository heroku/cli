import {expect} from '@oclif/test'
import nock from 'nock'
import {stdout} from 'stdout-stderr'
import strftime from 'strftime'
import tsheredoc from 'tsheredoc'
import Cmd from '../../../../src/commands/spaces/ps.js'
import runCommand from '../../../helpers/runCommand.js'

const heredoc = tsheredoc.default

const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)
const spaceDynos = [
  {
    app_id: 'app_id1', app_name: 'app_name1', dynos: [
      {
        command: 'npm start',
        size: 'Free',
        name: 'web.1',
        type: 'web',
        updated_at: hourAgoStr,
        state: 'up',
      }, {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgoStr, state: 'up'},
    ],
  }, {
    app_id: 'app_id2', app_name: 'app_name2', dynos: [
      {
        command: 'npm start',
        size: 'Free',
        name: 'web.1',
        type: 'web',
        updated_at: hourAgoStr,
        state: 'up',
      }, {command: 'bash', size: 'Free', name: 'run.1', type: 'run', updated_at: hourAgoStr, state: 'up'},
    ],
  },
]
const privateDynos = [
  {
    app_id: 'app_id1', app_name: 'app_name1', dynos: [
      {command: 'npm start', size: 'Private-M', name: 'web.1', type: 'web', updated_at: hourAgoStr, state: 'up'},
    ],
  },
]

describe('spaces:ps', function () {
  let api: nock.Scope
  let apiSpace: nock.Scope

  afterEach(function () {
    api.done()
    apiSpace.done()
  })

  it('shows space dynos', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})
    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout.output).to.equal(heredoc(`
    === app_name1 web (Free): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    === app_name1 run: one-off processes (1)

    run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

    === app_name2 web (Free): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    === app_name2 run: one-off processes (1)

    run.1 (Free): up ${hourAgoStr} (~ 1h ago): bash

    `))
  })

  it('shows shield space dynos', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: true})
    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout.output).to.equal(heredoc(`
    === app_name1 web (Shield-M): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    `))
  })

  it('shows private space dynos', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})
    await runCommand(Cmd, [
      '--space',
      'my-space',
    ])
    expect(stdout.output).to.equal(heredoc(`
    === app_name1 web (Private-M): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    `))
  })

  it('shows space dynos with --json', async function () {
    api = nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    apiSpace = nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})
    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--json',
    ])
    expect(JSON.parse(stdout.output)).to.eql(spaceDynos)
  })
})
