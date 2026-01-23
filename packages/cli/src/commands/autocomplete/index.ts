import {flags} from '@heroku-cli/command'
import {AppCompletion, PipelineCompletion, SpaceCompletion, TeamCompletion} from '@heroku-cli/command/lib/completions.js'
import {color} from '@heroku/heroku-cli-util'
import {Args, Interfaces, ux} from '@oclif/core'

import * as path from 'path'

import {AutocompleteBase} from '../../lib/autocomplete/base.js'
import {updateCache} from '../../lib/autocomplete/cache.js'

import Create from './create.js'

export default class Index extends AutocompleteBase {
  static description = 'display autocomplete installation instructions'

  static args = {
    shell: Args.string({description: 'shell type', required: false}),
  }

  static flags: Interfaces.FlagInput = {
    'refresh-cache': flags.boolean({description: 'refresh cache only (ignores displaying instructions)', char: 'r'}),
  }

  static examples = [
    color.command('heroku autocomplete'),
    color.command('heroku autocomplete bash'),
    color.command('heroku autocomplete zsh'),
    color.command('heroku autocomplete --refresh-cache'),
  ]

  async run() {
    const {args, flags} = await this.parse(Index)
    const shell = args.shell || this.config.shell
    this.errorIfNotSupportedShell(shell)

    ux.action.start(`${color.bold('Building the autocomplete cache')}`)
    const create = new Create([], this.config)
    await create.run()
    await this.updateCache(AppCompletion, 'app')
    await this.updateCache(PipelineCompletion, 'pipeline')
    await this.updateCache(SpaceCompletion, 'space')
    await this.updateCache(TeamCompletion, 'team')
    ux.action.stop()

    if (!flags['refresh-cache']) {
      const {bin} = this.config
      const bashNote = 'If your terminal starts as a login shell you may need to print the init script into ~/.bash_profile or ~/.profile.'
      const zshNote = `After sourcing, you can run \`${color.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present`
      const note = shell === 'zsh' ? zshNote : bashNote
      const tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>'

      this.log(`
${color.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile and source it
${color.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}

NOTE: ${note}

2) Test it out, e.g.:
${color.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${color.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${color.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

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

