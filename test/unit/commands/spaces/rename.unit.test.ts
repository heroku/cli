import nock from 'nock'
import {stderr} from 'stdout-stderr'

import Cmd from '../../../../src/commands/spaces/rename.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

describe('spaces:rename', function () {
  it('renames a space', async function () {
    nock('https://api.heroku.com')
      .patch('/spaces/old-space-name', {name: 'new-space-name'})
      .reply(200)

    await runCommand(Cmd, [
      '--from',
      'old-space-name',
      '--to',
      'new-space-name',
    ])
    expectOutput(stderr.output, 'Renaming space from ⬡ old-space-name to new-space-name... done')
  })
})
