import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import nock from 'nock'

import Cmd from '../../../../src/commands/addons/info.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'

describe('addons:info', function () {
  let api: nock.Scope
  let apiSdk: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    apiSdk = nock('https://api.heroku.com', {
      reqheaders: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
        'Accept-Expansion': 'addon_service,plan',
      },
    })
  })

  afterEach(function () {
    api.done()
    apiSdk.done()
    nock.cleanAll()
  })

  context('with add-ons', function () {
    beforeEach(function () {
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])
      api.get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`).reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })
    it('prints add-ons in a table', async function () {
      const {stdout} = await runCommand(Cmd, [
        'www-db',
      ])
      expectOutput(stdout, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  ⬢ acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
`)
    })
  })

  context('with app add-ons', function () {
    beforeEach(function () {
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-db', app: 'example'})
        .reply(200, [fixtures.addons['www-db']])
      api
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', async function () {
      const {stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        'www-db',
      ])
      expectOutput(stdout, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  ⬢ acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
      `)
    })
  })
  context('with app but not an app add-on', function () {
    beforeEach(function () {
      // The SDK's resolver tries app-scoped first, falls back to global on 404 add_on.
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-db', app: 'example'})
        .reply(404, {id: 'not_found', resource: 'add_on'})
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])
      api
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', async function () {
      const {stdout} = await runCommand(Cmd, [
        '--app',
        'example',
        'www-db',
      ])
      expectOutput(stdout, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  ⬢ acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
        `)
    })
  })

  context('with add-ons with grandfathered pricing', function () {
    beforeEach(function () {
      const addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 10_000}
      apiSdk
        .post('/actions/addons/resolve', {addon: 'dwh-db'})
        .reply(200, [addon])
      api
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with grandfathered price', async function () {
      const {stdout} = await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout, `
=== dwh-db
Plan:         heroku-postgresql:standard-2
Price:        ~$0.139/hour
Max Price:    $100/month
Attachments:  ⬢ acme-inc-dwh::DATABASE
Owning app:   ⬢ acme-inc-dwh
Installed at: Invalid Date
State:        created\n
        `)
    })
  })

  context('with a contract add-on', function () {
    beforeEach(function () {
      const addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 0, contract: true}
      apiSdk
        .post('/actions/addons/resolve', {addon: 'dwh-db'})
        .reply(200, [addon])
      api
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with contract', async function () {
      const {stdout} = await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout, `
=== dwh-db
Plan:         heroku-postgresql:standard-2
Price:        contract
Max Price:    contract
Attachments:  ⬢ acme-inc-dwh::DATABASE
Owning app:   ⬢ acme-inc-dwh
Installed at: Invalid Date
State:        created\n
        `)
    })
  })

  context('provisioning add-on', function () {
    beforeEach(function () {
      const provisioningAddon = fixtures.addons['www-redis']
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-redis'})
        .reply(200, [provisioningAddon])
      api
        .get(`/addons/${provisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      const {stdout} = await runCommand(Cmd, [
        'www-redis',
      ])
      expectOutput(stdout, `
=== www-redis
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
Max Price:    $60/month
Attachments:  ⬢ acme-inc-www::REDIS
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        creating\n
        `)
    })
  })

  context('deprovisioning add-on', function () {
    beforeEach(function () {
      const deprovisioningAddon = fixtures.addons['www-redis-2']
      apiSdk
        .post('/actions/addons/resolve', {addon: 'www-redis-2'})
        .reply(200, [deprovisioningAddon])
      api
        .get(`/addons/${deprovisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      const {stdout} = await runCommand(Cmd, [
        'www-redis-2',
      ])
      expectOutput(stdout, `
=== www-redis-2
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
Max Price:    $60/month
Attachments:  ⬢ acme-inc-www::REDIS
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        destroying\n
        `)
    })
  })
})
