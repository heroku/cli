import {flags} from '@heroku-cli/command'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions'
import chalk from 'chalk'
import {Args, ux} from '@oclif/core'
import {FlagInput} from '@oclif/core/lib/interfaces/parser'

import * as path from 'path'

import {AutocompleteBase} from '../../lib/autocomplete/base'
import {updateCache} from '../../lib/autocomplete/cache'

import Create from './create'

export default class Index extends AutocompleteBase {
  static description = 'display autocomplete installation instructions'

  static args = {
    shell: Args.string({description: 'shell type', required: false}),
  }

  static flags: FlagInput = {
    'refresh-cache': flags.boolean({description: 'refresh cache only (ignores displaying instructions)', char: 'r'}),
  }

  static examples = [
    '$ heroku autocomplete',
    '$ heroku autocomplete bash',
    '$ heroku autocomplete zsh',
    '$ heroku autocomplete --refresh-cache',
  ]

  async run() {
    const {args, flags} = await this.parse(Index)
    const shell = args.shell || this.config.shell
    this.errorIfNotSupportedShell(shell)

    ux.action.start(`${chalk.bold('Building the autocomplete cache')}`)
    await Create.run([], this.config)
    await this.updateCache(AppCompletion, 'app')
    await this.updateCache(PipelineCompletion, 'pipeline')
    await this.updateCache(SpaceCompletion, 'space')
    await this.updateCache(TeamCompletion, 'team')
    ux.action.stop()

    if (!flags['refresh-cache']) {
      const bin = this.config.bin
      const bashNote = 'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.'
      const zshNote = `After sourcing, you can run \`${chalk.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present`
      const note = shell === 'zsh' ? zshNote : bashNote
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>'

      this.log(`
${chalk.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile and source it
${chalk.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}

NOTE: ${note}

2) Test it out, e.g.:
${chalk.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${chalk.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${chalk.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!
`)
    }
  }

  private async updateCache(completion: any, cacheKey: string) {
    const cachePath = path.join(this.completionsCacheDir, cacheKey)
    const options = await completion.options({config: this.config})
    await updateCache(cachePath, options)
  }
}
