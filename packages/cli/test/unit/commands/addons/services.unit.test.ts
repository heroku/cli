import {stdout} from 'stdout-stderr'
// import Cmd from '../../../../src/commands/addons/services'
import runCommand from '../../../helpers/runCommand.js'
import * as fixtures from '../../../fixtures/addons/fixtures.js'
import * as nock from 'nock'
import expectOutput from '../../../helpers/utils/expectOutput.js'

/*
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
    await runCommand(Cmd, [])
    expectOutput(stdout.output, `
Slug              Name         State
 ───────────────── ──────────── ─────
 heroku-postgresql Hobby Dev    ga
 heroku-redis      Heroku Redis ga

See plans with heroku addons:plans SERVICE
 `)
  })
})

*/
