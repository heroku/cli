import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import {getOwner, isTeamApp} from '../../lib/teamUtils.js'

export default class AccessAdd extends Command {
  static args = {
    email: Args.string({description: 'email address of the team member', required: true}),
  }

  static description = 'add new users to your app'

  static examples = [
    '$ heroku access:add user@email.com --app APP # add a collaborator to your app',
    '$ heroku access:add user@email.com --app APP --permissions deploy,manage,operate # permissions must be comma separated',
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
      const permissionsArraySorted = [...new Set(permissionsArray.sort())]
      output += ` with ${color.green(permissionsArraySorted.join(', '))} permissions`
      ux.action.start(output)
      await this.heroku.post<Heroku.TeamAppCollaborator[]>(`/teams/apps/${appName}/collaborators`, {
        body: {permissions: permissionsArraySorted, user: email},
      })
      ux.action.stop()
    } else {
      ux.action.start(output)
      await this.heroku.post<Heroku.Collaborator[]>(`/apps/${appName}/collaborators`, {body: {user: email}})
      ux.action.stop()
    }
  }
}
