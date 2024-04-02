import {APIClient, Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import * as readline from 'readline'
import {Client} from 'ssh2'
import Parser = require('redis-parser')
import type {Writable} from 'node:stream'
import portfinder = require('portfinder')
import confirmApp from '../../lib/apps/confirm-app'
import * as tls from 'tls'
import type {Socket} from 'node:net'
import type {Duplex} from 'stream'
import {promisify} from 'node:util'
import * as net from 'net'
import type {RedisFormationResponse} from '../../lib/redis/api'
import apiFactory from '../../lib/redis/api'

const REPLY_OK = 'OK'

async function redisCLI(uri: URL, client: Writable): Promise<void> {
  const io = readline.createInterface(process.stdin, process.stdout)
  const reply = new Parser({
    returnReply(reply) {
      switch (state) {
      case 'monitoring':
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        break
      case 'subscriber':
        if (Array.isArray(reply)) {
          reply.forEach(function (value, i) {
            console.log(`${i + 1}) ${value}`)
          })
        } else {
          console.log(reply)
        }

        break
      case 'connect':
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        state = 'normal'
        io.prompt()
        break
      case 'closing':
        if (reply !== REPLY_OK) {
          console.log(reply)
        }

        break
      default:
        if (Array.isArray(reply)) {
          reply.forEach(function (value, i) {
            console.log(`${i + 1}) ${value}`)
          })
        } else {
          console.log(reply)
        }

        io.prompt()
        break
      }
    }, returnError(err) {
      console.log(err.message)
      io.prompt()
    }, returnFatalError(err) {
      client.emit('error', err)
      console.dir(err)
    },
  })
  let state = 'connect'
  client.write(`AUTH ${uri.password}\n`)
  io.setPrompt(uri.host + '> ')
  io.on('line', function (line) {
    switch (line.split(' ')[0]) {
    case 'MONITOR':
      state = 'monitoring'
      break
    case 'PSUBSCRIBE':
    case 'SUBSCRIBE':
      state = 'subscriber'
      break
    }

    client.write(`${line}\n`)
  })
  io.on('close', function () {
    state = 'closing'
    client.write('QUIT\n')
  })
  client.on('data', function (data) {
    reply.execute(data)
  })
  return new Promise((resolve, reject) => {
    client.on('error', reject)
    client.on('end', function () {
      console.log('\nDisconnected from instance.')
      io.close()
      resolve()
    })
  })
}

async function bastionConnect(uri: URL, bastions: string, config: Record<string, unknown>, preferNativeTls: boolean) {
  const tunnel: Client = await new Promise(resolve => {
    const ssh2 = new Client()
    resolve(ssh2)
    ssh2.once('ready', () => resolve(ssh2))
    ssh2.connect({
      host: bastions.split(',')[0],
      username: 'bastion',
      privateKey: match(config, /_BASTION_KEY/) ?? '',
    })
  })
  const localPort = await portfinder.getPortPromise({startPort: 49152, stopPort: 65535})
  const stream: Duplex = await promisify(tunnel.forwardOut)('localhost', localPort, uri.hostname, Number.parseInt(uri.port, 10))

  let client: Duplex = stream
  if (preferNativeTls) {
    client = tls.connect({
      socket: stream as Socket,
      port: Number.parseInt(uri.port, 10),
      host: uri.hostname,
      rejectUnauthorized: false,
    })
  }

  stream.on('close', () => tunnel.end())
  stream.on('end', () => client.end())

  return redisCLI(uri, client)
}

function match(config: Record<string, unknown>, lookup: RegExp): string | null {
  for (const key in config) {
    if (lookup.test(key)) {
      return config[key] as string
    }
  }

  return null
}

async function maybeTunnel(redis: RedisFormationResponse, config: Record<string, unknown>) {
  const bastions = match(config, /_BASTIONS/)
  const hobby = redis.plan.indexOf('hobby') === 0
  const preferNativeTls = redis.prefer_native_tls
  const uri = preferNativeTls && hobby ? new URL(match(config, /_TLS_URL/) ?? '') : new URL(redis.resource_url)

  if (bastions !== null) {
    return bastionConnect(uri, bastions, config, preferNativeTls)
  }

  let client
  if (preferNativeTls) {
    client = tls.connect({
      port: Number.parseInt(uri.port, 10), host: uri.hostname, rejectUnauthorized: false,
    })
  } else if (hobby) {
    client = net.connect({port: Number.parseInt(uri.port, 10), host: uri.hostname})
  } else {
    client = tls.connect({
      port: Number.parseInt(uri.port, 10) + 1, host: uri.hostname, rejectUnauthorized: false,
    })
  }

  return redisCLI(uri, client)
}

export default class Cli extends Command {
  static topic = 'redis'
  static description = 'opens a redis prompt'
  static flags = {
    confirm: flags.string({char: 'c'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
  }

  static examples = [
    '$ heroku redis:cli --app=my-app my-database',
    '$ heroku redis:cli --app=my-app --confirm my-database',
  ]

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Cli)
    const api = apiFactory(flags.app, args.database, false, this.heroku)
    const addon = await api.getRedisAddon()
    const configVars = await getRedisConfigVars(addon, this.heroku)
    const {body: redis} = await api.request<RedisFormationResponse>(`/redis/v0/databases/${addon.id}`)
    if (redis.plan.startsWith('shield-')) {
      ux.error('\n      Using redis:cli on Heroku Redis shield plans is not supported.\n      Please see Heroku DevCenter for more details: https://devcenter.heroku.com/articles/shield-private-space#shield-features\n      ', {exit: 1})
    }

    const hobby = redis.plan.indexOf('hobby') === 0
    const prefer_native_tls = redis.prefer_native_tls
    if (!prefer_native_tls && hobby) {
      await confirmApp(flags.app, flags.confirm, 'WARNING: Insecure action.\nAll data, including the Redis password, will not be encrypted.')
    }

    const nonBastionVars = Object.keys(configVars)
      .filter(function (configVar) {
        return !(/(?:BASTIONS|BASTION_KEY|BASTION_REKEYS_AFTER)$/.test(configVar))
      })
      .join(', ')
    ux.log(`Connecting to ${addon.name} (${nonBastionVars}):`)
    return maybeTunnel(redis, configVars)
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
