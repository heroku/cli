import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/releases/output.js'
import {runCommand} from '../../../helpers/run-command.js'
import {unwrap} from '../../../helpers/utils/unwrap.js'

describe('releases:output', function () {
  it('warns if there is no output available', async function () {
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    expect(stdout).to.equal('')
    expect(unwrap(stderr)).to.contain('Release v40 has no release output available.\n')
    api.done()
  })

  it('shows the output from a specific release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')
    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases/10')
      .reply(200, {output_stream_url: 'https://busl.test/streams/release.log', version: 40})

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
      'v10',
    ])
    busl.done()
    api.done()
    expect(stdout).to.equal('Release Output Content')
    expect(stderr).to.equal('')
  })

  it('shows the output from the latest release', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(200, 'Release Output Content')

    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{output_stream_url: 'https://busl.test/streams/release.log', version: 40}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    busl.done()
    api.done()
    expect(stdout).to.equal('Release Output Content')
    expect(stderr).to.equal('')
  })

  it('has a missing output', async function () {
    const busl = nock('https://busl.test:443')
      .get('/streams/release.log')
      .reply(404, '')

    const api = nock('https://api.heroku.com:443')
      .get('/apps/myapp/releases')
      .reply(200, [{output_stream_url: 'https://busl.test/streams/release.log', version: 40}])

    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'myapp',
    ])
    api.done()
    busl.done()
    expect(stdout).to.equal('')
    expect(stderr).to.contain('Warning: Release command not started yet. Please try again in a few')
  })
})
