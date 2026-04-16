import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../src/commands/certs/remove.js'
import {SniEndpoint} from '../../../../src/lib/types/sni-endpoint.js'
import {endpoint} from '../../../helpers/stubs/sni-endpoints.js'
import * as sharedSni from './shared-sni.unit.test.js'

const heredoc = tsheredoc.default

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

    const {stderr} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])

    api.done()

    expect(stderr).to.equal(heredoc`
      Removing SSL certificate tokyo-1050 from ⬢ example... done
    `)
  })

  it('# requires confirmation if wrong endpoint on app', async function () {
    const api = nock('https://api.heroku.com')
      .get('/apps/example/sni-endpoints')
      .reply(200, [endpoint])

    const {error, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])

    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
    api.done()
    expect(stdout).to.equal('')
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
      Removing SSL certificate ${endpoint.name} from ⬢ example... done
    `)
  }

  sharedSni.shouldHandleArgs('certs:remove', Cmd, callback, {flags: {confirm: 'example'}, stderr})
})
