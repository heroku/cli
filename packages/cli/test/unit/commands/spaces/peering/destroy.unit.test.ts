import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/peering/destroy'
import runCommand from '../../../../helpers/runCommand'
import * as nock from 'nock'
import heredoc from 'tsheredoc'
import expectOutput from '../../../../helpers/utils/expectOutput'

describe('spaces:peering:destroy', function () {
  it('destroys an active peering connection', async function () {
    nock('https://api.heroku.com')
      .delete('/spaces/my-space/peerings/pcx-12345')
      .reply(202)

    await runCommand(Cmd, [
      '--space',
      'my-space',
      '--pcxid',
      'pcx-12345',
      '--confirm',
      'pcx-12345',
    ])
    expectOutput(stderr.output, heredoc(`
      Tearing down peering connection pcx-12345...
      Tearing down peering connection pcx-12345... done
    `))
  })
})
