import {expect} from 'chai'

import Logout from '../../../../src/commands/auth/logout.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('auth:logout', function () {
  it('shows cli logging user out', async function () {
    const {stderr} = await runCommand(Logout, [])
    expect(stderr).to.equal('Logging out... done\n')
  })
})
