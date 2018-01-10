// @flow

import { Config } from '@cli-engine/engine/lib/config'
import { Plugins } from '@cli-engine/engine/lib/plugins'
import { Plugin } from '@cli-engine/engine/lib/plugins/plugin'
import Command from '@heroku-cli/command'
import StreamOutput from 'cli-ux/lib/stream'
import * as moment from 'moment'
import * as path from 'path'

export abstract class AutocompleteBase extends Command {
  public errorIfWindows() {
    if (this.config.windows) {
      throw new Error('Autocomplete is not currently supported in Windows')
    }
  }

  public get completionsCachePath(): string {
    return path.join(this.config.cacheDir, 'completions')
  }

  public get acLogfile(): string {
    return path.join(this.config.cacheDir, 'autocomplete.log')
  }

  writeLogFile(msg: string) {
    StreamOutput.logToFile(`[${moment().format()}] ${msg}\n`, this.acLogfile)
  }

  protected async plugins(): Promise<Plugin[]> {
    const config = new Config(this.config)
    return await new Plugins(config).list()
  }
}
