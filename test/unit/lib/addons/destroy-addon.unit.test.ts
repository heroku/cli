import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {expect} from 'chai'
import _ from 'lodash'
import nock from 'nock'

import {waitForAddonDeprovisioning} from '../../../../src/lib/addons/addons-wait.js'
import {addon} from '../../../fixtures/data/pg/fixtures.js'
import {getHerokuAPI} from '../../../helpers/test-instances.js'

// `waitForAddonDeprovisioning` is the API-client polling helper retained for
// the destroy path (src/lib/addons/destroy-addon.ts). addons:wait migrated to
// the SDK-based `pollAddonUntilDeprovisioned`, so these tests keep the retained
// helper's poll loop guarded against regressions.
describe('waitForAddonDeprovisioning', function () {
  let herokuAPI: APIClient

  beforeEach(async function () {
    herokuAPI = await getHerokuAPI()
  })

  afterEach(function () {
    return nock.cleanAll()
  })

  it('polls until the add-on record is gone (404), then reports it deprovisioned', async function () {
    const deprovisioning = _.clone(addon) as Heroku.AddOn
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deprovisioning.state = 'deprovisioning'

    // The API deletes the record and returns 404 once deprovisioned.
    const api = nock('https://api.heroku.com')
      .get(`/apps/${addon.app!.name}/addons/${addon.name}`)
      .reply(200, {...deprovisioning, state: 'deprovisioning'})
      .get(`/apps/${addon.app!.name}/addons/${addon.name}`)
      .reply(404, {message: 'Not found'})

    // interval 0 keeps the poll loop instant under mocha's default timeout.
    const result = await waitForAddonDeprovisioning(herokuAPI, deprovisioning, 0)

    api.done()
    expect(result.state).to.equal('deprovisioned')
  })

  it('rethrows non-404 errors raised while polling', async function () {
    const deprovisioning = _.clone(addon) as Heroku.AddOn
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    deprovisioning.state = 'deprovisioning'

    const api = nock('https://api.heroku.com')
      .get(`/apps/${addon.app!.name}/addons/${addon.name}`)
      .reply(500, {message: 'Internal Server Error'})

    let error: Error | undefined
    try {
      await waitForAddonDeprovisioning(herokuAPI, deprovisioning, 0)
    } catch (error_) {
      error = error_ as Error
    }

    api.done()
    expect(error).to.exist
  })
})
