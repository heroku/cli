// @flow

import {flags} from 'cli-engine-command'
import {AutocompleteBase} from '../../autocomplete'
// import ACScripter from '../../autocomplete'
import Plugins from 'cli-engine/lib/plugins'
import ACCache from '../../cache'
import path from 'path'

export default class AutocompleteValues extends AutocompleteBase {
  static topic = 'autocomplete'
  static command = 'values'
  static description = 'generates autocomplete values'
  static hidden = true
  static flags = {
    // don't require cmd or flag
    // we want it to run silently
    // or autocomplete will use any
    // flag errors as options
    cmd: flags.string({description: '', char: 'c'}),
    resource: flags.string({description: '', char: 'r'}),
    arg: flags.boolean({description: '', char: 'a'})
  }

  async run () {
    try {
      this.errorIfWindows()

      // handle missing flags e, not in parser
      if (!this.flags.cmd) throw new Error('Missing required value for --cmd')
      if (!this.flags.resource) throw new Error('Missing required value for --resource')

      // find Command
      const plugins = new Plugins(this.out)
      await plugins.load()
      let Command = await plugins.findCommand(this.flags.cmd)
      if (!Command) throw new Error(`Command ${this.flags.cmd} not found`)

      // get cache key and options
      let cacheKey = 'void'
      let cacheCompletion : ?Object
      if (this.flags.arg) {
        let args = Command ? Command.args : []
        let arg = args.find(a => a.name === this.flags.resource)
        if (!arg) throw new Error(`Arg ${this.flags.resource} not found`)
        cacheKey = arg.name
        cacheCompletion = arg.completion
      } else {
        let long = this.flags.resource.replace(/^-+/, '')
        let flags = Command ? Command.flags : {}
        let flag = flags[long]
        if (!flag) throw new Error(`Flag ${long} not found`)
        cacheKey = long
        cacheCompletion = flag.completion
      }

      // create/fetch cache
      if (cacheCompletion && cacheCompletion.options) {
        const key = (cacheCompletion.cacheKey || cacheKey)
        const flagCache = path.join(this.completionsPath, key)
        const duration = cacheCompletion.cacheDuration || 60 * 60 * 24 // 1 day
        const cacheFunc = cacheCompletion.options(this.out)
        const opts = {cacheFn: () => cacheFunc}
        const options = await ACCache.fetch(flagCache, duration, opts)
        this.out.log((options || []).join('\n'))
      }
    } catch (err) {
      // TODO: fix error logging
      // const ac = new ACScripter(this)
      // fail silently
      // or autocomplete will use error as options
      // ac.writeLogFile(err.message)
    }
  }
}
