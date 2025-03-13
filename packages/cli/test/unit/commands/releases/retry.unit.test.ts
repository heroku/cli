import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/releases/retry'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'

const isTTY = process.stderr.isTTY

describe('releases:retry', async function () {
  beforeEach(function () {
    process.stderr.isTTY = true
    process.stderr.columns = 1000
    console.log("isTTY", isTTY)
    console.log("columns", process.stderr.columns)
  })
  afterEach(function () {
    process.stderr.isTTY = isTTY
    return nock.cleanAll()
  })

  const release = [{
    slug: { id: 'slug_uuid' },
    version: 40,
    description: 'A release'
  }]

  const releaseRetry = {
    slug: 'slug_uuid',
    description: 'Retry of v40: A release'
  }

  it('errors when there are no releases yet', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, [])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ]).catch((error: any) => {
      expect(error.message).to.eq('No release found for this app')
    })
  })

  it('retries the release', async function () {
    nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, release)
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

  it('has a missing output', async function () {
    const busl = nock('https://busl.test')
      .get('/streams/release.log')
      .reply(404, '')

    const api = nock('https://api.heroku.com')
      .get('/apps/myapp/releases')
      .reply(200, release)
      .post('/apps/myapp/releases', releaseRetry)
      .reply(200, {output_stream_url: 'https://busl.test/streams/release.log'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()
    busl.done()
    expect(stdout.output).to.equal('Running release command...\n')
    expect(stderr.output).to.contains('Release command starting. Use `heroku releases:output` to view the log.')
  })
})
