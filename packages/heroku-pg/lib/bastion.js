'use strict'

const debug = require('./debug')
const tunnel = require('tunnel-ssh')
const cli = require('heroku-cli-util')

const getBastion = function (config, baseName) {
  const sample = require('lodash.sample')
  // If there are bastions, extract a host and a key
  // otherwise, return an empty Object

  // If there are bastions:
  // * there should be one *_BASTION_KEY
  // * pick one host from the comma-separated list in *_BASTIONS
  // We assert that _BASTIONS and _BASTION_KEY always exist together
  // If either is falsy, pretend neither exist

  const bastionKey = config[`${baseName}_BASTION_KEY`]
  const bastionHost = sample((config[`${baseName}_BASTIONS`] || '').split(','))
  return (!(bastionKey && bastionHost))
    ? {}
    : {bastionHost, bastionKey}
}

exports.getBastion = getBastion

const env = function (db) {
  let baseEnv = Object.assign({
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: (!db.hostname || db.hostname === 'localhost') ? 'prefer' : 'require'
  }, process.env)
  let mapping = {
    PGUSER: 'user',
    PGPASSWORD: 'password',
    PGDATABASE: 'database',
    PGPORT: 'port',
    PGHOST: 'host'
  }
  Object.keys(mapping).forEach((envVar) => {
    let val = db[mapping[envVar]]
    if (val) {
      baseEnv[envVar] = val
    }
  })
  return baseEnv
}

exports.env = env

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

exports.tunnelConfig = tunnelConfig

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

exports.getConfigs = getConfigs

function sshTunnel (db, dbTunnelConfig, timeout) {
  return new Promise((resolve, reject) => {
    // if necessary to tunnel, setup a tunnel
    // see also https://github.com/heroku/heroku/blob/master/lib/heroku/helpers/heroku_postgresql.rb#L53-L80
    let timer = setTimeout(() => reject(new Error('Establishing a secure tunnel timed out')), timeout)
    if (db.bastionKey) {
      let tun = tunnel(dbTunnelConfig, (err, tnl) => {
        if (err) {
          debug(err)
          reject(new Error('Unable to establish a secure tunnel to your database.'))
        }
        debug('Tunnel created')
        clearTimeout(timer)
        resolve(tnl)
      })
      tun.on('error', (err) => {
        // we can't reject the promise here because we may already have resolved it
        debug(err)
        cli.exit(1, 'Secure tunnel to your database failed')
      })
    } else {
      clearTimeout(timer)
      resolve()
    }
  })
}

exports.sshTunnel = sshTunnel
