import {flags} from '@heroku-cli/command'
import {ux} from 'cli-ux'
import * as fs from 'fs-extra'
import * as path from 'path'

import {AutocompleteBase} from '../../base'

export default class Doctor extends AutocompleteBase {
  static hidden = true
  static description = 'autocomplete diagnostic'
  static args = [
    {name: 'shell', description: 'shell type', required: false},
  ]
  static flags = {
    verbose: flags.boolean({description: 'list completable commands'}),
  }

  async run() {
    const {args, flags} = this.parse(Doctor)
    const shell = args.shell || this.config.shell
    this.errorIfNotSupportedShell(shell)

    let data = []

    // cli version
    data.push({name: 'cli version', value: this.config.version})

    // plugin version
    const pjson = require(path.resolve(__dirname, '..', '..', '..', 'package.json'))
    data.push({name: 'plugin version', value: pjson.version})

    // check shell shim source env var
    // i.e. HEROKU_AC_<shell>_SETUP_PATH
    const shellProfilePath = path.join(process.env.HOME || '', shell === 'zsh' ? '.zshrc' : '.bashrc')
    const shellProfile = fs.readFileSync(shellProfilePath)
    const regex = /AC_\w+_SETUP_PATH/
    const shimVlaue = regex.exec(shellProfile.toString()) ? 'present' : 'missing'
    data.push({name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`, value: shimVlaue})

    // check shell shim
    const shellCompletion = path.join(this.autocompleteCacheDir, `${shell}_setup`)
    const shellCompletionValue = fs.existsSync(shellCompletion) ? 'present' : 'missing'
    data.push({name: `${shell} shim file`, value: shellCompletionValue})

    // check shell command cache
    const shellCmdCache = path.join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands')
    const shellCmdCacheValue = fs.existsSync(shellCmdCache) ? 'present' : 'missing'
    data.push({name: `${shell} commands cache`, value: shellCmdCacheValue})

    // check app completion cache
    const appsCache = path.join(this.completionsCacheDir, 'app')
    let appsCacheValue
    if (fs.existsSync(appsCache)) {
      let length = fs.readJSONSync(appsCache).length
      appsCacheValue = length ? length : 'empty'
    } else {
      appsCacheValue = 'missing'
    }

    data.push({name: 'apps completion cache', value: appsCacheValue})

    ux.table(data, {
      printHeader: undefined,
      columns: [
          {key: 'name'},
          {key: 'value'},
      ]
    })

    if (flags.verbose) this.printList()
  }

  private printList() {
    this.log()
    const header = 'Completable Commands'
    this.log(header)
    this.log('='.repeat(header.length))
    this.config.plugins.map(p => {
      p.commands.map(c => {
        try {
          if (c.hidden) {
            this.log(`${c.id} (hidden)`)
          } else {
            let results = Object.keys(c.flags).map((f: string) => {
              let out = `--${f}`
              let flag = c.flags[f]
              if (flag.type === 'option') out += '='
              if (flag.hasOwnProperty('completion') || this.findCompletion(c.id, f, flag.description)) {
                out += '(c)'
              }
              if (flag.hidden) out += '(h)'
              return out
            })
            if (results.length) this.log(`${c.id} -> ${results}`)
          }
        } catch {
          this.log(`Error creating autocomplete for command ${c.id}`)
        }
      })
    })
  }
}
