import {runCommand} from '@heroku-cli/test-utils'
import ansis from 'ansis'
import {expect} from 'chai'
import nock from 'nock'
import childProcess from 'node:child_process'
import {restore, stub} from 'sinon'

import OpenCommand from '../../../../src/commands/pipelines/open.js'
import {spawnArgsInclude} from '../../../helpers/spawned-url.js'

describe('pipelines:open', function () {
  const pipeline = {id: '0123', name: 'Rigel'}
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    restore()
    nock.cleanAll()
  })

  it('opens the url', async function () {
    const spawnStub = stub(childProcess, 'spawn').returns({
      off() {},
      on() {},
      // `open` resolves once the launcher emits 'spawn'.
      once(event: string, cb: CallableFunction) {
        if (event === 'spawn') cb()
      },
      unref() {},
    } as any)

    api
      .get('/pipelines')
      .query({eq: {name: pipeline.name}})
      .reply(200, [pipeline])

    const {stderr, stdout} = await runCommand(OpenCommand, [pipeline.name])

    expect(stdout).to.equal('')
    expect(ansis.strip(stderr)).to.contain('Opening https://dashboard.heroku.com/pipelines/0123 in your default browser…')
    expect(ansis.strip(stderr)).not.to.contain('can\'t open')

    const urlArgArray = spawnStub.getCall(0).args[1]
    expect(spawnArgsInclude(urlArgArray, 'https://dashboard.heroku.com/pipelines/0123')).to.be.true
  })
})
