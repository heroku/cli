import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases/output'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {unwrap} from '../../../helpers/utils/unwrap'

describe('releases:output', function () {
  it('warns if there is no output available', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    expect(stdout.output).to.equal('')
    expect(unwrap(stderr.output)).to.contain('Release v40 has no release output available.\n')
    api.done()
  })

  it('shows the output from a specific release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})

    await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])

    busl.done()
    api.done()
    expect(stdout.output).to.equal('Release Output Content')
    expect(stderr.output).to.equal('')
  })

  it('shows the output from the latest release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')

    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 40, output_stream_url: 'https://busl.test/streams/release.log'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    busl.done()
    api.done()
    expect(stdout.output).to.equal('Release Output Content')
    expect(stderr.output).to.equal('')
  })

  it('has a missing output', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')

    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 40, output_stream_url: 'https://busl.test/streams/release.log'}])

    await runCommand(Cmd, [
      '--app',
      'myapp',
    ])

    api.done()
    busl.done()
    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Warning: Release command not started yet. Please try again in a few')
  })
})
