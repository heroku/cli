import {runCommand} from '@oclif/test'
import {expect} from 'chai'
import nock from 'nock'
import strftime from 'strftime'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

const hourAgo = new Date(Date.now() - (60 * 60 * 1000))
const hourAgoStr = strftime('%Y/%m/%d %H:%M:%S %z', hourAgo)
const spaceDynos = [
  {
    app_id: 'app_id1', app_name: 'app_name1', dynos: [
      {
        command: 'npm start',
        name: 'web.1',
        size: 'Free',
        state: 'up',
        type: 'web',
        updated_at: hourAgoStr,
      }, {
        command: 'bash',
        name: 'run.1',
        size: 'Free',
        state: 'up',
        type: 'run',
        updated_at: hourAgoStr,
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
        updated_at: hourAgoStr,
      }, {
        command: 'bash',
        name: 'run.1',
        size: 'Free',
        state: 'up',
        type: 'run',
        updated_at: hourAgoStr,
      },
    ],
  },
]
const privateDynos = [
  {
    app_id: 'app_id1', app_name: 'app_name1', dynos: [
      {
        command: 'npm start',
        name: 'web.1',
        size: 'Private-M',
        state: 'up',
        type: 'web',
        updated_at: hourAgoStr,
      },
    ],
  },
]

describe('spaces:ps', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('shows space dynos', async function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(['spaces:ps', '--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
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
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: true})

    const {stdout} = await runCommand(['spaces:ps', '--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === app_name1 web (Shield-M): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    `))
  })

  it('shows private space dynos', async function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, privateDynos)
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(['spaces:ps', '--space', 'my-space'])

    expect(stdout).to.equal(heredoc(`
    === app_name1 web (Private-M): npm start (1)

    web.1: up ${hourAgoStr} (~ 1h ago)

    `))
  })

  it('shows space dynos with --json', async function () {
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space/dynos')
      .reply(200, spaceDynos)
    nock('https://api.heroku.com:443')
      .get('/spaces/my-space')
      .reply(200, {shield: false})

    const {stdout} = await runCommand(['spaces:ps', '--space', 'my-space', '--json'])

    expect(JSON.parse(stdout)).to.eql(spaceDynos)
  })
})
