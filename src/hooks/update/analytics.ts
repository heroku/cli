import { Hook } from '@cli-engine/engine'

import Analytics from '../../analytics'

const debug = require('debug')('heroku:analytics')

export default class AnalyticsUpdateHook extends Hook<'update'> {
  async run() {
    try {
      const analytics = new Analytics(this.config)
      await analytics.submit()
    } catch (err) {
      debug(err)
    }
  }
}
