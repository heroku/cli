import {stdout} from 'stdout-stderr'
import Cmd  from '../../../../src/commands/addons/info'
import runCommand from '../../../helpers/runCommand'
import * as fixtures from '../../../fixtures/addons/fixtures'
import expectOutput from '../../../helpers/utils/expectOutput'
import * as nock from 'nock'
import  {resolveAddon} from '../../../../src/lib/addons/resolve'

const cache = resolveAddon.cache

describe('addons:info', function () {
  beforeEach(function () {
    nock.cleanAll()
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    cache.clear()
  })

  context('with add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: null, addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['www-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::DATABASE']])
    })
    it('prints add-ons in a table', async function () {
      await runCommand(Cmd, [
        'www-db',
      ])

      expectOutput(stdout.output, `
=== www-db
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Max Price:    $5/month
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
State:        created\n
`)
    })
  })

  context('with app add-ons', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: 'example', addon: 'www-db'})
        .reply(200, [fixtures.addons['www-db']])
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${fixtures.addons['www-db'].id}`)
        .reply(200, fixtures.addons['www-db'])
      nock('https://api.heroku.com')
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
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Max Price:    $5/month
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
State:        created\n
      `)
    })
  })
  context('with app but not an app add-on', function () {
    beforeEach(function () {
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: 'example', addon: 'www-db'})
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
      nock('https://api.heroku.com')
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
Attachments:  acme-inc-www::DATABASE
Installed at: Invalid Date
Max Price:    $5/month
Owning app:   acme-inc-www
Plan:         heroku-postgresql:mini
Price:        ~$0.007/hour
State:        created\n
        `)
    })
  })

  context('with add-ons with grandfathered pricing', function () {
    beforeEach(function () {
      const addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 10000}
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: null, addon: 'dwh-db'})
        .reply(200, [addon])
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${addon.id}`)
        .reply(200, addon)
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with grandfathered price', async function () {
      await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout.output, `
=== dwh-db
Attachments:  acme-inc-dwh::DATABASE
Installed at: Invalid Date
Max Price:    $100/month
Owning app:   acme-inc-dwh
Plan:         heroku-postgresql:standard-2
Price:        ~$0.139/hour
State:        created\n
        `)
    })
  })

  context('with a contract add-on', function () {
    beforeEach(function () {
      const addon = fixtures.addons['dwh-db']
      addon.billed_price = {cents: 0, contract: true}
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: null, addon: 'dwh-db'})
        .reply(200, [addon])
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
      }})
        .get(`/addons/${addon.id}`)
        .reply(200, addon)
      nock('https://api.heroku.com')
        .get(`/addons/${fixtures.addons['dwh-db'].id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-dwh::DATABASE']])
    })

    it('prints add-ons in a table with contract', async function () {
      await runCommand(Cmd, [
        'dwh-db',
      ])
      expectOutput(stdout.output, `
=== dwh-db
Attachments:  acme-inc-dwh::DATABASE
Installed at: Invalid Date
Max Price:    contract
Owning app:   acme-inc-dwh
Plan:         heroku-postgresql:standard-2
Price:        contract
State:        created\n
        `)
    })
  })

  context('provisioning add-on', function () {
    beforeEach(function () {
      const provisioningAddon = fixtures.addons['www-redis']
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: null, addon: 'www-redis'})
        .reply(200, [provisioningAddon])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${provisioningAddon.id}`)
        .reply(200, provisioningAddon)
      nock('https://api.heroku.com')
        .get(`/addons/${provisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      await runCommand(Cmd, [
        'www-redis',
      ])
      expectOutput(stdout.output, `
=== www-redis
Attachments:  acme-inc-www::REDIS
Installed at: Invalid Date
Max Price:    $60/month
Owning app:   acme-inc-www
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
State:        creating\n
        `)
    })
  })

  context('deprovisioning add-on', function () {
    beforeEach(function () {
      const deprovisioningAddon = fixtures.addons['www-redis-2']
      nock('https://api.heroku.com', {reqheaders: {
        'Accept-Expansion': 'addon_service,plan',
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      }})
        .post('/actions/addons/resolve', {app: null, addon: 'www-redis-2'})
        .reply(200, [deprovisioningAddon])
      nock('https://api.heroku.com', {reqheaders: {'Accept-Expansion': 'addon_service,plan'}})
        .get(`/addons/${deprovisioningAddon.id}`)
        .reply(200, deprovisioningAddon)
      nock('https://api.heroku.com')
        .get(`/addons/${deprovisioningAddon.id}/addon-attachments`)
        .reply(200, [fixtures.attachments['acme-inc-www::REDIS']])
    })

    it('prints add-ons in a table with humanized state', async function () {
      await runCommand(Cmd, [
        'www-redis-2',
      ])
      expectOutput(stdout.output, `
=== www-redis-2
Attachments:  acme-inc-www::REDIS
Installed at: Invalid Date
Max Price:    $60/month
Owning app:   acme-inc-www
Plan:         heroku-redis:premium-2
Price:        ~$0.083/hour
State:        destroying\n
        `)
    })
  })
})
