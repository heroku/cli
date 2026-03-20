import type {pg} from '@heroku/heroku-cli-util'

import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import * as pgUtils from '@heroku/heroku-cli-util/utils/pg'
import {Args, ux} from '@oclif/core'
import childProcess from 'node:child_process'
import tsheredoc from 'tsheredoc'

import {
  connArgs,
  maybeTunnel,
  parseExclusions,
  prepare,
  spawnPipe,
  verifyExtensionsMatch,
} from '../../lib/pg/push_pull.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default
const {env} = process

export default class Push extends Command {
  static args = {
    source: Args.string({description: 'PostgreSQL connection string for the source database', required: true}),
    target: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`, required: true}),
  }

  static description = heredoc`
    push local or remote into Heroku database
    Push from SOURCE into TARGET. TARGET must be empty.

    To empty a Heroku database for push run ${color.code('heroku pg:reset')}

    SOURCE must be either the name of a database existing on your localhost or the
    fully qualified URL of a remote database.
  `

  static examples = [heredoc`
      # push mylocaldb into a Heroku DB named postgresql-swimmingly-100
      $ heroku pg:push mylocaldb postgresql-swimmingly-100 --app sushi
    `, heredoc`
      # push remote DB at postgres://myhost/mydb into a Heroku DB named postgresql-swimmingly-100
      $ heroku pg:push postgres://myhost/mydb postgresql-swimmingly-100 --app sushi
  `]

  static flags = {
    app: flags.app({required: true}),
    'exclude-table-data': flags.string({description: 'tables for which data should be excluded (use \';\' to split multiple names)', hasValue: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  protected async push(
    sourceIn: pg.ConnectionDetails,
    targetIn: pg.ConnectionDetails,
    exclusions: string[]) {
    await prepare(targetIn)

    const source = await maybeTunnel(sourceIn)
    const target = await maybeTunnel(targetIn)
    const exclude = exclusions.map(e => ('--exclude-table-data=' + e)).join(' ')

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', ...connArgs(source, true)]

    if (exclude !== '') dumpFlags.push(exclude)

    const dumpOptions: childProcess.SpawnOptions & { env: NodeJS.ProcessEnv } = {
      env: {
        PGSSLMODE: 'prefer',
        ...env,
      } as { [key: string]: string },
      shell: true,
      stdio: ['pipe', 'pipe', 2],
    }
    if (source.password) dumpOptions.env.PGPASSWORD = source.password

    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', ...connArgs(target)]

    const restoreOptions: childProcess.SpawnOptions & { env: NodeJS.ProcessEnv } = {
      env: {...env},
      shell: true,
      stdio: ['pipe', 'pipe', 2],
    }
    if (target.password) restoreOptions.env.PGPASSWORD = target.password

    const pgDump = childProcess.spawn('pg_dump', dumpFlags, dumpOptions)
    const pgRestore = childProcess.spawn('pg_restore', restoreFlags, restoreOptions)

    await spawnPipe(pgDump, pgRestore)

    if (source._tunnel) source._tunnel.close()
    if (target._tunnel) target._tunnel.close()

    await verifyExtensionsMatch(sourceIn, targetIn)
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Push)
    const {app, 'exclude-table-data': excludeTableData} = flags

    const exclusions = parseExclusions(excludeTableData)
    const source = pgUtils.DatabaseResolver.parsePostgresConnectionString(args.source)
    const dbResolver = new pgUtils.DatabaseResolver(this.heroku)
    const target = await dbResolver.getDatabase(app, args.target)

    ux.stdout(`Pushing ${color.cyan(args.source)} to ${color.addon(target.attachment!.addon.name)}`)
    await this.push(source, target, exclusions)
    ux.stdout('Pushing complete.')
  }
}
