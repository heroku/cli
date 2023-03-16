import {Hook} from '@oclif/core'

import Analytics from '../../analytics'

export const analytics: Hook<'prerun'> = async function (options) {
  const analytics = new Analytics(this.config)
  await analytics.record(options)
}
