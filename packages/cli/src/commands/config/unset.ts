import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import * as _ from 'lodash'

export class ConfigUnset extends Command {
  static hiddenAliases = [
    'config:remove',
  ]

  static description = 'unset one or more config vars'

  static examples = [
    `$ heroku config:unset RAILS_ENV
Unsetting RAILS_ENV and restarting example... done, v10`,
    `$ heroku config:unset RAILS_ENV RACK_ENV
Unsetting RAILS_ENV, RACK_ENV and restarting example... done, v10`,
  ]

  static strict = false

  static flags = {
    app: flags.app({char: 'a', required: true}),
    remote: flags.remote({char: 'r'}),
  }

  async run() {
    const parsed = await this.parse(ConfigUnset)
    const {flags} = parsed
    const argv = parsed.argv as string[]
    const lastRelease = async () => {
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${flags.app}/releases`, {
        partial: true,
        headers: {Range: 'version ..; order=desc,max=1'},
      })
      return releases[0]
    }

    if (argv.length === 0) {
      this.error('Usage: heroku config:unset KEY1 [KEY2 ...]\nMust specify KEY to unset.')
    }

    const vars = argv.map(v => color.configVar(v)).join(', ')

    ux.action.start(`Unsetting ${vars} and restarting ${color.app(flags.app)}`)
    await this.heroku.patch(`/apps/${flags.app}/config-vars`, {
      // body will be like {FOO: null, BAR: null}
      body: _.reduce(argv, (vars, v) => {
        vars[v] = null
        return vars
      }, {} as {[k: string]: null}),
    })
    const release = await lastRelease()
    ux.action.stop('done, ' + color.release(`v${release.version}`))
  }
}
