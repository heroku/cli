import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/destroy'
import runCommand from '../../../helpers/runCommand'
import * as nock from 'nock'
import {expect} from 'chai'
import heredoc from 'tsheredoc'

describe('spaces:destroy', function () {
  const now = new Date()

  afterEach(() => {
    nock.cleanAll()
  })

  it('destroys a space', async () => {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space')
      .reply(200, {name: 'my-space', team: {name: 'my-team'}, region: {name: 'my-region'}, state: 'allocated', created_at: now})
      .get('/spaces/my-space/nat')
      .reply(200, {state: 'enabled', sources: ['1.1.1.1', '2.2.2.2']})
      .delete('/spaces/my-space')
      .reply(200)

    await runCommand(Cmd, ['--space', 'my-space', '--confirm', 'my-space'])

    api.done()

    expect(stderr.output).to.eq(heredoc`
      Destroying space my-space...
      Destroying space my-space... done
    `)
  })
})
