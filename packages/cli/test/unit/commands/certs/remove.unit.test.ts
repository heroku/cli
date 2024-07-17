import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/certs/remove'
import runCommand from '../../../helpers/runCommand'
import heredoc from 'tsheredoc'
import * as nock from 'nock'
import {endpoint} from '../../../helpers/stubs/sni-endpoints'
import sharedSni = require('./shared_sni.unit.test')
import {SniEndpoint} from '../../../../src/lib/types/sni_endpoint'
import {expect} from 'chai'
import stripAnsi = require('strip-ansi')

describe('heroku certs:remove', function () {
  afterEach(function () {
    nock.cleanAll()
  })

  it('# deletes the endpoint', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])
      .delete('/apps/example/sni-endpoints/' + endpoint.name)
      .reply(200, [endpoint])

    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    api.done()

    expect(stderr.output).to.equal(heredoc`
      Removing SSL certificate tokyo-1050 from example...
      Removing SSL certificate tokyo-1050 from example... done
    `)
  })

  it('# requires confirmation if wrong endpoint on app', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    try {
      await runCommand(Cmd, [
        '--app',
        'example',
        '--confirm',
        'notexample',
      ])
    } catch (error) {
      const {message} = error as Error
      expect(stripAnsi(message)).to.equal('Confirmation notexample did not match example. Aborted.')
    }

    api.done()
    expect(stdout.output).to.equal('')
  })
})

describe('heroku shared', function () {
  const callback = function (err: Error | null, path: string, endpoint: Partial<SniEndpoint>) {
    if (err)
      throw err

    return nock('https://api.heroku.com')
      .delete(path)
      .reply(200, endpoint)
  }

  const stderr = function (endpoint: Partial<SniEndpoint>) {
    return heredoc(`
      Removing SSL certificate ${endpoint.name} from example...
      Removing SSL certificate ${endpoint.name} from example... done
    `)
  }

  sharedSni.shouldHandleArgs('certs:remove', Cmd, callback, {stderr, flags: {confirm: 'example'}})
})
