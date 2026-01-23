import type {pg} from '@heroku/heroku-cli-util'

import {color, utils} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core'
import debugFactory from 'debug'
import {ChildProcess, SpawnSyncReturns, execSync} from 'node:child_process'
import {Readable, Writable} from 'node:stream'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default
const debug = debugFactory('pg:push-pull')

export const parseExclusions = (rawExcludeList: string | undefined): Array<string> => (
  (rawExcludeList || '')
    .split(';').map(excl => excl.trim())
    .filter(texcl => texcl !== '')
)

type ExecFn = typeof exec

export const prepare = async (target: pg.ConnectionDetails, execFn: ExecFn = exec): Promise<void> => {
  const psqlService = new utils.pg.PsqlService(target)
  if (target.host === 'localhost' || !target.host) {
    execFn(`createdb ${connArgs(target, true).join(' ')}`)
  } else {
    // N.B.: we don't have a proper postgres driver and we don't want to rely on overriding
    // possible .psqlrc output configurations, so we generate a random marker that is returned
    // from the query. We avoid including it verbatim in the query text in case the equivalent
    // of --echo-all is set.
    const num = Math.random()
    const emptyMarker = `${num}${num}`
    const result = await psqlService.execQuery(`SELECT CASE count(*) WHEN 0 THEN '${num}' || '${num}' END FROM pg_stat_user_tables`)
    if (!result.includes(emptyMarker)) ux.error(`Remote database is not empty. Please create a new database or use ${color.code('heroku pg:reset')}`)
  }
}

export const maybeTunnel = async (
  herokuDb: pg.ConnectionDetails,
): Promise<pg.ConnectionDetails> => {
  let withTunnel: pg.ConnectionDetails = {...herokuDb}
  const configs = utils.pg.psql.getPsqlConfigs(herokuDb)
  const tunnel = await utils.pg.psql.sshTunnel(herokuDb, configs.dbTunnelConfig)

  if (tunnel) {
    const tunnelHost = {
      _tunnel: tunnel,
      host: configs.dbTunnelConfig.localHost,
      port: configs.dbTunnelConfig.localPort?.toString(),
    }

    withTunnel = Object.assign(withTunnel, tunnelHost)
  }

  return withTunnel
}

export const connArgs = (uri: pg.ConnectionDetails, skipDFlag = false) => {
  const args: string[] = []

  if (uri.user) args.push('-U', uri.user)
  if (uri.host) args.push('-h', uri.host)
  if (uri.port) args.push('-p', uri.port)
  if (!skipDFlag) args.push('-d')
  args.push(uri.database)

  return args
}

const exec = (cmd: string, opts = {}) => {
  debug(cmd)
  opts = {...opts, stdio: 'inherit'}

  try {
    return execSync(cmd, opts)
  } catch (error) {
    const {status} = error as SpawnSyncReturns<Buffer | string>
    if (status) ux.exit(status)
    throw error
  }
}

export const spawnPipe = async (pgDump: ChildProcess, pgRestore: ChildProcess): Promise<void> => (
  new Promise<void>((resolve, reject) => {
    const dumpStdout = pgDump.stdout as Readable
    const restoreStdin = pgRestore.stdin as Writable

    dumpStdout.pipe(restoreStdin)

    pgDump.on('close', code => code ? reject(new Error(`pg_dump errored with ${code}`)) : restoreStdin.end())
    pgRestore.on('close', code => code ? reject(new Error(`pg_restore errored with ${code}`)) : resolve())
  })
)

export const verifyExtensionsMatch = async function (source: pg.ConnectionDetails, target: pg.ConnectionDetails) {
  const psqlSource = new utils.pg.PsqlService(source)
  const psqlTarget = new utils.pg.PsqlService(target)
  // It's pretty common for local DBs to not have extensions available that
  // are used by the remote app, so take the final precaution of warning if
  // the extensions available in the local database don't match. We don't
  // report it if the difference is solely in the version of an extension
  // used, though.
  const sql = 'SELECT extname FROM pg_extension ORDER BY extname;'
  const [extensionTarget, extensionSource] = await Promise.all([
    psqlTarget.execQuery(sql),
    psqlSource.execQuery(sql),
  ])
  const extensions = {
    source: extensionSource,
    target: extensionTarget,
  }

  // TODO: it shouldn't matter if the target has *more* extensions than the source
  if (extensions.target !== extensions.source) {
    ux.warn(heredoc`
      Extensions in newly created target database differ from existing source database.
      Target extensions:
    ` + extensions.target + heredoc`
      Source extensions:
    ` + extensions.source + heredoc`
      HINT: You should review output to ensure that any errors
      ignored are acceptable - entire tables may have been missed, where a dependency
      could not be resolved. You may need to install a postgresql-contrib package
      and retry.
    `)
  }
}
