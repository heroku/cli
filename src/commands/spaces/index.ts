/* eslint-disable perfectionist/sort-objects */
import {color, hux} from '@heroku/heroku-cli-util'
import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'

import {getGeneration} from '../../lib/apps/generation.js'
import {Space} from '../../lib/types/fir.js'

type SpaceArray = Array<Required<Space>>

export default class Index extends Command {
  static description = 'list available spaces'
  static flags = {
    json: Flags.boolean({description: 'output in json format'}),
    team: Flags.team(),
  }

  static topic = 'spaces'

  protected display(spaces: SpaceArray) {
    hux.table(
      spaces,
      {
        Name: {get: space => color.space(space.name)},
        Team: {get: space => color.team(space.team.name || '')},
        Region: {get: space => space.region.name},
        State: {
          get(space) {
            if (space.state === 'allocated') return color.success(space.state)
            if (space.state === 'deleting') return color.failure(space.state)
            return color.warning(space.state)
          },
        },
        Generation: {get: space => getGeneration(space)},
        createdAt: {
          header: 'Created At',
          get: space => space.created_at,
        },
      },
    )
  }

  protected displayJSON(spaces: SpaceArray) {
    ux.stdout(JSON.stringify(spaces, null, 2))
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {json, team} = flags
    let {body: spaces} = await this.heroku.get<SpaceArray>('/spaces', {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })
    if (team) {
      spaces = spaces.filter(s => s.team.name === team)
    }

    spaces = this.sortByName(spaces)

    if (json)
      this.displayJSON(spaces)
    else if (spaces.length === 0) {
      if (team)
        ux.error(`No spaces in ${color.team(team)}.`)
      else
        ux.error('You do not have access to any spaces.')
    } else {
      this.display(spaces)
    }
  }

  protected sortByName(spaces: SpaceArray) {
    spaces.sort((a, b) => a.name === b.name ? 0 : (a.name < b.name ? -1 : 1))
    return spaces
  }
}
