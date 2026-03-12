
import {expect} from 'chai'
import nock from 'nock'

import FeaturesInfo from '../../../../src/commands/features/info.js'
import {runCommand} from '../../../helpers/run-command.js'

describe('features:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })

  it('shows feature info', async function () {
    api
      .get('/apps/myapp/features/feature-a')
      .reply(200, {
        description: 'the description',
        doc_url: 'https://devcenter.heroku.com',
        enabled: true,
        name: 'myfeature',
      })

    const {stderr, stdout} = await runCommand(FeaturesInfo, ['-a', 'myapp', 'feature-a'])

    expect(stdout).to.eq(`=== myfeature

Description: the description
Docs:        https://devcenter.heroku.com
Enabled:     true
`)
    expect(stderr).to.equal('')
  })
})
