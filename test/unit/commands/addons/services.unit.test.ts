import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import {restore, stub} from 'sinon'

import Cmd from '../../../../src/commands/addons/services.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import {type MockSDK, mockSDKPlatform} from '../../../helpers/mock-sdk.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('addons:services', function () {
  let sdkMock: MockSDK

  afterEach(function () {
    sdkMock.restore()
    restore()
  })

  it('shows addon services', async function () {
    const services = [
      fixtures.services['heroku-postgresql'],
      fixtures.services['heroku-redis'],
    ]
    sdkMock = mockSDKPlatform({addOnService: {list: stub().resolves(services)}})

    const {stdout} = await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace(`
      heroku-postgresql Hobby Dev    ga
      heroku-redis      Heroku Redis ga

      See plans with heroku addons:plans SERVICE`)
    expect(actual).to.include(expected)
  })
})
