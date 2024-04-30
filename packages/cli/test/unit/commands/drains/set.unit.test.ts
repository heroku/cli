import {expect} from '@oclif/test'
import * as nock from 'nock'
import {stdout} from 'stdout-stderr'
import runCommand from '../../../helpers/runCommand'
import Cmd from '../../../../src/commands/drains/set'

describe('drains:set', function () {
  it('shows the log drain', async function () {
    const api = nock('https://api.heroku.com:443')
      .put('/spaces/my-space/log-drain', {
        url: 'https://example.com',
      })
      .reply(200, {
        addon: null,
        created_at: '2016-03-23T18:31:50Z',
        id: '047f80cc-0470-4564-b0cb-e9ad7605314a',
        token: 'd.a55ecbe1-5513-4d19-91e4-58a08b419d19',
        updated_at: '2016-03-23T18:31:50Z',
        url: 'https://example.com',
      })
    await runCommand(Cmd, ['https://example.com', '--space', 'my-space'])
    expect(stdout.output).to.equal('Successfully set drain https://example.com for my-space.\n')
    api.done()
  })
})
