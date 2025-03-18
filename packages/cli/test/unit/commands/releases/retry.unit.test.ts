import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/releases/retry'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'

describe('releases:retry', function () {
  afterEach(function () {
    return nock.cleanAll()
  })

  const release = [{
    slug: {id: 'slug_uuid'},
    version: 40,
    description: 'A release',
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
    slug: 'slug_uuid',
    description: 'Retry of v40: A release',
  }

  it('errors when there are no releases yet', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [])
      .get('/apps/myapp/formation')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: any) => {
      expect(error.message).to.eq('No release found for this app.')
    })
  })

  it('retries the release', async function () {
    nock('https://api.heroku.com')
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

    const api = nock('https://api.heroku.com')
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

    api.done()
    busl.done()
    expect(stderr.output).to.contains('Retrying v40 on ⬢ myapp...')
    expect(stdout.output).to.contains('Release Output Content')
  })

  it('errors if app does not use release-phase', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, release)
      .get('/apps/myapp/formation')
      .reply(200, formationWithoutReleasePhase)

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: any) => {
      expect(error.message).to.eq('App must have a release-phase command to use this command.')
    })
  })
})
