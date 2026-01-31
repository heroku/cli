import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/releases/retry.js'
import runCommand from '../../../helpers/runCommand.js'

describe('releases:retry', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  const release = [{
    description: 'A release',
    slug: {id: 'slug_uuid'},
    version: 40,
  }]

  const formationWithReleasePhase = [
    {
      type: 'release',
    },
    {
      type: 'web',
    },
  ]

  const formationWithoutReleasePhase = [{
    type: 'web',
  }]

  const releaseRetry = {
    description: 'Retry of v40: A release',
    slug: 'slug_uuid',
  }

  it('errors when there are no releases yet', async function () {
    api
      .get('/apps/myapp/releases')
      .reply(200, [])
      .get('/apps/myapp/formation')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: Error) => {
      expect(ansis.strip(error.message)).to.eq('No release found for ⬢ myapp.')
    })
  })

  it('retries the release', async function () {
    api
      .get('/apps/myapp/releases')
      .reply(200, release)
      .get('/apps/myapp/formation')
      .reply(200, formationWithReleasePhase)
      .post('/apps/myapp/releases', releaseRetry)
      .reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
  })

  it('shows the output from the latest release', async function () {
    const busl = nock('https://busl.test')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')

    api
      .get('/apps/myapp/releases')
      .reply(200, release)
      .get('/apps/myapp/formation')
      .reply(200, formationWithReleasePhase)
      .post('/apps/myapp/releases', releaseRetry)
      .reply(200, {output_stream_url: 'https://busl.test/streams/release.log'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    busl.done()
    expect(stderr.output).to.contain('Retrying v40 on')
    expect(stderr.output).to.contain('myapp')
    expect(stdout.output).to.contain('Release Output Content')
  })

  it('errors if app does not use release-phase', async function () {
    api
      .get('/apps/myapp/releases')
      .reply(200, release)
      .get('/apps/myapp/formation')
      .reply(200, formationWithoutReleasePhase)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: Error) => {
      expect(error.message).to.eq('App must have a release-phase command to use this command.')
    })
  })
})
