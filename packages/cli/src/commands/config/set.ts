import color from '@heroku-cli/color'
import {Command, flags, APIClient} from '@heroku-cli/command'
import {mapKeys, pickBy} from 'lodash'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'

const lastRelease = async (client: APIClient, app: string) => {
  const {body: releases} = await client.get<Heroku.Release[]>(`/apps/${app}/releases`, {
    method: 'GET',
    partial: true,
    headers: {Range: 'version ..; order=desc,max=1'},
  })
  return releases[0]
}

export default class Set extends Command {
  static description = 'set one or more config vars'
  static strict = false
  static aliases = ['config:add']
  static examples = [
    `$ heroku config:set RAILS_ENV=staging
Setting config vars and restarting example... done, v10
RAILS_ENV: staging

$ heroku config:set RAILS_ENV=staging RACK_ENV=staging
Setting config vars and restarting example... done, v11
RAILS_ENV: staging
RACK_ENV:  staging`,
  ]

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags, argv: _argv} = await this.parse(Set)
    const argv = _argv as string[]

    if (argv.length === 0) {
      ux.error('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.', {exit: 1})
    }

    const vars: Record<string, string> = {}
    argv.forEach((v: string) => {
      const idx = v.indexOf('=')
      if (idx === -1) {
        ux.error(`${color.cyan(v)} is invalid. Must be in the format ${color.cyan('FOO=bar')}.`)
        process.exit(1)
      }

      vars[v.slice(0, idx)] = v.slice(idx + 1)
      return vars
    })

    const varsCopy = argv.map((v: string) => color.green(v.split('=')[0])).join(', ')
    ux.action.start(`Setting ${varsCopy} and restarting ${color.app(flags.app)}`)

    let {body: config} = await this.heroku.patch<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`, {
      body: vars,
    })
    const release = await lastRelease(this.heroku, flags.app)
    ux.action.stop(`done, ${color.release('v' + release.version)}`)

    config = pickBy(config, (_, k) => vars[k])
    config = mapKeys(config, (_, k) => color.green(k))
    ux.styledObject(config)
    await this.config.runHook('recache', {type: 'config', app: flags.app})
  }
}

