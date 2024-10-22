import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import heredoc from 'tsheredoc'
import {database} from '../../lib/pg/fetcher'
import {exec} from '../../lib/pg/psql'

export default class Ps extends Command {
  static topic = 'pg'
  static description = 'view active queries with execution time'
  static flags = {
    verbose: flags.boolean({char: 'v'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: 'config var exposed to the owning app containing the database configuration'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Ps)
    const {database: databaseName} = args
    const {verbose, app} = flags
    const db = await database(this.heroku, app, databaseName)
    const num = Math.random()
    const waitingMarker = `${num}${num}`
    const waitingQuery = heredoc(`
    SELECT '${num}' || '${num}'
    WHERE EXISTS
        (SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'pg_catalog'
           AND TABLE_NAME = 'pg_stat_activity'
           AND COLUMN_NAME = 'waiting')
    `)
    const waitingOutput = await exec(db, waitingQuery)
    const waiting = waitingOutput.includes(waitingMarker) ? 'waiting' : 'wait_event IS NOT NULL AS waiting'
    const query = heredoc(`SELECT pid,
           state,
           application_name AS SOURCE,
           usename AS username,
           age(now(), xact_start) AS running_for,
           xact_start AS transaction_start, ${waiting}, query
    FROM pg_stat_activity
    WHERE query <> '<insufficient privilege>' ${verbose ? '' : "AND state <> 'idle'"}
      AND pid <> pg_backend_pid()
    ORDER BY query_start DESC
    `)
    const output = await exec(db, query)
    process.stdout.write(output)
  }
}
