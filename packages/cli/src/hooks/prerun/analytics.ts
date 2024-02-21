import {Hook, ux} from '@oclif/core'

import Analytics from '../../analytics'
import * as telemetry from '../../global_telemetry'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
const path = require('path')

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  ux.log('WE ARE HERE')

  const root = path.resolve(__dirname, '../package.json')
  const config = new Config({root})
  const heroku = new APIClient(config)

  const {body: accountInfo} = await heroku.get<Heroku.Account>('/account')
  const {body: teamInfo} = await heroku.get<Heroku.Account>('/teams')

  console.log('accountInfo', accountInfo)
  console.log('teamInfo', teamInfo)
  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  await analytics.record(options)
}

export default analytics
