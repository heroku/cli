import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import {stderr, stdout} from 'stdout-stderr'
import tsheredoc from 'tsheredoc'

import Cmd from '../../../../../src/commands/certs/auto/disable.js'
import runCommand from '../../../../helpers/runCommand.js'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

const heredoc = tsheredoc.default

describe('heroku certs:auto:disable', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('disables acm', async function () {
    nock('https://api.heroku.com')
      .delete('/apps/example/acm')
      .reply(200, {acm: true})
    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stderr.output, heredoc(`
      Disabling Automatic Certificate Management... done
    `))
    expectOutput(stdout.output, '')
  })

  it('confirms that they want to disable', async function () {
    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'notexample',
    ])
      .catch(error => {
        expect(ansis.strip(error.message)).to.equal('Confirmation notexample did not match example. Aborted.')
      })
  })
})
