import {expect, test} from '@oclif/test'
import {CliUx} from '@oclif/core'
import * as sinon from 'sinon'

const cli = CliUx.ux.action
const cliStub = sinon.stub(cli, 'start').callsFake(() => {})

describe('auth:logout', async () => {
  test
    .stdout()
    .stub(cli, 'start', cliStub)
    .command(['logout'])
    .it('shows cli logging user out', () => {
      expect(cliStub.calledWith('Logging out')).to.equal(true)
    })

  after(() => cliStub.restore())
})
