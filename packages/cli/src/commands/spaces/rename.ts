import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import heredoc from 'tsheredoc'

export default class Rename extends Command {
  static topic = 'spaces';
  static description = 'renames a space';
  static example = heredoc(`
    $ heroku spaces:rename --from old-space-name --to new-space-name
    Renaming space old-space-name to new-space-name... done
  `)

  static flags = {
    from: flags.string({required: true, description: 'current name of space'}),
    to: flags.string({required: true, description: 'desired name of space'}),
  };

  public async run(): Promise<void> {
    const {flags} = await this.parse(Rename)
    const {to, from} = flags
    ux.action.start(`Renaming space from ${color.cyan(from)} to ${color.green(to)}`)
    await this.heroku.patch(`/spaces/${from}`, {body: {name: to}})
    ux.action.stop()
  }
}
