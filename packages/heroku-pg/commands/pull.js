'use strict'

const cli = require('heroku-cli-util')
const co = require('co')
const debug = require('debug')('push')
const psql = require('../lib/psql')
const env = require('process').env
const bastion = require('../lib/bastion')

function parseURL (db) {
  const url = require('url')
  db = url.parse(db.match(/:\/\//) ? db : `postgres:///${db}`)
  let [user, password] = db.auth ? db.auth.split(':') : []
  db.user = user
  db.password = password
  db.database = db.path ? db.path.split('/', 2)[1] : null
  db.host = db.hostname
  db.port = db.port || env.PGPORT
  if (db.hostname) {
    db.port = db.port || 5432
  }
  return db
}

function parseExclusions (rawExcludeList) {
  return (rawExcludeList || '').split(';').map(function (tname) {
    return tname.trim()
  }).filter(function (tname) {
    return (tname !== '')
  })
}

function exec (cmd, opts = {}) {
  const {execSync} = require('child_process')
  debug(cmd)
  opts = Object.assign({}, opts, {stdio: 'inherit'})
  try {
    return execSync(cmd, opts)
  } catch (err) {
    if (err.status) process.exit(err.status)
    throw err
  }
}

function spawn (cmd) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let result = ''
    let psql = spawn(cmd, [], {encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ], shell: true})
    psql.stdout.on('data', function (data) {
      result += data.toString()
    })
    psql.on('close', function (code) {
      if (code === 0) {
        resolve(result)
      } else {
        cli.exit(code)
      }
    })
  })
}

const prepare = co.wrap(function * (target) {
  if (target.host === 'localhost' || !target.host) {
    exec(`createdb ${connstring(target, true)}`)
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

function connstring (uri, skipDFlag) {
  let user = uri.user ? `-U ${uri.user}` : ''
  let host = uri.host ? `-h ${uri.host}` : ''
  let port = uri.port ? `-p ${uri.port}` : ''
  return `${user} ${host} ${port} ${skipDFlag ? '' : '-d'} ${uri.database}`
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

const run = co.wrap(function * (sourceIn, targetIn, exclusions) {
  yield prepare(targetIn)

  const source = yield maybeTunnel(sourceIn)
  const target = yield maybeTunnel(targetIn)

  const exclude = exclusions.map(function (e) { return '--exclude-table-data=' + e }).join(' ')

  let password = p => p ? ` PGPASSWORD="${p}"` : ''
  let dump = `env${password(source.password)} PGSSLMODE=prefer pg_dump --verbose -F c -Z 0 ${exclude} ${connstring(source, true)}`
  let restore = `env${password(target.password)} pg_restore --verbose --no-acl --no-owner ${connstring(target)}`

  yield spawn(`${dump} | ${restore}`)

  if (source._tunnel) source._tunnel.close()
  if (target._tunnel) target._tunnel.close()

  yield verifyExtensionsMatch(sourceIn, targetIn)
})

function * push (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const {app, args} = context
  const flags = context.flags
  const exclusions = parseExclusions(flags['exclude-table-data'])

  const source = parseURL(args.source)
  const target = yield fetcher.database(app, args.target)

  cli.log(`heroku-cli: Pushing ${cli.color.cyan(args.source)} ---> ${cli.color.addon(target.attachment.addon.name)}`)
  yield run(source, target, exclusions)
  cli.log('heroku-cli: Pushing complete.')
}

function * pull (context, heroku) {
  const fetcher = require('../lib/fetcher')(heroku)
  const {app, args} = context
  const flags = context.flags
  const exclusions = parseExclusions(flags['exclude-table-data'])

  const source = yield fetcher.database(app, args.source)
  const target = parseURL(args.target)

  cli.log(`heroku-cli: Pulling ${cli.color.addon(source.attachment.addon.name)} ---> ${cli.color.cyan(args.target)}`)
  yield run(source, target, exclusions)
  cli.log('heroku-cli: Pulling complete.')
}

let cmd = {
  topic: 'pg',
  needsApp: true,
  needsAuth: true,
  args: [{name: 'source'}, {name: 'target'}],
  flags: [
    {name: 'exclude-table-data', hasValue: true, description: 'tables for which data should be excluded (use \';\' to split multiple names)'}
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
    run: cli.command({preauth: true}, co.wrap(push))
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
    run: cli.command({preauth: true}, co.wrap(pull))
  }, cmd)
]
