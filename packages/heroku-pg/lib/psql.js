'use strict'

const co = require('co')
const debug = require('debug')('psql')
const tunnel = require('tunnel-ssh')

function env (db) {
  return Object.assign({}, process.env, {
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: db.hostname === 'localhost' ? 'prefer' : 'require',
    PGUSER: db.user || '',
    PGPASSWORD: db.password,
    PGDATABASE: db.database,
    PGPORT: db.port || 5432,
    PGHOST: db.host
  })
}

function tunnelConfig (db) {
  const localHost = '127.0.0.1'
  const localPort = Math.floor(Math.random() * (65535 - 49152) + 49152)
  return {
    username: 'bastion',
    host: db.bastionHost,
    privateKey: db.bastionKey,
    dstHost: db.host,
    dstPort: db.port,
    localHost: localHost,
    localPort: localPort
  }
}

function handlePsqlError (reject, psql) {
  psql.on('error', (err) => {
    if (err.code === 'ENOENT') {
      reject(`The local psql command could not be located. For help installing psql, see https://devcenter.heroku.com/articles/heroku-postgresql#local-setup`)
    } else {
      reject(err)
    }
  })
}

function sshTunnel (db, dbTunnelConfig, timeout) {
  return new Promise((resolve, reject) => {
    // if necessary to tunnel, setup a tunnel
    // see also https://github.com/heroku/heroku/blob/master/lib/heroku/helpers/heroku_postgresql.rb#L53-L80
    let timer = setTimeout(() => reject('Establishing a secure tunnel timed out'), timeout)
    if (db.bastionKey) {
      tunnel(dbTunnelConfig, (err, tnl) => {
        if (err) {
          debug(err)
          reject(`Unable to establish a secure tunnel to your database.`)
        }
        debug('Tunnel created')
        clearTimeout(timer)
        resolve(tnl)
      })
    } else {
      clearTimeout(timer)
      resolve()
    }
  })
}

function execPsql (query, dbEnv, timeout) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject('psql call timed out'), timeout)
    let result = ''
    let psql = spawn('psql', ['-c', query], {env: dbEnv, encoding: 'utf8', stdio: [ 'ignore', 'pipe', 'inherit' ]})
    psql.stdout.on('data', function (data) {
      result += data.toString()
    })
    psql.on('close', function (code) {
      clearTimeout(timer)
      resolve(result)
    })
    handlePsqlError(reject, psql)
  })
}

function psqlInteractive (dbEnv, prompt, timeout) {
  const {spawn} = require('child_process')
  return new Promise((resolve, reject) => {
    let psql = spawn('psql',
                     ['--set', `PROMPT1=${prompt}`, '--set', `PROMPT2=${prompt}`],
                     {env: dbEnv, stdio: 'inherit'})
    handlePsqlError(reject, psql)
    psql.on('close', (data) => {
      resolve()
    })
  })
}

function getConfigs (db) {
  let dbEnv = env(db)
  const dbTunnelConfig = tunnelConfig(db)
  if (db.bastionKey) {
    dbEnv = Object.assign(dbEnv, {
      PGPORT: dbTunnelConfig.localPort,
      PGHOST: dbTunnelConfig.localHost
    })
  }
  return {
    dbEnv: dbEnv,
    dbTunnelConfig: dbTunnelConfig
  }
}

function handleSignals () {
  process.on('SIGINT', () => {})
}

function * exec (db, query, timeout = 20000) {
  handleSignals()
  let configs = getConfigs(db)

  yield sshTunnel(db, configs.dbTunnelConfig, timeout)
  return yield execPsql(query, configs.dbEnv, timeout)
}

function * interactive (db) {
  const pgUtil = require('./util')
  let name = pgUtil.getUrl(db.attachment.config_vars).replace(/^HEROKU_POSTGRESQL_/, '').replace(/_URL$/, '')
  let prompt = `${db.attachment.app.name}::${name}%R%# `
  handleSignals()
  let configs = getConfigs(db)

  yield sshTunnel(db, configs.dbTunnelConfig)
  return yield psqlInteractive(configs.dbEnv, prompt)
}

module.exports = {
  exec: co.wrap(exec),
  interactive: co.wrap(interactive)
}
