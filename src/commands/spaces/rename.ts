import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class Rename extends Command {
  static description = 'renames a space'
  static example = heredoc`
    ${color.command('heroku spaces:rename --from old-space-name --to new-space-name')}
    Renaming space old-space-name to new-space-name... done
  `

  static flags = {
    from: flags.string({description: 'current name of space', required: true}),
    to: flags.string({description: 'desired name of space', required: true}),
  }

  static topic = 'spaces'

  public async run(): Promise<void> {
    const {flags} = await this.parse(Rename)
    const {from, to} = flags
    ux.action.start(`Renaming space from ${color.space(from)} to ${color.info(to)}`)
    await this.heroku.patch(`/spaces/${from}`, {body: {name: to}})
    ux.action.stop()
  }
}
