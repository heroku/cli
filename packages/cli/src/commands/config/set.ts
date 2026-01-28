import {color, hux} from '@heroku/heroku-cli-util'
import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

const lastRelease = async (client: APIClient, app: string) => {
  const {body: releases} = await client.get<Heroku.Release[]>(`/apps/${app}/releases`, {
    headers: {Range: 'version ..; order=desc,max=1'},
    method: 'GET',
    partial: true,
  })
  return releases[0]
}

export default class Set extends Command {
  static description = 'set one or more config vars'
  static examples = [heredoc(`
${color.command('heroku config:set RAILS_ENV=staging')}
Setting config vars and restarting example... done, v10
RAILS_ENV: staging)`), heredoc(`
${color.command('heroku config:set RAILS_ENV=staging RACK_ENV=staging')}
Setting config vars and restarting example... done, v11
RAILS_ENV: staging
RACK_ENV:  staging`)]

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static hiddenAliases = ['config:add']

  static strict = false

  async run() {
    const {argv: _argv, flags} = await this.parse(Set)
    const argv = _argv as string[]

    if (argv.length === 0) {
      ux.error('Usage: heroku config:set KEY1=VALUE1 [KEY2=VALUE2 ...]\nMust specify KEY and VALUE to set.', {exit: 1})
    }

    const vars: Record<string, string> = {}
    argv.forEach((v: string) => {
      const idx = v.indexOf('=')
      if (idx === -1) {
        ux.error(`${color.cyan(v)} is invalid. Must be in the format ${color.cyan('FOO=bar')}.`, {exit: 1})
      }

      vars[v.slice(0, idx)] = v.slice(idx + 1)
    })

    const varsCopy = argv.map((v: string) => color.name(v.split('=')[0])).join(', ')
    ux.action.start(`Setting ${varsCopy} and restarting ${color.app(flags.app)}`)

    let {body: config} = await this.heroku.patch<Heroku.ConfigVars>(`/apps/${flags.app}/config-vars`, {
      body: vars,
    })
    const release = await lastRelease(this.heroku, flags.app)
    ux.action.stop(`done, ${color.name('v' + release.version)}`)

    config = Object.fromEntries(
      Object.entries(config)
        .filter(([k]) => vars[k])
        .map(([k, v]) => [color.name(k), v]),
    )
    hux.styledObject(config)
    await this.config.runHook('recache', {app: flags.app, type: 'config'})
  }
}
