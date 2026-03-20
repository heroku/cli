import type {pg} from '@heroku/heroku-cli-util'

import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import * as utils from '@heroku/heroku-cli-util/utils'
import {HTTPError} from '@heroku/http-call'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/baseCommand.js'
import {WaitStatus} from '../../../lib/data/types.js'
import notify from '../../../lib/notify.js'

const heredoc = tsheredoc.default

export default class DataPgWait extends BaseCommand {
  static args = {
    database: Args.string({
      description: 'database name, database attachment name, or related config var on an app',
      required: true,
    }),
  }

  static description = 'show status of an operation until it\'s complete'

  static examples = [
    heredoc(`
      # Wait for database to be available
      ${color.command('heroku data:pg:wait DATABASE --app myapp')}
    `),
  ]

  static flags = {
    app: Flags.app({required: true}),
    'no-notify': Flags.boolean({
      description: 'do not show OS notification',
    }),
    remote: Flags.remote(),
    'wait-interval': Flags.integer({
      default: 5,
      description: 'how frequently to poll in seconds (to avoid rate limiting)',
      min: 1,
    }),
  }

  public async notify(...args: Parameters<typeof notify>): Promise<void> {
    return notify(...args)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(DataPgWait)
    const {database} = args
    const {app, 'no-notify': noNotify, 'wait-interval': waitInterval} = flags
    const databaseResolver = new utils.DatabaseResolver(this.heroku)
    const db = await databaseResolver.getAttachment(app, database)
    const {addon} = db

    if (!utils.isAdvancedDatabase(addon)) {
      ux.error(heredoc`
        You can only use this command on Advanced-tier databases.
        Run ${color.code(`heroku pg:wait ${addon.name} -a ${app}`)} instead.`)
    }

    await this.waitFor(addon, waitInterval || 5, noNotify)
  }

  public async wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }

  private async waitFor(addon: pg.ExtendedAddonAttachment['addon'], interval: number, noNotify: boolean): Promise<void> {
    let status: WaitStatus = {message: null, waiting: true}
    let waiting = false
    let retries = 20
    const notFoundMessage = 'Waiting to provision...'

    while (status.waiting) {
      try {
        const response = await this.dataApi.get<WaitStatus>(`/data/postgres/v1/${addon.id}/wait_status`)
        status = response.body
      } catch (error) {
        const httpError = error as HTTPError
        if (!retries || httpError.statusCode !== 404) {
          if (waiting) {
            ux.action.stop(color.red('!'))
          }

          throw httpError
        }

        retries--
        status = {message: notFoundMessage, waiting: true}
      }

      if (!status.waiting) {
        if (waiting) {
          ux.action.stop(status.message || 'available')
        } else {
          ux.stdout(`${color.datastore(addon.name)} is available.`)
        }

        break
      }

      if (!waiting) {
        waiting = true
        ux.action.start(`Waiting for database ${color.addon(addon.name)}`, status.message || undefined)
      }

      ux.action.status = status.message || undefined

      await this.wait(interval * 1000)
    }

    if (!noNotify && waiting) {
      this.notify('heroku data:pg:wait', `Database ${addon.name} is now available`)
    }
  }
}
