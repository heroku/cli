import {stdout, stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/certs/auto/disable'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput'
import stripAnsi = require('strip-ansi')
import {expect} from 'chai'
import heredoc from 'tsheredoc'

describe('heroku certs:auto:disable', function () {
  beforeEach(function () {
    nock.cleanAll()
  })

  it('disables acm', async function () {
    nock('https://api.heroku.com', {
      reqheaders: {
        Accept: 'application/vnd.heroku+json; version=3.cedar-acm',
      },
    })
      .delete('/apps/example/acm')
      .reply(200, {acm: true})
    await runCommand(Cmd, [
      '--app',
      'example',
      '--confirm',
      'example',
    ])
    expectOutput(stderr.output, heredoc(`
      Disabling Automatic Certificate Management...
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
        expect(stripAnsi(error.message)).to.equal('Confirmation notexample did not match example. Aborted.')
      })
  })
})
