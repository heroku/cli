import {Hook} from '@oclif/config'

import Analytics from '../../analytics'

export const analytics: Hook<'update'> = async function () {
  const analytics = new Analytics(this.config)
  await analytics.submit()
}
