import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import heredoc from 'tsheredoc'
import {database} from '../../lib/pg/fetcher'
import {ConnectionDetails, parsePostgresConnectionString} from '../../lib/pg/util'
import {
  connArgs,
  maybeTunnel,
  parseExclusions,
  prepare,
  spawnPipe,
  verifyExtensionsMatch,
} from '../../lib/pg/push_pull'
import {SpawnOptions, spawn} from 'node:child_process'
const env = process.env

export default class Push extends Command {
  static topic = 'pg'
  static description = heredoc`
    push local or remote into Heroku database
    Push from SOURCE into TARGET. TARGET must be empty.

    To empty a Heroku database for push run ${color.cmd('heroku pg:reset')}

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
    'exclude-table-data': flags.string({description: 'tables for which data should be excluded (use \';\' to split multiple names)', hasValue: true}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    source: Args.string({required: true, description: 'PostgreSQL connection string for the source database'}),
    target: Args.string({required: true, description: 'unique name for the database add-on attachment. If omitted, we use DATABASE_URL.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Push)
    const {app, 'exclude-table-data': excludeTableData} = flags

    const exclusions = parseExclusions(excludeTableData)
    const source = parsePostgresConnectionString(args.source)
    const target = await database(this.heroku, app, args.target)

    ux.log(`Pushing ${color.cyan(args.source)} to ${color.addon(target.attachment.addon.name)}`)
    await this.push(source, target, exclusions)
    ux.log('Pushing complete.')
  }

  protected async push(
    sourceIn: ConnectionDetails,
    targetIn: ConnectionDetails,
    exclusions: string[]) {
    await prepare(targetIn)

    const source = await maybeTunnel(sourceIn)
    const target = await maybeTunnel(targetIn)
    const exclude = exclusions.map(function (e) {
      return '--exclude-table-data=' + e
    }).join(' ')

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', ...connArgs(source, true)]

    if (exclude !== '') dumpFlags.push(exclude)

    const dumpOptions: SpawnOptions & {env: NodeJS.ProcessEnv} = {
      env: {
        PGSSLMODE: 'prefer',
        ...env,
      } as {[key: string]: string},
      stdio: ['pipe', 'pipe', 2],
      shell: true,
    }
    if (source.password) dumpOptions.env.PGPASSWORD = source.password

    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', ...connArgs(target)]

    const restoreOptions: SpawnOptions & {env: NodeJS.ProcessEnv} = {
      env: {...env},
      stdio: ['pipe', 'pipe', 2],
      shell: true,
    }
    if (target.password) restoreOptions.env.PGPASSWORD = target.password

    const pgDump = spawn('pg_dump', dumpFlags, dumpOptions)
    const pgRestore = spawn('pg_restore', restoreFlags, restoreOptions)

    await spawnPipe(pgDump, pgRestore)

    if (source._tunnel) source._tunnel.close()
    if (target._tunnel) target._tunnel.close()

    await verifyExtensionsMatch(sourceIn, targetIn)
  }
}
