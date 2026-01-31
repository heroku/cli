import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions.js'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import _ from 'lodash'

import {App} from '../../lib/types/app.js'

function annotateAppName(app: App) {
  let name = color.app(app.name)
  if (app.locked && app.internal_routing) {
    name = `${color.app(app.name)} [internal/locked]`
  } else if (app.locked) {
    name = `${color.app(app.name)} [locked]`
  } else if (app.internal_routing) {
    name = `${color.app(app.name)} [internal]`
  }

  return name
}

function regionizeAppName(app: App) {
  const name = annotateAppName(app)
  if (app.region && app.region.name !== 'us') {
    return `${name} (${color.info(app.region.name)})`
  }

  return name
}

function listApps(apps: Heroku.App) {
  apps.forEach((app: App) => ux.stdout(regionizeAppName(app)))
}

function print(apps: Heroku.App, user: Heroku.Account, space?: string, team?: null | string) {
  if (apps.length === 0) {
    if (space) ux.stdout(`There are no apps in space ${color.space(space)}.`)
    else if (team) ux.stdout(`There are no apps in team ${color.team(team)}.`)
    else ux.stdout('You have no apps.')
  } else if (space) {
    hux.styledHeader(`Apps in space ${color.space(space)}`)
    listApps(apps)
  } else if (team) {
    hux.styledHeader(`Apps in team ${color.team(team)}`)
    listApps(apps)
  } else {
    apps = _.partition(apps, (app: App) => app.owner.email === user.email)
    if (apps[0].length > 0) {
      hux.styledHeader(`${color.user(user.email!)} Apps`)
      listApps(apps[0])
    }

    const columns = {
      Name: {get: regionizeAppName},
      // eslint-disable-next-line perfectionist/sort-objects
      Email: {get: ({owner}: any) => color.user(owner.email)},
    }

    if (apps[1].length > 0) {
      ux.stdout()
      hux.table(apps[1], columns, {title: 'Collaborated Apps\n', titleOptions: {bold: true}})
    }
  }
}

export default class AppsIndex extends Command {
  static description = 'list your apps'
  static examples = [
    color.command('heroku apps'),
  ]

  static flags = {
    all: flags.boolean({char: 'A', description: 'include apps in all teams'}),
    'internal-routing': flags.boolean({char: 'i', description: 'filter to Internal Web Apps', hidden: true}),
    json: flags.boolean({char: 'j', description: 'output in json format'}),

    personal: flags.boolean({char: 'p', description: 'list apps in personal account when a default team is set'}),
    space: flags.string({
      char: 's',
      completion: SpaceCompletion,
      description: 'filter by space',
    }),
    team: flags.team(),
  }

  static hiddenAliases = ['list', 'apps:list']

  static topic = 'apps'

  async run() {
    const {flags} = await this.parse(AppsIndex)

    const teamIdentifier = flags.team
    let team = (!flags.personal && teamIdentifier) ? teamIdentifier : null
    const {all, json, space} = flags
    const internalRouting = flags['internal-routing']
    if (space) {
      const teamResponse = await this.heroku.get<Heroku.Team>(`/spaces/${space}`)
      team = teamResponse.body.team.name
    }

    let path = '/users/~/apps'
    if (team) path = `/teams/${team}/apps`
    else if (all) path = '/apps'
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

    if (json) {
      hux.styledJSON(apps)
    } else {
      print(apps, user, space, team)
    }
  }
}
