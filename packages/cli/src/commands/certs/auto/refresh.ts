import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

export default class Refresh extends Command {
  static topic = 'certs';
  static description = 'refresh ACM for an app';
  static flags = {
    app: flags.app({required: true}),
    flags: flags.remote(),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Refresh)

    ux.action.start('Refreshing Automatic Certificate Management')
    await this.heroku.patch(`/apps/${flags.app}/acm`, {body: {acm_refresh: true}})
    ux.action.stop()
  }
}
