import { Hook } from 'cli-engine/lib/hooks'
const debug = require('debug')('heroku:analytics')

export default class AnalyticsUpdateHook extends Hook<'update'> {
  async run() {
    try {
      const Analytics = require('../../analytics').default
      const analytics = new Analytics(this.config)
      await analytics.submit()
    } catch (err) {
      debug(err)
    }
  }
}
