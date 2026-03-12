import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Ps from '../../../../src/commands/spaces/ps.js'
import {ago} from '../../../../src/lib/time.js'
import {runCommand} from '../../../helpers/run-command.js'

const heredoc = tsheredoc.default

describe('spaces:ps', function () {
  let hourAgo: Date
  let hourAgoStr: string
  let spaceDynos: any[]
  let privateDynos: any[]

  before(function () {
    process.env.TZ = 'UTC'
    hourAgo = new Date(Date.now() - (60 * 60 * 1000))
    hourAgoStr = ago(hourAgo)
    spaceDynos = [
      {
        app_id: 'app_id1', app_name: 'app_name1', dynos: [
          {
            command: 'npm start',
            name: 'web.1',
            size: 'Free',
            state: 'up',
            type: 'web',
            updated_at: hourAgo,
          }, {
            command: 'bash',
            name: 'run.1',
            size: 'Free',
            state: 'up',
            type: 'run',
            updated_at: hourAgo,
          },
        ],
      }, {
        app_id: 'app_id2', app_name: 'app_name2', dynos: [
          {
            command: 'npm start',
            name: 'web.1',
            size: 'Free',
            state: 'up',
            type: 'web',
            updated_at: hourAgo,
          }, {
            command: 'bash',
            name: 'run.1',
            size: 'Free',
            state: 'up',
            type: 'run',
            updated_at: hourAgo,
          },
        ],
      },
    ]
    privateDynos = [
      {
        app_id: 'app_id1', app_name: 'app_name1', dynos: [
          {
            command: 'npm start',
            name: 'web.1',
            size: 'Private-M',
            state: 'up',
            type: 'web',
            updated_at: hourAgo,
          },
        ],
      },
    ]
  })

  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows space dynos', async function () {
    api
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    api
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(Ps, ['--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === app_name1 web (Free): npm start (1)

    web.1: up ${hourAgoStr}

    === app_name1 run: one-off processes (1)

    run.1 (Free): up ${hourAgoStr}: bash

    === app_name2 web (Free): npm start (1)

    web.1: up ${hourAgoStr}

    === app_name2 run: one-off processes (1)

    run.1 (Free): up ${hourAgoStr}: bash

    `))
  })

  it('shows shield space dynos', async function () {
    api
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    api
      .get('/spaces/my-space')
      .reply(200, {shield: true})

    const {stdout} = await runCommand(Ps, ['--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === app_name1 web (Shield-M): npm start (1)

    web.1: up ${hourAgoStr}

    `))
  })

  it('shows private space dynos', async function () {
    api
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    api
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(Ps, ['--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === app_name1 web (Private-M): npm start (1)

    web.1: up ${hourAgoStr}

    `))
  })

  it('shows space dynos with --json', async function () {
    api
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    api
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(Ps, ['--space', 'my-space', '--json'])

    const parsed = JSON.parse(stdout)
    // Convert Date objects to ISO strings for comparison
    const expectedWithIsoStrings = JSON.parse(JSON.stringify(spaceDynos))
    expect(parsed).to.eql(expectedWithIsoStrings)
  })
})
