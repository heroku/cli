import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {isTeamApp} from '../../lib/access/utils'

export default class Update extends Command {
    static topic = 'access';
    static description = 'update existing collaborators on an team app';
    static flags = {
      permissions: flags.string({
        char: 'p',
        description: 'comma-delimited list of permissions to update (deploy,manage,operate)',
        aliases: ['privileges'],
        deprecateAliases: true,
        required: true,
      }),
      app: flags.app({required: true}),
    };

    static args = {
      email: Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Update)
      const appName = flags.app
      let permissions = flags.permissions.split(',')

      const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
      if (!isTeamApp(appInfo?.owner?.email))
        this.error(`Error: cannot update permissions. The app ${color.cyan(appName)} is not owned by a team`)
      permissions.push('view')
      permissions = Array.from(new Set(permissions.sort()))

      ux.action.start(`Updating ${args.email} in application ${color.cyan(appName)} with ${permissions} permissions`)
      await this.heroku.patch(`/teams/apps/${appName}/collaborators/${args.email}`, {
        body: {permissions: permissions},
      })
      ux.action.stop()
    }
}
