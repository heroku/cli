import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import runCommand from '../../../../helpers/runCommand'
import Cmd from '../../../../../src/commands/spaces/peerings/accept'

describe('spaces:peerings:accept', function () {
  it('accepts a pending peering connection', async function () {
    const api = nock('https://api.heroku.com:443')
      .post('/spaces/my-space/peerings', {
        pcx_id: 'pcx-12345',
      })
      .reply(202)
    await runCommand(Cmd, ['--pcxid', 'pcx-12345', '--space', 'my-space'])
    expect(stdout.output).to.equal('Accepting and configuring peering connection pcx-12345\n')
    api.done()
  })
})
