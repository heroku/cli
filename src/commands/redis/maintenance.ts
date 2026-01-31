import {Command, flags} from '@heroku-cli/command'
import {App} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import redisApi, {RedisApiResponse, RedisMaintenanceWindowResponse} from '../../lib/redis/api.js'

const heredoc = tsheredoc.default

export default class Maintenance extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.', required: false}),
  }

  static description = heredoc`
  manage maintenance windows
  Set or change the maintenance window for your Redis instance
  `
  static flags = {
    app: flags.app({required: true}),
    force: flags.boolean({
      char: 'f',
      description: 'start maintenance without entering application maintenance mode',
      required: false,
    }),
    remote: flags.remote(),
    run: flags.boolean({description: 'start maintenance', required: false}),
    window: flags.string({
      char: 'w',
      description: 'set weekly UTC maintenance window (format: "Day HH:MM", where MM is 00 or 30)',
      hasValue: true,
      required: false,
    }),
  }

  static topic = 'redis'

  async run() {
    const {args, flags} = await this.parse(Maintenance)
    const {app: appName, force, run, window} = flags
    const {database} = args
    const api = redisApi(appName, database, false, this.heroku)

    const addon = await api.getRedisAddon()

    if (addon.plan.name?.match(/hobby/)) {
      ux.error('redis:maintenance is not available for hobby-dev instances', {exit: 1})
    }

    if (window) {
      if (!window.match(/[A-Za-z]{3,10} \d\d?:[03]0/)) {
        ux.error('Maintenance windows must be "Day HH:MM", where MM is 00 or 30.', {exit: 1})
      }

      const {body: maintenance} = await api.request<RedisMaintenanceWindowResponse>(
        `/redis/v0/databases/${addon.name}/maintenance_window`, 'PUT', {description: window},
      )
      ux.stdout(`Maintenance window for ${addon.name} (${addon.config_vars.join(', ')}) set to ${maintenance.window}.`)
      return
    }

    if (run) {
      const {body: app} = await this.heroku.get<App>(`/apps/${appName}`)
      if (!app.maintenance && !force) {
        ux.error('Application must be in maintenance mode or --force flag must be used', {exit: 1})
      }

      const {body: maintenance} = await api.request<RedisApiResponse>(`/redis/v0/databases/${addon.name}/maintenance`, 'POST')
      ux.stdout(maintenance.message)
      return
    }

    const {body: maintenance} = await api.request<RedisApiResponse>(`/redis/v0/databases/${addon.name}/maintenance`, 'GET')
    ux.stdout(maintenance.message)
  }
}
