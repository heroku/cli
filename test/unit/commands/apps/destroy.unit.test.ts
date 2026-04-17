import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Destroy from '../../../../src/commands/apps/destroy.js'

describe('apps:destroy', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('deletes the app', async function () {
    api
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

    const {stderr, stdout} = await runCommand(Destroy, ['--app', 'myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done')
  })

  it('deletes the app via arg', async function () {
    api
      .get('/apps/myapp').reply(200, {name: 'myapp'})
      .delete('/apps/myapp').reply(200)

    const {stderr, stdout} = await runCommand(Destroy, ['myapp', '--confirm', 'myapp'])

    expect(stdout).to.equal('')
    expect(stderr).to.include('Destroying ⬢ myapp (including all add-ons)... done')
  })

  it('errors without an app', async function () {
    const {error} = await runCommand(Destroy, [])

    expect(error?.message).to.include('No app specified.')
  })
})
