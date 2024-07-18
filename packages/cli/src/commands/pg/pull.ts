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

export default class Pull extends Command {
  static topic = 'pg'
  static description = heredoc`
    pull Heroku database into local or remote database
    Pull from SOURCE into TARGET.

    TARGET must be one of:
    * a database name (i.e. on a local PostgreSQL server)  => TARGET must not exist and will be created
    * a fully qualified URL to a local PostgreSQL server   => TARGET must not exist and will be created
    * a fully qualified URL to a remote PostgreSQL server  => TARGET must exist and be empty

    To delete a local database run ${color.cmd('dropdb TARGET')}.
    To create an empty remote database, run ${color.cmd('createdb')} with connection command-line options (run ${color.cmd('createdb --help')} for details).
  `

  static examples = [heredoc`
    # pull Heroku DB named postgresql-swimmingly-100 into local DB mylocaldb that must not exist
    $ heroku pg:pull postgresql-swimmingly-100 mylocaldb --app sushi
  `, heredoc`
    # pull Heroku DB named postgresql-swimmingly-100 into empty remote DB at postgres://myhost/mydb
    $ heroku pg:pull postgresql-swimmingly-100 postgres://myhost/mydb --app sushi
  `]

  static flags = {
    'exclude-table-data': flags.string({description: 'tables for which data should be excluded (use \';\' to split multiple names)', hasValue: true}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    source: Args.string({required: true}),
    target: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Pull)
    const {app, 'exclude-table-data': excludeTableData} = flags

    const exclusions = parseExclusions(excludeTableData)
    const source = await database(this.heroku, app, args.source)
    const target = parsePostgresConnectionString(args.target)

    ux.log(`Pulling ${color.cyan(source.attachment.addon.name)} to ${color.addon(args.target)}`)
    await this.pull(source, target, exclusions)
    ux.log('Pulling complete.')
  }

  protected async pull(
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
