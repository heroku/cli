import {color} from '@heroku-cli/color'
import {Command} from '@heroku-cli/command'
import {cli} from 'cli-ux'

export default class Remove extends Command {
  static description = 'remove a team from an enterprise account'

  static examples = [
    '$ heroku enterprise:teams:remove team-name'
  ]

  static args = [
    {name: 'team', required: true},
  ]

  async run() {
    const {args} = this.parse(Remove)
    const team = args.team
    const formattedTeam = color.cyan(team)

    cli.action.start(`Removing ${formattedTeam}`)
    await this.heroku.delete(`/teams/${team}`)
    cli.action.stop()
  }
}
