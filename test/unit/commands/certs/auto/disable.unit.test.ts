import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/disable.js'

const heredoc = tsheredoc.default

describe('heroku certs:auto:disable', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('disables acm', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/example/acm')
      .reply(200, {acm: true})
    const {stderr, stdout} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stderr, heredoc(`
      Disabling Automatic Certificate Management... done
    `))
    expectOutput(stdout, '')
  })

  it('confirms that they want to disable', async function () {
    const {error} = await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])
    expect(error).to.exist
    expect(ansis.strip(error!.message)).to.equal('Confirmation notexample did not match example. Aborted.')
  })
})
