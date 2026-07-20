import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

export default class AppsUrlSet extends Command {
  static args = {
    url: Args.string({description: 'canonical https:// URL to display for the app'}),
  }
  static description = "set the app's canonical web URL (shown in the dashboard, apps:info, and build output)"
  static examples = [
    color.command('heroku apps:url:set https://www.example.com/ --app myapp'),
    color.command('heroku apps:url:set --reset --app myapp'),
  ]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    reset: flags.boolean({description: 'clear the override and revert to the default URL'}),
  }
  static topic = 'apps'

  async run() {
    const {args, flags} = await this.parse(AppsUrlSet)

    if (!flags.reset && !args.url) {
      ux.error('Provide a URL or pass --reset.')
    }

    if (flags.reset && args.url) {
      ux.error('Pass either a URL or --reset, not both.')
    }

    const webUrlOverride = flags.reset ? null : args.url
    ux.action.start(flags.reset ? `Resetting URL for ${color.app(flags.app)}` : `Setting URL for ${color.app(flags.app)}`)
    const {body: app} = await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {body: {web_url_override: webUrlOverride}})
    ux.action.stop()

    ux.stdout(color.info(app.web_url ?? ''))
  }
}
