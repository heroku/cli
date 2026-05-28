import {expectOutput, runCommand} from '@heroku-cli/test-utils'
import {stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/info.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'

describe('addons:info', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
  })

  context('with add-ons', function () {
    it('prints add-ons in a table', async function () {
      const addon = {
        ...fixtures.addons['www-db'],
        attachments: [fixtures.attachments['acme-inc-www::DATABASE']],
      }
      const describeStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table', async function () {
      const addon = {
        ...fixtures.addons['www-db'],
        attachments: [fixtures.attachments['acme-inc-www::DATABASE']],
      }
      const describeStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table', async function () {
      const addon = {
        ...fixtures.addons['www-db'],
        attachments: [fixtures.attachments['acme-inc-www::DATABASE']],
      }
      const describeStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table with grandfathered price', async function () {
      const addon = {
        ...fixtures.addons['dwh-db'],
        attachments: [fixtures.attachments['acme-inc-dwh::DATABASE']],
        billed_price: {cents: 10_000},
        plan: {...fixtures.addons['dwh-db'].plan, price: {cents: 10_000, unit: 'month'}},
      }
      const describeStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table with contract', async function () {
      const addon = {
        ...fixtures.addons['dwh-db'],
        attachments: [fixtures.attachments['acme-inc-dwh::DATABASE']],
        billed_price: {cents: 0, contract: true},
        plan: {...fixtures.addons['dwh-db'].plan, price: {cents: 0, contract: true, unit: 'month'}},
      }
      const describeStub = stub().resolves(addon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table with humanized state', async function () {
      const provisioningAddon = {
        ...fixtures.addons['www-redis'],
        attachments: [fixtures.attachments['acme-inc-www::REDIS']],
      }
      const describeStub = stub().resolves(provisioningAddon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
    it('prints add-ons in a table with humanized state', async function () {
      const deprovisioningAddon = {
        ...fixtures.addons['www-redis-2'],
        attachments: [fixtures.attachments['acme-inc-www::REDIS']],
      }
      const describeStub = stub().resolves(deprovisioningAddon)
      sdkMock = mockSDKPlatform({addOn: {describe: describeStub}})

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
