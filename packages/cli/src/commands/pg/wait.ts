import color from '@heroku-cli/color'
import {APIClient, Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import * as path from 'path'
import {all, getAddon} from '../../lib/pg/fetcher'
import pgHost from '../../lib/pg/host'
import notify from '../../lib/notify'
import {AddOnAttachmentWithConfigVarsAndPlan, AddOnWithRelatedData} from '../../lib/pg/types'

export default class Wait extends Command {
  static topic = 'pg';
  static description = 'blocks until database is available';
  static flags = {
    'wait-interval': flags.string({description: 'how frequently to poll in seconds (to avoid rate limiting)'}),
    'no-notify': flags.boolean({description: 'do not show OS notification'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string(),
  };

  waitFor = async function waitFor(heroku: APIClient, db: AddOnAttachmentWithConfigVarsAndPlan | AddOnWithRelatedData, waitInterval: string | undefined, debug) {
    let interval = Number.parseInt(waitInterval || '0')
    if (!interval || interval < 0)
      interval = 5
    let status
    let waiting = false
    let name = 'db'
    let retries = 20
    while (true) {
      try {
        status = await heroku.request({
          host: pgHost(), path: `/client/v11/databases/${db.id}/wait_status`,
        })
      } catch (error) {
        debug(error)
        if (!retries || error.statusCode !== 404)
          throw error
        retries--
        status = {'waiting?': true}
      }

      if (status['error?']) {
        notify({
          sound: true, subtitle: 'error', message: `${name} ${status.message}`, contentImage: path.join(__dirname, '../assets/error.png'),
        })
        ux.error(status.message)
        ux.exit(1)
      }

      if (!status['waiting?']) {
        if (waiting) {
          notify({
            sound: true, message: `${name} is ${status.message}`, contentImage: path.join(__dirname, '../assets/success.png'),
          })
          ux.action.done(status.message)
        }

        return
      }

      if (!waiting) {
        waiting = true
        name = db.name
        ux.action.start(`Waiting for database ${color.yellow(db.name)}`)
      }

      ux.action.status(status.message)
      const wait = (ms: number | undefined) => new Promise(resolve => setTimeout(resolve, ms))
      await wait(interval * 1000)
    }
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Wait)
    const debug = require('debug')('heroku-pg')
    const {app, 'wait-interval': waitInterval} = flags
    const dbName = args.database

    let dbs: AddOnAttachmentWithConfigVarsAndPlan[] | AddOnWithRelatedData[] | [] = []
    if (dbName) {
      dbs = [await getAddon(this.heroku, app, dbName)]
    } else {
      dbs = await all(this.heroku, app)
    }

    for (const db of dbs)
      await this.waitFor(this.heroku, db, waitInterval, debug)
  }
}
