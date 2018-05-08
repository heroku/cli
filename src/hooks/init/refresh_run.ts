import * as Config from '@oclif/config'

import Analytics from '../../analytics'

async function run() {
  const config = await Config.load({root: __dirname})
  const analytics = new Analytics(config)
  await analytics.submit()
}
run()
.catch(require('@oclif/errors/handle'))
