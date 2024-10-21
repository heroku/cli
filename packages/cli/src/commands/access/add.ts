import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {isTeamApp, getOwner} from '../../lib/teamUtils'
import * as _ from 'lodash'
export default class AccessAdd extends Command {
  static description = 'add new users to your app'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote({char: 'r'}),
    permissions: flags.string({char: 'p', description: 'list of permissions comma separated'}),
  }

  static examples = [
    '$ heroku access:add user@email.com --app APP # add a collaborator to your app',
    '$ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated',
  ]

  static args = {
    email: Args.string({required: true, description: 'Email address of the team member.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(AccessAdd)
    const {email} = args
    const {app: appName, permissions} = flags
    const {body: appInfo} = await this.heroku.get<Heroku.App>(`/apps/${appName}`)
    let output = `Adding ${color.cyan(email)} access to the app ${color.magenta(appName)}`
    let teamFeatures: Heroku.TeamFeature[] = []
    if (isTeamApp(appInfo?.owner?.email)) {
      const teamName = getOwner(appInfo?.owner?.email)
      const teamFeaturesRequest = await this.heroku.get<Heroku.TeamFeature[]>(`/teams/${teamName}/features`)
      teamFeatures = teamFeaturesRequest.body
    }

    if (teamFeatures.some(feature => feature.name === 'org-access-controls')) {
      if (!permissions)
        this.error('Missing argument: permissions', {exit: 1})
      const permissionsArray = permissions ? permissions.split(',') : []
      permissionsArray.push('view')
      const permissionsArraySorted = _.uniq(permissionsArray.sort())
      output += ` with ${color.green(permissionsArraySorted.join(', '))} permissions`
      ux.action.start(output)
      await this.heroku.post<Heroku.TeamAppCollaborator[]>(`/teams/apps/${appName}/collaborators`, {
        body: {user: email, permissions: permissionsArraySorted},
      })
      ux.action.stop()
    } else {
      ux.action.start(output)
      await this.heroku.post<Heroku.Collaborator[]>(`/apps/${appName}/collaborators`, {body: {user: email}})
      ux.action.stop()
    }
  }
}
