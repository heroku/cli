import { ICommand } from '@cli-engine/config'
import { flags as Flags } from '@heroku-cli/command'
import { cli } from 'cli-ux'

import { AutocompleteBase } from '../../autocomplete'
import { PluginLegacy } from '../../legacy'

export default class AutocompleteList extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'listflagcompletions'
  static description = 'debugger for autocomplete'
  static hidden = true
  static flags = {
    missing: Flags.boolean({ required: false }),
  }

  async run() {
    const Legacy = new PluginLegacy(this.config)
    const plugins = await this.plugins()
    await Promise.all(
      plugins.map(async p => {
        let cmds = (await p.load()).commands || []
        return Promise.all(
          cmds.map(async (c: any) => {
            try {
              if (c.hidden) return
              let Command: ICommand = await c.fetchCommand()
              Command = typeof Command === 'function' ? Command : Legacy.convertFromV5(Command as any)
              const flags: any = Command.flags
              let results = Object.keys(flags).filter((f: any) => {
                let flag = flags[f]
                if (this.flags.missing) {
                  return flag.parse && !flag.completion && !this.findCompletion(f, c.id)
                }
                return flag.parse && (flag.completion || this.findCompletion(f, c.id))
              })
              if (results.length) cli.log(`${c.id} -> ${results}`)
            } catch (err) {
              cli.log(`Error creating autocomplete for command ${c.id}`)
            }
          }),
        )
      }),
    )
  }
}
