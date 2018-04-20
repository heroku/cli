import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {cli} from 'cli-ux'
import * as _ from 'lodash'

const shell = require('shell-quote')
const edit = require('edit-string')

interface Config {
  [key: string]: string
}
interface UploadConfig {
  [key: string]: string | null
}

function configToString(config: Config): string {
  return Object.keys(config)
    .sort()
    .map(key => {
      return `${key}=${quote(config[key])}`
    })
    .join('\n')
}

function stringToConfig(s: string): Config {
  return s.split('\n').reduce((config: Config, line: string): Config => {
    const error = () => {
      throw new Error(`Invalid line: ${line}`)
    }
    if (!line) return config
    let i = line.indexOf('=')
    if (i === -1) error()
    config[line.slice(0, i)] = parse(line.slice(i + 1))
    return config
  }, {})
}

function quote(a: string): string {
  a = a.replace(/\n/g, '\\n')
  if (a.match(/[:@]/)) return shell.quote([`'${a}`]).replace(/^"'/, '"')
  return shell.quote([a])
}

function parse(a: string): string {
  let parsed = shell.parse(a)
  if (parsed.length > 1) throw new Error(`Invalid token: ${a}`)
  return parsed[0].replace(/\\\\n/g, '\n')
}

function allKeys(a: Config, b: Config): string[] {
  return _.uniq([...Object.keys(a), ...Object.keys(b)].sort())
}

function showDiff(from: Config, to: Config) {
  for (let k of allKeys(from, to)) {
    if (from[k] === to[k]) continue
    if (from[k]) {
      cli.log(color.red(`${k}=${quote(from[k])}`))
    }
    if (to[k]) {
      cli.log(color.green(`${k}=${quote(to[k])}`))
    }
  }
}

export default class ConfigEdit extends Command {
  static description = 'interactively edit config vars'
  static help = `
This command opens the app config in a text editor set by $VISUAL or $EDITOR.
Any variables added/removed/changed will be updated on the app after saving and closing the file.

Examples:
    # edit with vim
    $ EDITOR="vim" heroku config:edit

    # edit with emacs
    $ EDITOR="emacs" heroku config:edit

    # edit with pico
    $ EDITOR="pico" heroku config:edit

    # edit with atom editor
    $ VISUAL="atom --wait" heroku config:edit

`
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  app!: string

  async run() {
    const {flags} = this.parse(ConfigEdit)
    this.app = flags.app
    cli.action.start('Fetching config')
    const original = await this.fetchLatestConfig()
    cli.action.stop()
    let newConfig = stringToConfig(
      await edit(configToString(original), {prefix: `heroku-${this.app}-config-`, postfix: '.sh'}),
    )
    if (!await this.diffPrompt(original, newConfig)) return
    cli.action.start('Verifying new config')
    await this.verifyUnchanged(original)
    cli.action.start('Updating config')
    await this.updateConfig(original, newConfig)
    cli.action.stop()
  }

  private async fetchLatestConfig() {
    const {body: original} = await this.heroku.get(`/apps/${this.app}/config-vars`)
    return original
  }

  private async diffPrompt(original: Config, newConfig: Config): Promise<boolean> {
    if (_.isEqual(original, newConfig)) {
      this.warn('no changes to config')
      return false
    }
    cli.log()
    cli.log('Config Diff:')
    showDiff(original, newConfig)
    cli.log()
    return cli.confirm(`Update config on ${color.app(this.app)} with these values?`)
  }

  private async verifyUnchanged(original: Config) {
    const latest = await this.fetchLatestConfig()
    if (!_.isEqual(original, latest)) {
      throw new Error('Config changed on server. Refusing to update.')
    }
  }

  private async updateConfig(original: Config, newConfig: UploadConfig) {
    for (let k of Object.keys(original)) {
      if (!newConfig[k]) newConfig[k] = null
    }
    await this.heroku.patch(`/apps/${this.app}/config-vars`, {
      body: newConfig,
    })
  }
}
