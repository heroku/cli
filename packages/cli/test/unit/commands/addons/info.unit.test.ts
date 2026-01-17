import nock from 'nock'
import {stdout} from 'stdout-stderr'

import Cmd from '../../../../src/commands/addons/info.js'
import  {resolveAddon} from '../../../../src/lib/addons/resolve.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import runCommand from '../../../helpers/runCommand.js'
import expectOutput from '../../../helpers/utils/expectOutput.js'

const {cache} = resolveAddon

describe('addons:info', function () {
  let api: nock.Scope

  beforeEach(function () {
    api = nock('https://api.heroku.com')
    cache.clear()
  })

  afterEach(function () {
    api.done()
    nock.cleanAll()
  })
  context('with add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'www-db', app: null})
        .reply(200, [fixtures.addons['www-db']])
      api.get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`).reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })
    it('prints add-ons in a table', async function () {
      await runCommand(Cmd, [
        'www-db',
      ])

      expectOutput(stdout.output, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
`)
    })
  })

  context('with app add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'www-db', app: 'example'})
        .reply(200, [fixtures.addons['www-db']])
      nock('https://api.heroku.com', {
        reqheaders: {
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])
      api
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', async function () {
      await runCommand(Cmd, [
        '--app',
        'example',
        'www-db',
      ])

      expectOutput(stdout.output, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
      `)
    })
  })
  context('with app but not an app add-on', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'www-db', app: 'example'})
        .reply(200, [fixtures.addons['www-db']])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/apps/example/addons/www-db')
        .reply(404)
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get('/addons/www-db')
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])
      api
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })

    it('prints add-ons in a table', async function () {
      await runCommand(Cmd, [
        '--app',
        'example',
        'www-db',
      ])
      expectOutput(stdout.output, `
=== www-db
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
Max Price:    $5/month
Attachments:  acme-inc-www::DATABASE
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        created\n
        `)
    })
  })

  context('with add-ons with grandfathered pricing', function () {
    beforeEach(function () {
      const addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 10000}
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'dwh-db', app: null})
        .reply(200, [addon])
      nock('https://api.heroku.com', {
        reqheaders: {
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .get(`/addons/${addon.id}`)
        .reply(200, addon)
      api
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with grandfathered price', async function () {
      await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout.output, `
=== dwh-db
Plan:         heroku-postgresql:standard-2
Price:        ~$0.139/hour
Max Price:    $100/month
Attachments:  acme-inc-dwh::DATABASE
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
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'dwh-db', app: null})
        .reply(200, [addon])
      nock('https://api.heroku.com', {
        reqheaders: {
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .get(`/addons/${addon.id}`)
        .reply(200, addon)
      api
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with contract', async function () {
      await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout.output, `
=== dwh-db
Plan:         heroku-postgresql:standard-2
Price:        contract
Max Price:    contract
Attachments:  acme-inc-dwh::DATABASE
Owning app:   ⬢ acme-inc-dwh
Installed at: Invalid Date
State:        created\n
        `)
    })
  })

  context('provisioning add-on', function () {
    beforeEach(function () {
      const provisioningAddon = fixtures.addons['www-redis']
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'www-redis', app: null})
        .reply(200, [provisioningAddon])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${provisioningAddon.id}`)
        .reply(200, provisioningAddon)
      api
        .get(`/addons/${provisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      await runCommand(Cmd, [
        'www-redis',
      ])
      expectOutput(stdout.output, `
=== www-redis
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
Max Price:    $60/month
Attachments:  acme-inc-www::REDIS
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        creating\n
        `)
    })
  })

  context('deprovisioning add-on', function () {
    beforeEach(function () {
      const deprovisioningAddon = fixtures.addons['www-redis-2']
      nock('https://api.heroku.com', {
        reqheaders: {
          Accept: 'application/vnd.heroku+json; version=3.sdk',
          'Accept-Expansion': 'addon_service,plan',
        },
      })
        .post('/actions/addons/resolve', {addon: 'www-redis-2', app: null})
        .reply(200, [deprovisioningAddon])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${deprovisioningAddon.id}`)
        .reply(200, deprovisioningAddon)
      api
        .get(`/addons/${deprovisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      await runCommand(Cmd, [
        'www-redis-2',
      ])
      expectOutput(stdout.output, `
=== www-redis-2
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
Max Price:    $60/month
Attachments:  acme-inc-www::REDIS
Owning app:   ⬢ acme-inc-www
Installed at: Invalid Date
State:        destroying\n
        `)
    })
  })
})
