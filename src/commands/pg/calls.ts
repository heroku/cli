import {Command, flags} from '@heroku-cli/command'
import {color, pg, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {ensurePGStatStatement, newBlkTimeFields, newTotalExecTimeField} from '../../lib/pg/extras.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export async function generateCallsQuery(db: pg.ConnectionDetails, flags: {truncate?: boolean}): Promise<string> {
  await ensurePGStatStatement(db)

  const truncatedQueryString = flags.truncate
    ? 'CASE WHEN length(query) <= 40 THEN query ELSE substr(query, 0, 39) || \'…\' END'
    : 'query'

  const newTotalExecTime = await newTotalExecTimeField(db)
  const totalExecTimeField = newTotalExecTime ? 'total_exec_time' : 'total_time'

  const newBlkTime = await newBlkTimeFields(db)
  const blkReadField = newBlkTime ? 'shared_blk_read_time' : 'blk_read_time'
  const blkWriteField = newBlkTime ? 'shared_blk_write_time' : 'blk_write_time'

  return `
SELECT interval '1 millisecond' * ${totalExecTimeField} AS total_exec_time,
to_char((${totalExecTimeField}/sum(${totalExecTimeField}) OVER()) * 100, 'FM90D0') || '%'  AS prop_exec_time,
to_char(calls, 'FM999G999G999G990') AS ncalls,
interval '1 millisecond' * (${blkReadField} + ${blkWriteField}) AS sync_io_time,
${truncatedQueryString} AS query
FROM pg_stat_statements WHERE userid = (SELECT usesysid FROM pg_user WHERE usename = current_user LIMIT 1)
ORDER BY calls DESC
LIMIT 10
`.trim()
}

export default class PgCalls extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: false}),
  }
  static description = 'show 10 queries that have highest frequency of execution'
  static examples = [heredoc`
    ${color.command('heroku pg:calls --app example-app')}
  `, heredoc`
    # truncate queries to 40 characters
    ${color.command('heroku pg:calls --truncate --app example-app')}
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    truncate: flags.boolean({char: 't', description: 'truncate queries to 40 characters'}),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(PgCalls)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const db = await dbResolver.getDatabase(flags.app, args.database)
    const psqlService = new utils.pg.PsqlService(db)

    const query = await generateCallsQuery(db, flags)
    const output = await psqlService.execQuery(query)
    ux.stdout(output)
  }
}
