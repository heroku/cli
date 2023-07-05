import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as _ from 'lodash'

import {parse, quote} from '../../lib/config/quote'
import {Editor} from '../../lib/config/util'

const editor = new Editor()

interface Config {
  [key: string]: string;
}
interface UploadConfig {
  [key: string]: string | null;
}

function configToString(config: Config): string {
  return Object.keys(config)
    .sort()
    .map(key => {
      return `${key}=${quote(config[key])}`
    })
    .join('\n')
}

function removeDeleted(newConfig: UploadConfig, original: Config) {
  for (const k of Object.keys(original)) {
    // The api accepts empty strings
    // as valid env var values
    // In JS an empty string is falsey
    if (!newConfig[k] && newConfig[k] !== '') newConfig[k] = null
  }
}

export function stringToConfig(s: string): Config {
  return s.split('\n').reduce((config: Config, line: string): Config => {
    const error = () => {
      throw new Error(`Invalid line: ${line}`)
    }

    if (!line) return config
    const i = line.indexOf('=')
    if (i === -1) error()
    config[line.slice(0, i)] = parse(line.slice(i + 1)) || ''
    return config
  }, {})
}

function allKeys(a: Config, b: Config): string[] {
  return _.uniq([...Object.keys(a), ...Object.keys(b)].sort())
}

function showDiff(from: Config, to: Config) {
  for (const k of allKeys(from, to)) {
    if (from[k] === to[k]) continue
    if (k in from) {
      ux.log(color.red(`- ${k}=${quote(from[k])}`))
    }

    if (k in to) {
      ux.log(color.green(`+ ${k}=${quote(to[k])}`))
    }
  }
}

export default class ConfigEdit extends Command {
  static description = `interactively edit config vars
This command opens the app config in a text editor set by $VISUAL or $EDITOR.
Any variables added/removed/changed will be updated on the app after saving and closing the file.`

  static examples = [
    `# edit with vim
$ EDITOR="vim" heroku config:edit`,
    `# edit with emacs
$ EDITOR="emacs" heroku config:edit`,
    `# edit with pico
$ EDITOR="pico" heroku config:edit`,
    `# edit with atom editor
$ VISUAL="atom --wait" heroku config:edit`,
  ]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = [
    {name: 'key', optional: true, description: 'edit a single key'},
  ]

  app!: string

  async run() {
    const {flags: {app}, args: {key}} = await this.parse(ConfigEdit)
    this.app = app
    ux.action.start('Fetching config')
    const original = await this.fetchLatestConfig()
    ux.action.stop()
    let newConfig = {...original}
    const prefix = `heroku-${app}-config-`
    if (key) {
      newConfig[key] = await editor.edit(original[key], {prefix})
      if (!original[key].endsWith('\n') && newConfig[key].endsWith('\n')) newConfig[key] = newConfig[key].slice(0, -1)
    } else {
      const s = await editor.edit(configToString(original), {prefix, postfix: '.sh'})
      newConfig = stringToConfig(s)
    }

    if (!await this.diffPrompt(original, newConfig)) return
    ux.action.start('Verifying new config')
    await this.verifyUnchanged(original)
    ux.action.start('Updating config')
    removeDeleted(newConfig, original)
    await this.updateConfig(newConfig)
    ux.action.stop()
  }

  private async fetchLatestConfig() {
    const {body: original} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${this.app}/config-vars`)
    return original
  }

  private async diffPrompt(original: Config, newConfig: Config): Promise<boolean> {
    if (_.isEqual(original, newConfig)) {
      this.warn('no changes to config')
      return false
    }

    ux.log()
    ux.log('Config Diff:')
    showDiff(original, newConfig)
    ux.log()
    return ux.confirm(`Update config on ${color.app(this.app)} with these values?`)
  }

  private async verifyUnchanged(original: Config) {
    const latest = await this.fetchLatestConfig()
    if (!_.isEqual(original, latest)) {
      throw new Error('Config changed on server. Refusing to update.')
    }
  }

  private async updateConfig(newConfig: UploadConfig) {
    await this.heroku.patch(`/apps/${this.app}/config-vars`, {
      body: newConfig,
    })
  }
}
