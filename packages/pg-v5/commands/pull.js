'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const debug = require('debug')('push')
const psql = require('../lib/psql')
const bastion = require('../lib/bastion')
const cp = require('child_process')
const util = require('../lib/util')

const env = process.env

function parseExclusions (rawExcludeList) {
  return (rawExcludeList || '').split(';').map(function (tname) {
    return tname.trim()
  }).filter(function (tname) {
    return (tname !== '')
  })
}

function exec (cmd, opts = {}) {
  debug(cmd)
  opts = Object.assign({}, opts, { stdio: 'inherit' })
  try {
    return cp.execSync(cmd, opts)
  } catch (err) {
    if (err.status) process.exit(err.status)
    throw err
  }
}

const prepare = co.wrap(function * (target) {
  if (target.host === 'localhost' || !target.host) {
    exec(`createdb ${connArgs(target, true).join(' ')}`)
  } else {
    // N.B.: we don't have a proper postgres driver and we don't want to rely on overriding
    // possible .psqlrc output configurations, so we generate a random marker that is returned
    // from the query. We avoid including it verbatim in the query text in case the equivalent
    // of --echo-all is set.
    const num = Math.random()
    const emptyMarker = `${num}${num}`
    let result = yield psql.exec(target, `SELECT CASE count(*) WHEN 0 THEN '${num}' || '${num}' END FROM pg_stat_user_tables`)
    if (!result.includes(emptyMarker)) throw new Error(`Remote database is not empty. Please create a new database or use ${cli.color.cmd('heroku pg:reset')}`)
  }
})

function connArgs (uri, skipDFlag) {
  const args = []

  if (uri.user) args.push('-U', uri.user)
  if (uri.host) args.push('-h', uri.host)
  if (uri.port) args.push('-p', `${uri.port}`)
  if (!skipDFlag) args.push('-d')
  args.push(uri.database)

  return args
}

const verifyExtensionsMatch = co.wrap(function * (source, target) {
  // It's pretty common for local DBs to not have extensions available that
  // are used by the remote app, so take the final precaution of warning if
  // the extensions available in the local database don't match. We don't
  // report it if the difference is solely in the version of an extension
  // used, though.
  let sql = 'SELECT extname FROM pg_extension ORDER BY extname;'
  let extensions = yield {
    target: psql.exec(target, sql),
    source: psql.exec(source, sql)
  }
  // TODO: it shouldn't matter if the target has *more* extensions than the source
  if (extensions.target !== extensions.source) {
    cli.warn(`WARNING: Extensions in newly created target database differ from existing source database.
Target extensions:
${extensions.target}
Source extensions:
${extensions.source}
HINT: You should review output to ensure that any errors
ignored are acceptable - entire tables may have been missed, where a dependency
could not be resolved. You may need to to install a postgresql-contrib package
and retry.`)
  }
})

const maybeTunnel = function * (herokuDb) {
  // TODO defend against side effects, should find altering code & fix
  herokuDb = Object.assign({}, herokuDb)

  const configs = bastion.getConfigs(herokuDb)
  const tunnel = yield bastion.sshTunnel(herokuDb, configs.dbTunnelConfig)
  if (tunnel) {
    const tunnelHost = {
      host: 'localhost',
      port: configs.dbTunnelConfig.localPort,
      _tunnel: tunnel
    }

    herokuDb = Object.assign(herokuDb, tunnelHost)
  }
  return herokuDb
}

function spawnPipe (pgDump, pgRestore) {
  return new Promise((resolve, reject) => {
    pgDump.stdout.pipe(pgRestore.stdin)
    pgDump.on('close', code => code ? reject(new Error(`pg_dump errored with ${code}`)) : pgRestore.stdin.end())
    pgRestore.on('close', code => code ? reject(new Error(`pg_restore errored with ${code}`)) : resolve())
  })
}

const run = co.wrap(function * (sourceIn, targetIn, exclusions) {
  yield prepare(targetIn)

  const source = yield maybeTunnel(sourceIn)
  const target = yield maybeTunnel(targetIn)
  const exclude = exclusions.map(function (e) { return '--exclude-table-data=' + e }).join(' ')

  let dumpFlags = ['--verbose', '-F', 'c', '-Z', '0', '-N', '_heroku', ...connArgs(source, true)]
  if (exclude !== '') dumpFlags.push(exclude)

  const dumpOptions = {
    env: {
      PGSSLMODE: 'prefer',
      ...env
    },
    stdio: ['pipe', 'pipe', 2],
    encoding: 'utf8',
    shell: true
  }
  if (source.password) dumpOptions.env.PGPASSWORD = source.password

  const restoreFlags = ['--verbose', '-F', 'c', '--no-acl', '--no-owner', ...connArgs(target)]
  const restoreOptions = {
    env: { ...env },
    stdio: ['pipe', 'pipe', 2],
    encoding: 'utf8',
    shell: true
  }
  if (target.password) restoreOptions.env.PGPASSWORD = target.password

  const pgDump = cp.spawn('pg_dump', dumpFlags, dumpOptions)
  const pgRestore = cp.spawn('pg_restore', restoreFlags, restoreOptions)

  yield spawnPipe(pgDump, pgRestore)

  if (source._tunnel) source._tunnel.close()
  if (target._tunnel) target._tunnel.close()

  yield verifyExtensionsMatch(sourceIn, targetIn)
})

function * push (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const { app, args } = context
  const flags = context.flags
  const exclusions = parseExclusions(flags['exclude-table-data'])

  const source = util.parsePostgresConnectionString(args.source)
  const target = yield fetcher.database(app, args.target)

  cli.log(`heroku-cli: Pushing ${cli.color.cyan(args.source)} ---> ${cli.color.addon(target.attachment.addon.name)}`)
  yield run(source, target, exclusions)
  cli.log('heroku-cli: Pushing complete.')
}

function * pull (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const { app, args } = context
  const flags = context.flags
  const exclusions = parseExclusions(flags['exclude-table-data'])

  const source = yield fetcher.database(app, args.source)
  const target = util.parsePostgresConnectionString(args.target)

  cli.log(`heroku-cli: Pulling ${cli.color.addon(source.attachment.addon.name)} ---> ${cli.color.cyan(args.target)}`)
  yield run(source, target, exclusions)
  cli.log('heroku-cli: Pulling complete.')
}

let cmd = {
  topic: 'pg',
  needsApp: true,
  needsAuth: true,
  args: [{ name: 'source' }, { name: 'target' }],
  flags: [
    { name: 'exclude-table-data', hasValue: true, description: 'tables for which data should be excluded (use \';\' to split multiple names)' }
  ]
}

module.exports = [
  Object.assign({
    command: 'push',
    description: 'push local or remote into Heroku database',
    help: `Push from SOURCE into TARGET. TARGET must be empty.

To empty a Heroku database for push run \`heroku pg:reset\`

SOURCE must be either the name of a database existing on your localhost or the
fully qualified URL of a remote database.

Examples:

    # push mylocaldb into a Heroku DB named postgresql-swimmingly-100
    $ heroku pg:push mylocaldb postgresql-swimmingly-100

    # push remote DB at postgres://myhost/mydb into a Heroku DB named postgresql-swimmingly-100
    $ heroku pg:push postgres://myhost/mydb postgresql-swimmingly-100
`,
    run: cli.command({ preauth: true }, co.wrap(push))
  }, cmd),
  Object.assign({
    command: 'pull',
    description: 'pull Heroku database into local or remote database',
    help: `Pull from SOURCE into TARGET.

TARGET must be one of:
  * a database name (i.e. on a local PostgreSQL server)  => TARGET must not exist and will be created
  * a fully qualified URL to a local PostgreSQL server   => TARGET must not exist and will be created
  * a fully qualified URL to a remote PostgreSQL server  => TARGET must exist and be empty

To delete a local database run \`dropdb TARGET\`
To create an empty remote database, run \`createdb\` with connection command-line options (run \`createdb --help\` for details).

Examples:

    # pull Heroku DB named postgresql-swimmingly-100 into local DB mylocaldb that must not exist
    $ heroku pg:pull postgresql-swimmingly-100 mylocaldb --app sushi

    # pull Heroku DB named postgresql-swimmingly-100 into empty remote DB at postgres://myhost/mydb
    $ heroku pg:pull postgresql-swimmingly-100 postgres://myhost/mydb --app sushi
`,
    run: cli.command({ preauth: true }, co.wrap(pull))
  }, cmd)
]
