import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {containerExtensions} from '@heroku/sdk/extensions/platform'
import {ux} from '@oclif/core/ux'

import {ensureContainerStack} from '../../lib/container/helpers.js'

export default class Rm extends Command {
  static description = 'remove the process type from your app'
  static examples = [
    `${color.command('heroku container:rm web')}        # Destroys the web container`,
    `${color.command('heroku container:rm web worker')} # Destroys the web and worker containers`,
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static strict = false
  static topic = 'container'
  static usage = 'container:rm -a APP [-v] PROCESS_TYPE...'

  async run() {
    const {platform} = new HerokuSDK({extensions: [containerExtensions]})
    const {argv, flags} = await this.parse(Rm)
    const {app} = flags

    if (argv.length === 0) {
      this.error(`Error: Requires one or more process types\n${Rm.examples.join('\n')}`)
    }

    await ensureContainerStack(platform, app, 'rm')

    const processTypes = argv as string[]
    ux.action.start(`Removing containers ${processTypes.join(', ')} from ${color.app(app)}`)
    await platform.container.removeProcessTypes(app, processTypes)
    ux.action.stop()
  }
}
