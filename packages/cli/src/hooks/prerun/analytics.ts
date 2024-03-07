import {Hook, ux} from '@oclif/core'
import color from '@heroku-cli/color'
import * as open from 'open'

import Analytics from '../../analytics'
import * as telemetry from '../../global_telemetry'
import * as Heroku from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
import {Config} from '@oclif/core'
const path = require('path')

declare const global: telemetry.TelemetryGlobal

const analytics: Hook<'prerun'> = async function (options) {
  const teams = ''

  const root = path.resolve(__dirname, '../package.json')
  const config = new Config({root})
  const heroku = new APIClient(config)

  const {body: accountInfo} = await heroku.get<Heroku.Account>('/account')
  const {body: teamInfo} = await heroku.get<Heroku.Account>('/teams')

  if (!accountInfo.delinquent_at) {
    ux.warn('Your account has been suspended due to unpaid invoices.')
    ux.anykey(`heroku: Press any key to open up the browser to pay outstanding invoices or ${color.yellow('q')} to exit`)
    await open('https://dashboard.heroku.com/account/billing')
  }

  global.cliTelemetry = telemetry.setupTelemetry(this.config, options)
  const analytics = new Analytics(this.config)
  await analytics.record(options)
}

export default analytics
