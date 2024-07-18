const debug = require('debug')('pg')
import {APIClient} from '@heroku-cli/command'
import * as EventEmitter from 'node:events'
import * as createTunnel from 'tunnel-ssh'
import {promisify} from 'util'
import host from './host'
import {ConnectionDetails} from './util'
import {ux} from '@oclif/core'

export const getBastion = function (config:Record<string, string>, baseName: string) {
  // If there are bastions, extract a host and a key
  // otherwise, return an empty Object

  // If there are bastions:
  // * there should be one *_BASTION_KEY
  // * pick one host from the comma-separated list in *_BASTIONS
  // We assert that _BASTIONS and _BASTION_KEY always exist together
  // If either is falsy, pretend neither exist

  const bastionKey = config[`${baseName}_BASTION_KEY`]
  const bastions = (config[`${baseName}_BASTIONS`] || '').split(',')
  const bastionHost = bastions[Math.floor(Math.random() * bastions.length)]
  return (bastionKey && bastionHost) ? {bastionHost, bastionKey} : {}
}

export const env = (db: ConnectionDetails) => {
  const baseEnv = Object.assign({
    PGAPPNAME: 'psql non-interactive',
    PGSSLMODE: (!db.host || db.host === 'localhost') ? 'prefer' : 'require',
  }, process.env)
  const mapping: Record<string, keyof Omit<typeof db, 'url' | 'pathname' | 'bastionHost' | 'bastionKey' | '_tunnel'>> = {
    PGUSER: 'user',
    PGPASSWORD: 'password',
    PGDATABASE: 'database',
    PGPORT: 'port',
    PGHOST: 'host',
  }
  Object.keys(mapping).forEach(envVar => {
    const val = db[mapping[envVar]]
    if (val) {
      baseEnv[envVar] = val as string
    }
  })
  return baseEnv
}

export type TunnelConfig = createTunnel.Config

export function tunnelConfig(db: ConnectionDetails): TunnelConfig {
  const localHost = '127.0.0.1'
  const localPort = Math.floor((Math.random() * (65535 - 49152)) + 49152)
  return {
    username: 'bastion',
    host: db.bastionHost,
    privateKey: db.bastionKey,
    dstHost: db.host || undefined,
    dstPort: (db.port && Number.parseInt(db.port as string, 10)) || undefined,
    localHost,
    localPort,
  }
}

export function getConfigs(db: ConnectionDetails) {
  const dbEnv: NodeJS.ProcessEnv = env(db)
  const dbTunnelConfig = tunnelConfig(db)
  if (db.bastionKey) {
    Object.assign(dbEnv, {
      PGPORT: dbTunnelConfig.localPort,
      PGHOST: dbTunnelConfig.localHost,
    })
  }

  return {
    dbEnv,
    dbTunnelConfig,
  }
}

class Timeout {
  private readonly timeout: number
  private readonly message: string
  private readonly events = new EventEmitter()
  private timer: NodeJS.Timeout | undefined

  constructor(timeout: number, message: string) {
    this.timeout = timeout
    this.message = message
  }

  async promise() {
    this.timer = setTimeout(() => {
      this.events.emit('error', new Error(this.message))
    }, this.timeout)

    try {
      await EventEmitter.once(this.events, 'cancelled')
    } finally {
      clearTimeout(this.timer)
    }
  }

  cancel() {
    this.events.emit('cancelled')
  }
}

export async function sshTunnel(db: ConnectionDetails, dbTunnelConfig: TunnelConfig, timeout = 10000) {
  if (!db.bastionKey) {
    return null
  }

  const timeoutInstance = new Timeout(timeout, 'Establishing a secure tunnel timed out')
  const createSSHTunnel = promisify(createTunnel)
  try {
    return await Promise.race([
      timeoutInstance.promise(),
      createSSHTunnel(dbTunnelConfig),
    ])
  } catch (error) {
    debug(error)
    ux.error('Unable to establish a secure tunnel to your database.')
  } finally {
    timeoutInstance.cancel()
  }
}

export async function fetchConfig(heroku:APIClient, db: {id: string}) {
  return heroku.get<{host: string, private_key:string}>(
    `/client/v11/databases/${encodeURIComponent(db.id)}/bastion`,
    {
      hostname: host(),
    },
  )
}
