import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/releases/rollback'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {unwrap} from '../../../helpers/utils/unwrap'

describe('releases:rollback', function () {
  afterEach(() => nock.cleanAll())

  it('rolls back the release', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
      .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
      .reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    api.done()
  })

  it('rolls back to the latest release', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 'current_release', version: 41, status: 'succeeded'}, {id: 'previous_release', version: 40, status: 'succeeded'}])
      .post('/apps/myapp/releases', {release: 'previous_release'})
      .reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()
  })

  it('does not roll back to a failed release', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{id: 'current_release', version: 41, status: 'succeeded'}, {id: 'failed_release', version: 40, status: 'failed'}, {id: 'succeeded_release', version: 39, status: 'succeeded'}])
      .post('/apps/myapp/releases', {release: 'succeeded_release'})
      .reply(200, {})

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()
  })

  it('streams the release command output', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
      .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
      .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    busl.done()
    api.done()

    const stderr_output = unwrap(stderr.output)
    expect(stderr_output).to.contain('Rolling back myapp to v40... done, v40')
    expect(stderr_output).to.contain("Rollback affects code and config vars; it doesn't add or remove addons.")
    expect(stderr_output).to.contain('To undo, run: heroku rollback v39')
    expect(stdout.output).to.equal('Running release command...\nRelease Output Content')
  })

  it('has a missing output', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {id: '5efa3510-e8df-4db0-a176-83ff8ad91eb5', version: 40})
      .post('/apps/myapp/releases', {release: '5efa3510-e8df-4db0-a176-83ff8ad91eb5'})
      .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    busl.done()
    api.done()

    expect(stdout.output).to.equal('Running release command...\n')
    expect(unwrap(stderr.output)).to.contain('Release command starting. Use `heroku releases:output` to view the log.')
  })
})
