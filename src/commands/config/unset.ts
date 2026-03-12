import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export class ConfigUnset extends Command {
  static aliases = [
    'config:remove',
  ]

  static description = 'unset one or more config vars'

  static examples = [heredoc(`
    ${color.command('heroku config:unset RAILS_ENV')}
Unsetting RAILS_ENV and restarting example... done, v10`), heredoc(`
    ${color.command('heroku config:unset RAILS_ENV RACK_ENV')}
Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10`)]

  static flags = {
    app: flags.app({char: 'a', required: true}),
    remote: flags.remote({char: 'r'}),
  }

  static strict = false

  async run() {
    const parsed = await this.parse(ConfigUnset)
    const {flags} = parsed
    const argv = parsed.argv as string[]
    const lastRelease = async () => {
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${flags.app}/releases`, {
        headers: {Range: 'version ..; order=desc,max=1'},
        partial: true,
      })
      return releases[0]
    }

    if (argv.length === 0) {
      this.error('Usage: heroku config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.')
    }

    const vars = argv.map(v => color.name(v)).join(', ')

    ux.action.start(`Unsetting ${vars} and restarting ${color.app(flags.app)}`)
    await this.heroku.patch(`/apps/${flags.app}/config-vars`, {
      // body will be like {FOO: null, BAR: null}
      body: Object.fromEntries(argv.map(v => [v, null])),
    })
    const release = await lastRelease()
    ux.action.stop('done, ' + color.name(`v${release.version}`))
  }
}
