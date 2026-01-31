import type {Socket} from 'node:net'
import type {Writable} from 'node:stream'
import type {Duplex} from 'stream'

import {APIClient, Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import * as net from 'net'
import {promisify} from 'node:util'
import portfinder from 'portfinder'
import * as readline from 'readline'
import Parser from 'redis-parser'
import {Client} from 'ssh2'
import * as tls from 'tls'

import type {RedisFormationResponse} from '../../lib/redis/api.js'

import ConfirmCommand from '../../lib/confirmCommand.js'
import apiFactory from '../../lib/redis/api.js'

const REPLY_OK = 'OK'

async function redisCLI(uri: URL, client: Writable): Promise<void> {
  const io = readline.createInterface(process.stdin, process.stdout)
  let state = 'connect'
  const reply = new Parser({
    returnError(err: Error) {
      console.log(err.message)
      io.prompt()
    }, returnFatalError(err: Error) {
      client.emit('error', err)
      console.dir(err)
    }, returnReply(reply: unknown) {
      switch (state) {
      case 'monitoring': {
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        break
      }

      case 'subscriber': {
        if (Array.isArray(reply)) {
          reply.forEach((value, i) => {
            console.log(`${i + 1}) ${value}`)
          })
        } else {
          console.log(reply)
        }

        break
      }

      case 'connect': {
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        state = 'normal'
        io.prompt()
        break
      }

      case 'closing': {
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        break
      }

      default: {
        if (Array.isArray(reply)) {
          reply.forEach((value, i) => {
            console.log(`${i + 1}) ${value}`)
          })
        } else {
          console.log(reply)
        }

        io.prompt()
        break
      }
      }
    },
  })
  client.write(`AUTH ${uri.password}\n`)
  io.setPrompt(uri.host + '> ')
  io.on('line', line => {
    switch (line.split(' ')[0]) {
    case 'MONITOR': {
      state = 'monitoring'
      break
    }

    case 'PSUBSCRIBE':
    case 'SUBSCRIBE': {
      state = 'subscriber'
      break
    }
    }

    client.write(`${line}\n`)
  })
  io.on('close', () => {
    state = 'closing'
    client.write('QUIT\n')
  })
  client.on('data', (data: Buffer) => {
    reply.execute(data)
  })
  return new Promise((resolve, reject) => {
    client.on('error', reject)
    client.on('end', () => {
      console.log('\nDisconnected from instance.')
      io.close()
      resolve()
    })
  })
}

function match(config: Record<string, unknown>, lookup: RegExp): null | string {
  for (const key in config) {
    if (lookup.test(key)) {
      return config[key] as string
    }
  }

  return null
}

export default class Cli extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.', ignoreStdin: true}),
  }

  static description = 'opens a redis prompt'
  static examples = [
    '$ heroku redis:cli --app=my-app my-database',
    '$ heroku redis:cli --app=my-app --confirm my-database',
  ]

  static flags = {
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c'}),
    remote: flags.remote(),
  }

  static topic = 'redis'

  protected async createBastionConnection(uri: URL, bastions: string, config: Record<string, unknown>, preferNativeTls: boolean): Promise<Duplex> {
    const tunnel: Client = await new Promise(resolve => {
      const ssh2 = new Client()
      ssh2.once('ready', () => resolve(ssh2))
      ssh2.connect({
        host: bastions.split(',')[0],
        privateKey: match(config, /_BASTION_KEY/) ?? '',
        username: 'bastion',
      })
    })
    const localPort = await portfinder.getPortPromise({startPort: 49152, stopPort: 65535})
    const stream: Duplex = await promisify(tunnel.forwardOut.bind(tunnel))('localhost', localPort, uri.hostname, Number.parseInt(uri.port, 10))

    let client: Duplex = stream
    if (preferNativeTls) {
      client = tls.connect({
        host: uri.hostname,
        port: Number.parseInt(uri.port, 10),
        rejectUnauthorized: false,
        socket: stream as Socket,
      })
    }

    stream.on('close', () => tunnel.end())
    stream.on('end', () => client.end())

    return client
  }

  protected createDirectConnection(uri: URL, options: {portOffset?: number, useTls: boolean}): net.Socket | tls.TLSSocket {
    const port = Number.parseInt(uri.port, 10) + (options.portOffset ?? 0)
    if (options.useTls) {
      return tls.connect({
        host: uri.hostname, port, rejectUnauthorized: false,
      })
    }

    return net.connect({host: uri.hostname, port})
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Cli)
    const api = apiFactory(flags.app, args.database, false, this.heroku)
    const addon = await api.getRedisAddon()
    const configVars = await getRedisConfigVars(addon, this.heroku)
    const {body: redis} = await api.request<RedisFormationResponse>(`/redis/v0/databases/${addon.id}`)
    if (redis.plan.startsWith('shield-')) {
      ux.error('\n      Using redis:cli on Heroku Redis shield plans is not supported.\n      Please see Heroku DevCenter for more details: https://devcenter.heroku.com/articles/shield-private-space#shield-features\n      ', {exit: 1})
    }

    const hobby = redis.plan.indexOf('hobby') === 0
    const {prefer_native_tls} = redis
    if (!prefer_native_tls && hobby) {
      await new ConfirmCommand().confirm(flags.app, flags.confirm, 'WARNING: Insecure action.\nAll data, including the Redis password, will not be encrypted.')
    }

    const nonBastionVars = Object.keys(configVars)
      .filter(configVar => !(/(?:BASTIONS|BASTION_KEY|BASTION_REKEYS_AFTER)$/.test(configVar)))
      .join(', ')
    this.log(`Connecting to ${addon.name} (${nonBastionVars}):`)
    return this.maybeTunnel(redis, configVars)
  }

  private async maybeTunnel(redis: RedisFormationResponse, config: Record<string, unknown>) {
    const bastions = match(config, /_BASTIONS/)
    const hobby = redis.plan.indexOf('hobby') === 0
    const preferNativeTls = redis.prefer_native_tls
    const uri = preferNativeTls && hobby ? new URL(match(config, /_TLS_URL/) ?? '') : new URL(redis.resource_url)

    if (bastions !== null) {
      const client = await this.createBastionConnection(uri, bastions, config, preferNativeTls)
      return redisCLI(uri, client)
    }

    const useTls = preferNativeTls || !hobby
    const portOffset = hobby ? undefined : 1
    const client = this.createDirectConnection(uri, {portOffset, useTls})
    return redisCLI(uri, client)
  }
}

async function getRedisConfigVars(addon: Required<Heroku.AddOn>, heroku: APIClient): Promise<Record<string, unknown>> {
  const {body: config} = await heroku.get<Record<string, unknown>>(`/apps/${addon.billing_entity.name}/config-vars`)
  const redisConfigVars: Record<string, unknown> = {}
  addon.config_vars.forEach(configVar => {
    redisConfigVars[configVar] = config[configVar]
  })
  return redisConfigVars
}
