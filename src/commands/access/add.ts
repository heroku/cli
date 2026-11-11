import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'

export default class AccessAdd extends Command {
  static args = {
    email: Args.string({description: 'email address of the team member', required: true}),
  }
  static description = 'add new users to your app'
  static examples = [
    `${color.command('heroku access:add user@email.com --app APP')} # add a collaborator to your app`,
    `${color.command('heroku access:add user@email.com --app APP --permissions deploy,manage,operate')} # permissions must be comma separated`,
  ]
  static flags = {
    app: flags.app({required: true}),
    permissions: flags.string({char: 'p', description: 'list of permissions comma separated'}),
    remote: flags.remote({char: 'r'}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(AccessAdd)
    const {email} = args
    const {app: appName, permissions} = flags
    const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    let output = `Adding ${color.user(email)} access to the app ${color.app(appName)}`
    if (appInfo?.team) {
      const body: {permissions?: string[], user: string} = {user: email}
      if (permissions) {
        const permissionsArray = permissions.split(',').map((permission: string) => permission.trim()).filter(Boolean)
        permissionsArray.push('view')
        const normalizedPermissions: string[] = [...new Set<string>(permissionsArray)].sort()
        body.permissions = normalizedPermissions
        output += ` with ${color.green(normalizedPermissions.join(', '))} permissions`
      }

      ux.action.start(output)
      await this.heroku.post<Heroku.TeamAppCollaborator[]>(`/teams/apps/${appName}/collaborators`, {
        body,
      })
      ux.action.stop()
    } else {
      ux.action.start(output)
      await this.heroku.post<Heroku.Collaborator[]>(`/apps/${appName}/collaborators`, {body: {user: email}})
      ux.action.stop()
    }
  }
}
