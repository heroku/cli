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
import {formatResponseWithCommands} from '../../../lib/pg/util'

const wait = (ms: number) => new Promise(resolve => {
  setTimeout(resolve, ms)
})

export default class Wait extends Command {
  static topic = 'pg'
  static description = 'provides the status of an upgrade and blocks it until the operation is complete'
  static flags = {
    'wait-interval': flags.integer({description: 'how frequently to poll in seconds (to avoid rate limiting)'}),
    'no-notify': flags.boolean({description: 'do not show OS notification'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static examples = [
    heredoc(`
      # Wait for upgrade to complete with default settings
      $ heroku pg:upgrade:wait postgresql-curved-12345 --app myapp
    `),
    heredoc(`
      # Wait with custom polling interval
      $ heroku pg:upgrade:wait postgresql-curved-12345 --app myapp --wait-interval 10
    `),
    heredoc(`
      # Wait without showing OS notifications
      $ heroku pg:upgrade:wait postgresql-curved-12345 --app myapp --no-notify
    `),
  ]

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Wait)
    const {app, 'wait-interval': waitInterval} = flags
    const dbName = args.database
    const pgDebug = debug('pg')

    const waitFor = async (db: AddOnAttachmentWithConfigVarsAndPlan | AddOnWithRelatedData) => {
      const interval = (!waitInterval || waitInterval < 0) ? 5 : waitInterval
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
          if (error instanceof HTTPError && (!retries || error.statusCode !== 404)) {
            const httpError = error as HTTPError
            pgDebug(httpError)
            throw httpError
          }

          retries--
          status = {'waiting?': true, message: notFoundMessage}
        }

        let message = formatResponseWithCommands(status.message)
        if (status.step)
          message = heredoc(`(${status.step}) ${message}`)

        if (status['error?']) {
          notify('error', `${db.name} ${message}`, false)
          ux.error(message || '', {exit: 1})
        }

        if (!status['waiting?']) {
          if (waiting) {
            ux.action.stop(message)
          } else {
            ux.log(heredoc(`Waiting for database ${color.yellow(db.name)}... ${message}`))
          }

          return
        }

        if (!waiting) {
          waiting = true
          ux.action.start(`Waiting for database ${color.yellow(db.name)}`, message)
        }

        ux.action.status = message

        await wait(interval * 1000)
      }
    }

    let dbs: AddOnAttachmentWithConfigVarsAndPlan[] | AddOnWithRelatedData[] | [] = []
    if (dbName) {
      dbs = [await getAddon(this.heroku, app, dbName)]
    } else {
      ux.error(heredoc('You must provide a database. Run `--help` for more information on the command.'))
    }

    for (const db of dbs) {
      await waitFor(db)
    }
  }
}
