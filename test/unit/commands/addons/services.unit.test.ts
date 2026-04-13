import {runCommand} from '@heroku-cli/test-utils'
import {expect} from 'chai'
import nock from 'nock'

import Cmd from '../../../../src/commands/addons/services.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import removeAllWhitespace from '../../../helpers/utils/remove-whitespaces.js'

describe('addons:services', function () {
  beforeEach(function () {
    const services = [
      fixtures.services['heroku-postgresql'],
      fixtures.services['heroku-redis'],
    ]
    nock('https://api.heroku.com')
      .get('/addon-services')
      .reply(200, services)
  })

  it('shows addon services', async function () {
    const {stdout} = await runCommand(Cmd, [])
    const actual = removeAllWhitespace(stdout)
    const expected = removeAllWhitespace(`
      heroku-postgresql Hobby Dev    ga
      heroku-redis      Heroku Redis ga

      See plans with heroku addons:plans SERVICE`)
    expect(actual).to.include(expected)
  })
})
