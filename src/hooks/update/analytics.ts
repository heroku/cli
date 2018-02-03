import {Hook} from '@anycli/config'

import Analytics from '../../analytics'

const hook: Hook<'update'> = async opts => {
  const analytics = new Analytics(opts.config)
  await analytics.submit()
}

export default hook
