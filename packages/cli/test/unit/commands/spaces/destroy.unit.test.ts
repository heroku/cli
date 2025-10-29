import {stderr} from 'stdout-stderr'
import Cmd from '../../../../src/commands/spaces/destroy.js'
import runCommand from '../../../helpers/runCommand.js'
import nock from 'nock'
import {expect} from 'chai'
import tsheredoc from 'tsheredoc'
import {hux} from '@heroku/heroku-cli-util'
import * as sinon from 'sinon'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

const heredoc = tsheredoc.default

describe('spaces:destroy', function () {
  const now = new Date()

  beforeEach(function () {
    sinon.stub(hux, 'prompt').resolves('my-space')
  })

  afterEach(function () {
    nock.cleanAll()
    sinon.restore()
  })

  it('shows extended NAT warning for fir generation space', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space')
      .reply(200, {
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        state: 'allocated',
        created_at: now,
        generation: 'fir',
      })
      .get('/spaces/my-space/nat')
      .reply(200, {state: 'enabled', sources: ['1.1.1.1', '2.2.2.2']})
      .delete('/spaces/my-space')
      .reply(200)

    await runCommand(Cmd, ['--space', 'my-space'])
    api.done()

    const actual = removeAllWhitespace(stderr.output)
    expect(actual).to.include(removeAllWhitespace('Warning: Destructive Action'))
    expect(actual).to.include(removeAllWhitespace('This command will destroy the space my-space'))
    expect(actual).to.include(removeAllWhitespace('=== WARNING: Outbound IPs Will Be Reused'))
    expect(actual).to.include(removeAllWhitespace('⚠️ Deleting this space frees up the following outbound IPv4 and IPv6 IPs for reuse:'))
    expect(actual).to.include(removeAllWhitespace('1.1.1.1, 2.2.2.2'))
    expect(actual).to.include(removeAllWhitespace('Update the following configurations:'))
    expect(actual).to.include(removeAllWhitespace('= IP allowlists'))
    expect(actual).to.include(removeAllWhitespace('= Firewall rules'))
    expect(actual).to.include(removeAllWhitespace('= Security group configurations'))
    expect(actual).to.include(removeAllWhitespace('= Network ACLs'))
    expect(actual).to.include(removeAllWhitespace('Ensure that you remove the listed IPv4 and IPv6 addresses from your security configurations.'))
    expect(actual).to.include(removeAllWhitespace('Destroying space my-space... done'))
  })

  it('shows simple NAT warning for non-fir generation space', async function () {
    const api = nock('https://api.heroku.com')
      .get('/spaces/my-space')
      .reply(200, {
        name: 'my-space',
        team: {name: 'my-team'},
        region: {name: 'my-region'},
        state: 'allocated',
        created_at: now,
        generation: 'cedar',
      })
      .get('/spaces/my-space/nat')
      .reply(200, {state: 'enabled', sources: ['1.1.1.1', '2.2.2.2']})
      .delete('/spaces/my-space')
      .reply(200)

    await runCommand(Cmd, ['--space', 'my-space'])
    api.done()
    const actual = removeAllWhitespace(stderr.output)

    expect(actual).to.include(removeAllWhitespace('Warning: Destructive Action'))
    expect(actual).to.include(removeAllWhitespace('This command will destroy the space my-space'))
    expect(actual).to.include(removeAllWhitespace('=== WARNING: Outbound IPs Will Be Reused'))
    expect(actual).to.include(removeAllWhitespace('⚠️ Deleting this space frees up the following outbound IPv4 IPs for reuse:'))
    expect(actual).to.include(removeAllWhitespace('1.1.1.1, 2.2.2.2'))
    expect(actual).to.include(removeAllWhitespace('Update the following configurations:'))
    expect(actual).to.include(removeAllWhitespace('= IP allowlists'))
    expect(actual).to.include(removeAllWhitespace('= Firewall rules'))
    expect(actual).to.include(removeAllWhitespace('= Security group configurations'))
    expect(actual).to.include(removeAllWhitespace('= Network ACLs'))
    expect(actual).to.include(removeAllWhitespace('Ensure that you remove the listed IPv4 addresses from your security configurations.'))
    expect(actual).to.include(removeAllWhitespace('Destroying space my-space... done'))
  })
})
