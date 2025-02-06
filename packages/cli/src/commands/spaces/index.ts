import color from '@heroku-cli/color'
import {Command, flags as Flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import {Space} from '../../lib/types/fir'
import {getGeneration} from '../../lib/apps/generation'

type SpaceArray = Array<Required<Space>>

export default class Index extends Command {
  static topic = 'spaces'
  static description = 'list available spaces'
  static flags = {
    json: Flags.boolean({description: 'output in json format'}),
    team: Flags.team(),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Index)
    const {team, json} = flags
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
        ux.error(`No spaces in ${color.cyan(team)}.`)
      else
        ux.error('You do not have access to any spaces.')
    } else {
      this.display(spaces)
    }
  }

  protected sortByName(spaces: SpaceArray) {
    spaces.sort((a, b) => {
      return a.name === b.name ? 0 : (a.name < b.name ? -1 : 1)
    })
    return spaces
  }

  protected displayJSON(spaces: SpaceArray) {
    ux.log(JSON.stringify(spaces, null, 2))
  }

  protected display(spaces: SpaceArray) {
    ux.table(
      spaces,
      {
        Name: {get: space => space.name},
        Team: {get: space => space.team.name},
        Region: {get: space => space.region.name},
        State: {get: space => space.state},
        Generation: {get: space => getGeneration(space)},
        createdAt: {
          header: 'Created At',
          get: space => space.created_at,
        },
      },
    )
  }
}
