import { Hook } from '@cli-engine/engine/lib/hooks'

import Analytics from '../../analytics'

const debug = require('debug')('heroku:analytics')

export default class AnalyticsPrerunHook extends Hook<'prerun'> {
  async run() {
    try {
      const analytics = new Analytics(this.config)
      await analytics.record(this.options)
    } catch (err) {
      debug(err)
    }
  }
}
