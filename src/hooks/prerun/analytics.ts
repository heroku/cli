import {Hooks, IHook} from '@anycli/config'

import Analytics from '../../analytics'

const debug = require('debug')('heroku:analytics')

const hook: IHook<Hooks['prerun']> = async opts => {
  try {
    const analytics = new Analytics(opts.config)
    await analytics.record(opts)
  } catch (err) {
    debug(err)
  }
}

export default hook
