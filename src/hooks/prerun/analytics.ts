import { Config } from 'cli-engine-config'
import { PreRunOptions } from 'cli-engine/lib/hooks'

const debug = require('debug')('heroku:analytics')

async function run(config: Config, opts: PreRunOptions) {
  try {
    const Analytics = require('../../analytics').default
    const analytics = new Analytics(config)
    await analytics.record(opts)
  } catch (err) {
    debug(err)
  }
}

module.exports = run
