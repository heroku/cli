// @flow

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
    }

    if (!this.flags['skip-instructions']) {
      if (shell !== 'bash' && shell !== 'zsh') {
        cli.error(`Currently ${shell} is not a supported shell for autocomplete`)
      }

      let tabStr = shell === 'bash' ? '<TAB><TAB>' : '<TAB>'

      cli.log(`${cli.color.bold(`Setup Instructions for ${bin.toUpperCase()} CLI Autocomplete ---`)}

1) Add the autocomplete env var to your ${shell} profile

${cli.color.cyan(`$ printf "$(${bin} autocomplete:script ${shell})" >> ~/.${shell}rc`)}

2) Source your updated ${shell} profile

${cli.color.cyan(`$ source ~/.${shell}rc`)}
${
        shell === 'zsh'
          ? `
NOTE: After sourcing, you can run \`${cli.color.cyan('$ compaudit -D')}\` to ensure no permissions conflicts are present
`
          : ''
      }
3) Test command completion by pressing ${tabStr}, e.g.:

${cli.color.cyan(`$ ${bin} ${tabStr}`)}

4) Test flag completion by pressing ${tabStr}, e.g.:

${cli.color.cyan(`$ ${bin} apps:info --${tabStr}`)}

5) Test flag options completion by pressing ${tabStr}, e.g.:

${cli.color.cyan(`$ ${bin} apps:info --app=${tabStr}`)}
`)

      cli.log(`\n${cli.color.bold(`To uninstall ${bin.toUpperCase()} CLI Autocomplete:`)}
-- Uninstall this plugin from your CLI (for help see: ${cli.color.cyan(`${bin} help plugins:uninstall`)})
-- Delete the env var from your ${shell} profile & restart your terminal
`)
    }

    cli.action.start(`${cli.color.bold('Building autocomplete cache')}`)
    await AutocompleteCacheBuilder.run([], this.config)
    cli.action.stop()

    cli.log('\nEnjoy!')
  }
}
