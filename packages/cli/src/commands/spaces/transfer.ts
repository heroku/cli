import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Transfer extends Command {
  static description = 'transfer a space to another team'
  static examples = [heredoc(color.command(`
  $ heroku spaces:transfer --space=space-name --team=team-name
  Transferring space-name to team-name... done
  `))]

  static flags = {
    space: flags.string({char: 's', description: 'name of space', required: true}),
    team: flags.string({char: 't', description: 'desired owner of space', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Transfer)
    const {space} = flags
    const {team} = flags

    try {
      ux.action.start(`Transferring space ${color.space(space)} to team ${color.green(team)}`)
      await this.heroku.post(`/spaces/${space}/transfer`, {body: {new_owner: team}})
    } catch (error) {
      const {body: {message}} = error as {body: {message: string}}
      ux.error(message)
    } finally {
      ux.action.stop()
    }
  }
}
