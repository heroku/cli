// @flow

import type {Config} from 'cli-engine-config'
import type {PreRun} from 'cli-engine/lib/hooks'

const debug = require('debug')('heroku:analytics')

async function run (config: Config, opts: PreRun) {
  try {
    debug(opts)
    const Analytics = require('../../analytics').default
    const analytics = new Analytics(config)
    await analytics.record(opts)
  } catch (err) {
    debug(err)
  }
}

module.exports = run
