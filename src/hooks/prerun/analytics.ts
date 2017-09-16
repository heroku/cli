import {Config} from 'cli-engine-config'
import {PreRunOptions} from 'cli-engine/lib/hooks'
import {Analytics as _Analytics} from '../../analytics'

const debug = require('debug')('heroku:analytics')

async function run (config: Config, opts: PreRunOptions) {
  try {
    const Analytics: typeof _Analytics = require('../../analytics').Analytics
    const analytics = new Analytics(config)
    await analytics.record(opts)
  } catch (err) {
    debug(err)
  }
}

export = run
