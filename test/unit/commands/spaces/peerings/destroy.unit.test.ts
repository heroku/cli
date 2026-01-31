import {stderr} from 'stdout-stderr'
import Cmd from '../../../../../src/commands/spaces/peerings/destroy.js'
import runCommand from '../../../../helpers/runCommand.js'
import nock from 'nock'
import expectOutput from '../../../../helpers/utils/expectOutput.js'

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
    expectOutput(stderr.output, 'Tearing down peering connection pcx-12345... done\n')
  })
})
