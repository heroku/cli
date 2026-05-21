import {Command, flags} from '@heroku-cli/command'
import {SpaceCompletion} from '@heroku-cli/command/lib/completions.js'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'

import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {App} from '../../lib/types/app.js'

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
    const _ = await lazyModuleLoader.loadLodash()

    const {flags} = await this.parse(AppsIndex)

    const teamIdentifier = flags.team
    let team = (!flags.personal && teamIdentifier) ? teamIdentifier : null
    const {all, json, space} = flags
    const internalRouting = flags['internal-routing']

    const sdk = new HerokuSDK()
    const {platform} = sdk

    if (space) {
      const spaceInfo = await platform.space.info(space)
      team = spaceInfo.team?.name ?? null
    }

    const [appsList, user] = await Promise.all([
      (async () => {
        if (team) return platform.teamApp.listByTeam(team)
        if (all) return platform.app.list()
        return platform.app.listOwnedAndCollaborated('~')
      })(),
      platform.account.info(),
    ])

    let apps = appsList as unknown as App[]

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
      print(apps, user, space, team, _)
    }
  }
}

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

function listApps(apps: App[]) {
  apps.forEach((app: App) => ux.stdout(regionizeAppName(app)))
}

function print(apps: App[], user: {email?: string}, space: string | undefined, team: null | string | undefined, _: any) {
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
    const [ownedApps, collabApps] = _.partition(apps, (app: App) => app.owner.email === user.email)
    if (ownedApps.length > 0) {
      hux.styledHeader(`${color.user(user.email!)} Apps`)
      listApps(ownedApps)
    }

    const columns = {
      Name: {get: regionizeAppName},
      // eslint-disable-next-line perfectionist/sort-objects
      Email: {get: ({owner}: any) => color.user(owner.email)},
    }

    if (collabApps.length > 0) {
      ux.stdout()
      hux.table(collabApps, columns, {title: 'Collaborated Apps\n', titleOptions: {bold: true}})
    }
  }
}

function regionizeAppName(app: App) {
  const name = annotateAppName(app)
  if (app.region && app.region.name !== 'us') {
    return `${name} (${color.info(app.region.name)})`
  }

  return name
}
