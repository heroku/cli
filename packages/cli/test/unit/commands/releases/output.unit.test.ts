import {stdout, stderr} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/releases/output'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import {unwrap} from '../../../helpers/utils/unwrap'
const stdMocks = require('std-mocks')

describe('releases:output', function () {
  it('warns if there is no output available', function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40})
    runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
      .then(() => expect(stdout.output).to.equal(''))
      .then(() => expect(unwrap(stderr.output)).to.contain('Release v40 has no release output available.\n'))
      .then(() => api.done())
  })

  it('shows the output from a specific release', async function () {
    stdMocks.use()

    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40, output_stream_url: 'https://busl.test/streams/release.log'})

    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
        'v10',
      ])
      busl.done()
      api.done()
      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content')
      expect(stderr.output).to.equal('')
      stdMocks.restore()
    } catch {
      stdMocks.restore()
    }
  })

  it('shows the output from the latest release', async function () {
    stdMocks.use()

    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{version: 40, output_stream_url: 'https://busl.test/streams/release.log'}])

    try {
      await runCommand(Cmd, [
        '--app',
        'myapp',
      ])

      expect(stdMocks.flush().stdout.join('')).to.equal('Release Output Content')
      expect(stderr.output).to.equal('')
      busl.done()
      api.done()
      stdMocks.restore()
    } catch {
      stdMocks.restore()
    }
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

    expect(stdout.output).to.equal('')
    expect(stderr.output).to.contain('Release command not started yet. Please try again in a few seconds.\n')
    api.done()
    busl.done()
  })
})
