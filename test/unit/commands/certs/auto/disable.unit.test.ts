import ansis from 'ansis'
import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/certs/auto/disable.js'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput.js'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'

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
