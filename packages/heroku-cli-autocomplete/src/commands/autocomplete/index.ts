import { flags } from '@heroku-cli/command'
import { cli } from 'cli-ux'

import { AutocompleteBase } from '../../autocomplete'

import AutocompleteCacheBuilder from './cache'

export default class Autocomplete extends AutocompleteBase {
  static topic = 'autocomplete'
  static description = 'display autocomplete instructions'
  // hide until public release
  static hidden = true
  static args = [{ name: 'shell', description: 'shell type', required: false }]
  static flags = {
    'skip-instructions': flags.boolean({ description: 'Do not show installation instructions', char: 's' }),
  }

  async run() {
    this.errorIfWindows()

    const bin = this.config.bin
    const shell = this.argv[0] || this.config.shell
    if (!shell) {
      cli.error('Error: Missing required argument shell')
    } else if (shell !== 'bash' && shell !== 'zsh') {
      cli.error(`Currently ${shell} is not a supported shell for autocomplete`)
    }

    cli.action.start(`${cli.color.bold('Building the autocomplete cache')}`)
    await AutocompleteCacheBuilder.run([], this.config)
    cli.action.stop()

    if (!this.flags['skip-instructions']) {
      let tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>'

      cli.log(`
${cli.color.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile and source it
${cli.color.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc; source ~/.${shell}rc`)}
${
        shell === 'zsh'
          ? `
NOTE: After sourcing, you can run \`${cli.color.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present
`
          : ''
      }
2) Test it out, e.g.:
${cli.color.cyan(`$ ${bin} ${tabStr}`)}                 # Command completion
${cli.color.cyan(`$ ${bin} apps:info --${tabStr}`)}     # Flag completion
${cli.color.cyan(`$ ${bin} apps:info --app=${tabStr}`)} # Flag option completion

Visit the autocomplete Dev Center doc at https://devcenter.heroku.com/articles/heroku-cli-autocomplete

Enjoy!
`)
    }
  }
}
