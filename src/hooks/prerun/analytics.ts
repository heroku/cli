import { Hook, IHooks } from 'cli-engine/lib/hooks'

const debug = require('debug')('heroku:analytics')

export default class AnalyticsPrerunHook extends Hook<'prerun'> {
  async run(opts: IHooks['prerun']) {
    try {
      const Analytics = require('../../analytics').default
      const analytics = new Analytics(this.config)
      await analytics.record(opts)
    } catch (err) {
      debug(err)
    }
  }
}
