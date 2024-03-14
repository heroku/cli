'use strict'

const debug = require('./debug')
const tunnelSSH = require('tunnel-ssh')
const host = require('./host')
const util = require('util')
// eslint-disable-next-line node/no-unsupported-features/node-builtins
const {once, EventEmitter} = require('events')
const createSSHTunnel = util.promisify(tunnelSSH)

const getBastion = function (config, baseName) {
  const {sample} = require('lodash')
  // If there are bastions, extract a host and a key
  // otherwise, return an empty Object

  // If there are bastions:
  // * there should be one *_BASTION_KEY
  // * pick one host from the comma-separated list in *_BASTIONS
  // We assert that _BASTIONS and _BASTION_KEY always exist together
  // If either is falsy, pretend neither exist

  const bastionKey = config[`${baseName}_BASTION_KEY`]
  const bastionHost = sample((config[`${baseName}_BASTIONS`] || '').split(','))
  return (!(bastionKey && bastionHost)) ?
    {} :
    {bastionHost, bastionKey}
}

exports.getBastion = getBastion

const env = function (db) {
  let baseEnv = Object.assign({
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: (!db.hostname || db.hostname === 'localhost') ? 'prefer' : 'require',
  }, process.env)
  let mapping = {
    PGUSER: 'user',
    PGPASSWORD: 'password',
    PGDATABASE: 'database',
    PGPORT: 'port',
    PGHOST: 'host',
  }
  Object.keys(mapping).forEach(envVar => {
    let val = db[mapping[envVar]]
    if (val) {
      baseEnv[envVar] = val
    }
  })
  return baseEnv
}

exports.env = env

function tunnelConfig(db) {
  const localHost = '127.0.0.1'
  // eslint-disable-next-line no-mixed-operators
  const localPort = Math.floor(Math.random() * (65535 - 49152) + 49152)
  return {
    username: 'bastion',
    host: db.bastionHost,
    privateKey: db.bastionKey,
    dstHost: db.host,
    dstPort: db.port,
    localHost: localHost,
    localPort: localPort,
  }
}

exports.tunnelConfig = tunnelConfig

function getConfigs(db) {
  let dbEnv = env(db)
  const dbTunnelConfig = tunnelConfig(db)
  if (db.bastionKey) {
    dbEnv = Object.assign(dbEnv, {
      PGPORT: dbTunnelConfig.localPort,
      PGHOST: dbTunnelConfig.localHost,
    })
  }

  return {
    dbEnv: dbEnv,
    dbTunnelConfig: dbTunnelConfig,
  }
}

exports.getConfigs = getConfigs

class Timeout {
  constructor(timeout, message) {
    this.timeout = timeout
    this.message = message
    this.events = new EventEmitter()
  }

  async promise() {
    this.timer = setTimeout(() => {
      this.events.emit('error', new Error(this.message))
    }, this.timeout)

    try {
      await once(this.events, 'cancelled')
    } finally {
      clearTimeout(this.timer)
    }
  }

  cancel() {
    this.events.emit('cancelled')
  }
}

async function sshTunnel(db, dbTunnelConfig, timeout = 10000) {
  if (!db.bastionKey) {
    return null
  }

  const timeoutInstance = new Timeout(timeout, 'Establishing a secure tunnel timed out')
  try {
    const tunnelInstance = await Promise.race([
      timeoutInstance.promise(),
      createSSHTunnel(dbTunnelConfig),
    ])
    return tunnelInstance
  } catch (error) {
    debug(error)
    throw new Error('Unable to establish a secure tunnel to your database.')
  } finally {
    timeoutInstance.cancel()
  }
}

exports.sshTunnel = sshTunnel

async function fetchConfig(heroku, db) {
  return heroku.get(
    `/client/v11/databases/${encodeURIComponent(db.id)}/bastion`,
    {
      host: host(db),
    },
  )
}

exports.fetchConfig = fetchConfig
