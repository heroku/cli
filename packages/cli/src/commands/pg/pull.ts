import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {utils, pg} from '@heroku/heroku-cli-util'
// import {SpawnOptions, spawn} from 'node:child_process'
import childProcess from 'node:child_process'
import {nls} from '../../nls.js'
import {
  connArgs,
  maybeTunnel,
  parseExclusions,
  prepare,
  spawnPipe,
  verifyExtensionsMatch,
} from '../../lib/pg/push_pull.js'

const {env} = process
const heredoc = tsheredoc.default

export default class Pull extends Command {
  static args = {
    source: Args.string({required: true, description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
    target: Args.string({required: true, description: 'PostgreSQL connection string for the target database'}),
  }

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
    app: flags.app({required: true}),
    'exclude-table-data': flags.string({description: 'tables for which data should be excluded (use \';\' to split multiple names)', hasValue: true}),
    remote: flags.remote(),
  }

  static topic = 'pg'

  protected async pull(
    sourceIn: pg.ConnectionDetails,
    targetIn: pg.ConnectionDetails,
    exclusions: string[]) {
    await prepare(targetIn)

    const source = await maybeTunnel(sourceIn)
    const target = await maybeTunnel(targetIn)
    const exclude = exclusions.map(e => ('--exclude-table-data=' + e)).join(' ')

    const dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', ...connArgs(source, true)]

    if (exclude !== '') dumpFlags.push(exclude)

    const dumpOptions: { env: NodeJS.ProcessEnv } & childProcess.SpawnOptions = {
      env: {
        PGSSLMODE: 'prefer',
        ...env,
      } as { [key: string]: string },
      shell: true,
      stdio: ['pipe', 'pipe', 2],
    }
    if (source.password) dumpOptions.env.PGPASSWORD = source.password

    const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', ...connArgs(target)]

    const restoreOptions: { env: NodeJS.ProcessEnv } & childProcess.SpawnOptions = {
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
    const {args, flags} = await this.parse(Pull)
    const {app, 'exclude-table-data': excludeTableData} = flags

    const exclusions = parseExclusions(excludeTableData)
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const source = await dbResolver.getDatabase(app, args.source)
    const target = utils.pg.DatabaseResolver.parsePostgresConnectionString(args.target)

    ux.stdout(`Pulling ${color.cyan(source.attachment!.addon.name)} to ${color.addon(args.target)}`)
    await this.pull(source, target, exclusions)
    ux.stdout('Pulling complete.')
  }
}
