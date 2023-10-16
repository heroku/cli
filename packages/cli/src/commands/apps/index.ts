import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as _ from 'lodash'
import color from '@heroku-cli/color'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions'
import {App} from '../../lib/types/app'

function annotateAppName(app: App) {
  let name = `${app.name}`
  if (app.locked && app.internal_routing) {
    name = `${app.name} [internal/locked]`
  } else if (app.locked) {
    name = `${app.name} [locked]`
  } else if (app.internal_routing) {
    name = `${app.name} [internal]`
  }

  return name
}

function regionizeAppName(app: App) {
  const name = annotateAppName(app)
  if (app.region && app.region.name !== 'us') {
    return `${name} (${color.green(app.region.name)})`
  }

  return name
}

function listApps(apps: Heroku.App) {
  apps.forEach((app: App) => ux.log(regionizeAppName(app)))
  ux.log()
}

function print(apps: Heroku.App, user: Heroku.Account, space: string, team: string) {
  if (apps.length === 0) {
    if (space) ux.log(`There are no apps in space ${color.green(space)}.`)
    else if (team) ux.log(`There are no apps in team ${color.magenta(team)}.`)
    else ux.log('You have no apps.')
  } else if (space) {
    ux.styledHeader(`Apps in space ${color.green(space)}`)
    listApps(apps)
  } else if (team) {
    ux.styledHeader(`Apps in team ${color.magenta(team)}`)
    listApps(apps)
  } else {
    apps = _.partition(apps, (app: App) => app.owner.email === user.email)
    if (apps[0].length > 0) {
      ux.styledHeader(`${color.cyan(user.email!)} Apps`)
      listApps(apps[0])
    }

    const columns = {
      name: {header: 'name', get: regionizeAppName},
      email: {header: 'owner.email'},
    }

    if (apps[1].length > 0) {
      ux.styledHeader('Collaborated Apps')
      ux.table(apps[1], columns)
    }
  }
}

export default class AppsIndex extends Command {
  static description = 'list your apps'
  static topic = 'apps'
  static aliases = ['apps', 'list', 'apps:list']

  static examples = [
    '$ heroku apps',
  ]

  static flags = {
    all: flags.boolean({char: 'A', description: 'include apps in all teams'}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    space: flags.string({
      char: 's',
      description: 'filter by space',
      completion: SpaceCompletion,
    }),
    personal: flags.boolean({char: 'p', description: 'list apps in personal account when a default team is set'}),
    'internal-routing': flags.boolean({char: 'i', description: 'filter to Internal Web Apps', hidden: true}),
    team: flags.team(),
  }

  async run() {
    const {flags} = await this.parse(AppsIndex)

    const teamIdentifier = flags.team
    let team = (!flags.personal && teamIdentifier) ? teamIdentifier : null
    const space = flags.space
    const internalRouting = flags['internal-routing']
    if (space) {
      const teamResponse = await this.heroku.get<Heroku.Team>(`/spaces/${space}`)
      team = teamResponse.body.team.name
    }

    let path = '/users/~/apps'
    if (team) path = `/teams/${team}/apps`
    else if (flags.all) path = '/apps'
    const [appsResponse, userResponse] = await Promise.all([
      this.heroku.get<Heroku.App>(path),
      this.heroku.get<Heroku.Account>('/account'),
    ])
    let apps = appsResponse.body
    const user = userResponse.body

    apps = _.sortBy(apps, 'name')
    if (space) {
      apps = apps.filter((a: App) => a.space && (a.space.name === space || a.space.id === space))
    }

    if (internalRouting) {
      apps = apps.filter((a: App) => a.internal_routing)
    }

    if (flags.json) {
      ux.styledJSON(apps)
    } else {
      print(apps, user, space!, team!)
    }
  }
}
