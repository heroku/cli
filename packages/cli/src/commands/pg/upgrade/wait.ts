import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import tsheredoc from 'tsheredoc'
import {pg, utils} from '@heroku/heroku-cli-util'
import notify from '../../../lib/notify.js'
import {PgUpgradeStatus} from '../../../lib/pg/types.js'
import {HTTPError} from '@heroku/http-call'
import {nls} from '../../../nls.js'
import {formatResponseWithCommands} from '../../../lib/pg/util.js'

const heredoc = tsheredoc.default

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

    const waitFor = async (db: pg.ExtendedAddonAttachment['addon']) => {
      const interval = (!waitInterval || waitInterval < 0) ? 5 : waitInterval
      let status
      let waiting = false
      let retries = 20
      const notFoundMessage = 'Waiting to provision...'

      while (true) {
        try {
          ({body: status} = await this.heroku.get<PgUpgradeStatus>(
            `/client/v11/databases/${db.id}/upgrade/wait_status`,
            {hostname: utils.pg.host()},
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
            ux.stdout(heredoc(`Waiting for database ${color.yellow(db.name)}... ${message}`))
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

    // This is actually incorrect, if we're only using one db we should make the database arg required and
    // just use the resolver to get the add-on to be waited on.
    // This looks similar to other implementations where you also can wait on all databases from the same app.
    // Maybe it was initially thought to implement this in the future, but it was never implemented.
    let dbs: pg.ExtendedAddonAttachment['addon'][] = []
    if (dbName) {
      const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
      const {addon} = await dbResolver.getAttachment(app, dbName)
      dbs = [addon]
    } else {
      ux.error(heredoc('You must provide a database. Run `--help` for more information on the command.'))
    }

    for (const db of dbs) {
      await waitFor(db)
    }
  }
}
