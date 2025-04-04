import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import heredoc from 'tsheredoc'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import notify from '../../../lib/notify'
import {AddOnAttachmentWithConfigVarsAndPlan, AddOnWithRelatedData, PgUpgradeStatus} from '../../../lib/pg/types'
import {HTTPError} from '@heroku/http-call'
import {nls} from '../../../nls'

const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default class Wait extends Command {
  static topic = 'pg'
  static description = 'blocks until database is available'
  static flags = {
    'wait-interval': flags.string({description: 'how frequently to poll in seconds (to avoid rate limiting)'}),
    'no-notify': flags.boolean({description: 'do not show OS notification'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:all-dbs:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Wait)
    const {app, 'wait-interval': waitInterval} = flags
    const dbName = args.database
    const pgDebug = debug('pg')

    const waitFor = async (db: AddOnAttachmentWithConfigVarsAndPlan | AddOnWithRelatedData) => {
      let interval = waitInterval && Number.parseInt(waitInterval, 10)
      if (!interval || interval < 0) interval = 5
      let status
      let waiting = false
      let retries = 20
      const notFoundMessage = 'Waiting to provision...'

      while (true) {
        try {
          ({body: status} = await this.heroku.get<PgUpgradeStatus>(
            `/client/v11/databases/${db.id}/upgrade/wait_status`,
            {hostname: pgHost()},
          ))
        } catch (error) {
          const httpError = error as HTTPError
          pgDebug(httpError)
          if (!retries || httpError.statusCode !== 404) throw httpError
          retries--
          status = {'waiting?': true, message: notFoundMessage}
        }

        if (status['error?']) {
          notify('error', `${db.name} ${status.message}`, false)
          ux.error(status.message || '', {exit: 1})
        }

        if (!status['waiting?']) {
          if (waiting) {
            ux.action.stop(status.message)
          }

          return
        }

        if (!waiting) {
          waiting = true
          ux.action.start(`Waiting for upgrade on database ${color.yellow(db.name)}`, status.message)
        }

        ux.action.status = status.message

        await wait(interval * 1000)
      }
    }

    let dbs: AddOnAttachmentWithConfigVarsAndPlan[] | AddOnWithRelatedData[] | [] = []
    if (dbName) {
      dbs = [await getAddon(this.heroku, app, dbName)]
    } else {
      ux.error(heredoc('Please provide a database.'))
    }

    for (const db of dbs) {
      await waitFor(db)
    }
  }
}
