import { Config } from 'cli-engine-config'

const debug = require('debug')('heroku:analytics')

async function run(config: Config) {
  try {
    const Analytics = require('../../analytics').default
    const analytics = new Analytics(config)
    await analytics.submit()
  } catch (err) {
    debug(err)
  }
}

module.exports = run
