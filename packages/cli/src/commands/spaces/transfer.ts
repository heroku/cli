import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import heredoc from 'tsheredoc'

export default class Transfer extends Command {
  static topic = 'spaces'
  static description = 'transfer a space to another team'
  static examples = [heredoc(`
  $ heroku spaces:transfer --space=space-name --team=team-name
  Transferring space-name to team-name... done
  `)]

  static flags = {
    space: flags.string({required: true, char: 's', description: 'name of space'}),
    team: flags.string({required: true, description: 'desired owner of space'}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(Transfer)
    const space = flags.space
    const team = flags.team

    try {
      ux.action.start(`Transferring space ${color.yellow(space)} to team ${color.green(team)}`)
      await this.heroku.post(`/spaces/${space}/transfer`, {body: {new_owner: team}})
    } catch (error) {
      const {body: {message}} = error as {body: {message: string}}
      ux.error(message)
    } finally {
      ux.action.stop()
    }
  }
}
