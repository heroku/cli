import {flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
// @ts-expect-error - type definition may not be available in current TypeScript setup
import type {FlagInput} from '@oclif/core/lib/interfaces/parser'
import fs from 'fs-extra'
import * as path from 'path'
import {fileURLToPath} from 'url'

import {AutocompleteBase} from '../../lib/autocomplete/base.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default class Doctor extends AutocompleteBase {
  static hidden = true

  static description = 'autocomplete diagnostic'

  static args = {
    shell: Args.string({description: 'shell type', required: false}),
  }

  static flags: FlagInput = {
    verbose: flags.boolean({description: 'list completable commands'}),
  }

  async run() {
    const {args, flags} = await this.parse(Doctor)
    const shell = args.shell || this.config.shell
    const printLine: typeof this.log = (...args) => this.log(...args)
    this.errorIfNotSupportedShell(shell)

    const data = []

    // cli version
    data.push({name: 'cli version', value: this.config.version})

    // plugin version
    const pjsonPath = path.resolve(__dirname, '..', '..', '..', 'package.json')
    const pjson = await fs.readJSON(pjsonPath)
    data.push({name: 'plugin version', value: pjson.version})

    // check shell shim source env var
    // i.e. HEROKU_AC_<shell>_SETUP_PATH
    const shellProfilePath = path.join(process.env.HOME || '', shell === 'zsh' ? '.zshrc' : '.bashrc')
    let shimValue = 'missing'
    try {
      const shellProfile = await fs.readFile(shellProfilePath)
      const regex = /AC_\w+_SETUP_PATH/
      shimValue = regex.exec(shellProfile.toString()) ? 'present' : 'missing'
    } catch {
      // File doesn't exist or can't be read
      shimValue = 'missing'
    }
    data.push({name: `~/${shell === 'zsh' ? '.zshrc' : '.bashrc'} shimmed`, value: shimValue})

    // check shell shim
    const shellCompletion = path.join(this.autocompleteCacheDir, `${shell}_setup`)
    const shellCompletionValue = await fs.pathExists(shellCompletion) ? 'present' : 'missing'
    data.push({name: `${shell} shim file`, value: shellCompletionValue})

    // check shell command cache
    const shellCmdCache = path.join(this.autocompleteCacheDir, shell === 'zsh' ? 'commands_setters' : 'commands')
    const shellCmdCacheValue = await fs.pathExists(shellCmdCache) ? 'present' : 'missing'
    data.push({name: `${shell} commands cache`, value: shellCmdCacheValue})

    // check app completion cache
    const appsCache = path.join(this.completionsCacheDir, 'app')
    let appsCacheValue
    if (await fs.pathExists(appsCache)) {
      const cacheData = await fs.readJSON(appsCache)
      const length = cacheData.length
      appsCacheValue = length || 'empty'
    } else {
      appsCacheValue = 'missing'
    }

    data.push({name: 'apps completion cache', value: appsCacheValue})

    hux.table(data, {
      name: {},
      value: {},
    }, {
      // @ts-expect-error - no-header option exists but may not be in type definition
      'no-header': true,
      printLine,
    })

    if (flags.verbose) this.printList()
  }

  private printList() {
    this.log()
    const header = 'Completable Commands'
    this.log(header)
    this.log('='.repeat(header.length))
    this.config.plugins.forEach(p => {
      p.commands.forEach(c => {
        try {
          if (c.hidden) {
            this.log(`${c.id} (hidden)`)
          } else {
            const results = Object.keys(c.flags || {}).map((f: string) => {
              let out = `--${f}`
              const flag = c.flags[f]
              if (flag.type === 'option') out += '='
              const hasCompletion = 'completion' in flag || this.findCompletion(c.id, f, flag.description)
              if (hasCompletion) {
                out += '(c)'
              }

              if (flag.hidden) out += '(h)'
              return out
            })
            if (results.length > 0) this.log(`${c.id} -> ${results}`)
          }
        } catch {
          this.log(`Error creating autocomplete for command ${c.id}`)
        }
      })
    })
  }
}

