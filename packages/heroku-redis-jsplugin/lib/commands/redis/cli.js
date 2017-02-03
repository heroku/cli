'use strict'

let co = require('co')
let api = require('./shared.js')
let cli = require('heroku-cli-util')
let net = require('net')
let Parser = require('ioredis/lib/parsers/javascript.js')
let readline = require('readline')
let tls = require('tls')
let url = require('url')
let Client = require('ssh2').Client

const REPLY_OK = 'OK'

function redisCLI (uri, client) {
  let io = readline.createInterface(process.stdin, process.stdout)
  let reply = new Parser()
  let state = 'connect'

  client.write(`AUTH ${uri.auth.split(':')[1]}\n`)

  io.setPrompt(uri.host + '> ')

  reply.on('reply', function (reply) {
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
  })
  reply.on('reply error', function (reply) {
    console.log(reply.message)
    io.prompt()
  })
  reply.on('error', function (err) {
    client.emit('error', err)
  })
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
    client.write(`${line}
`)
  })
  io.on('close', function () {
    state = 'closing'
    client.write('QUIT\n')
  })
  client.on('data', function (data) {
    reply.execute(data)
  })
  client.on('error', function (error) {
    cli.error(error)
    process.exit(1)
  })
  client.on('end', function () {
    console.log('\nDisconnected from instance.')
    process.exit(0)
  })
}

function match (config, lookup) {
  for (var key in config) {
    if (lookup.test(key)) {
      return config[key]
    }
  }
  return null
}

function maybeTunnel (redis, config) {
  let bastions = match(config, /_BASTIONS/)
  let hobby = redis.plan.indexOf('hobby') === 0
  let uri = url.parse(redis.resource_url)

  if (bastions != null) {
    let tunnel = new Client()
    tunnel.on('ready', function () {
      let localPort = Math.floor(Math.random() * (65535 - 49152) + 49152)
      tunnel.forwardOut('localhost', localPort, uri.hostname, uri.port, function (err, stream) {
        if (err) {
          cli.error(err)
        }
        stream.on('close', function () {
          tunnel.end()
        })
        redisCLI(uri, stream)
      })
    })
    tunnel.connect({
      host: bastions.split(',')[0],
      username: 'bastion',
      privateKey: match(config, /_BASTION_KEY/)
    })
  } else {
    let client
    if (!hobby) {
      client = tls.connect({port: parseInt(uri.port, 10) + 1, host: uri.hostname, rejectUnauthorized: false})
    } else {
      client = net.connect({port: uri.port, host: uri.hostname})
    }
    redisCLI(uri, client)
  }
}

module.exports = {
  topic: 'redis',
  command: 'cli',
  needsApp: true,
  needsAuth: true,
  description: 'opens a redis prompt',
  args: [{name: 'database', optional: true}],
  flags: [{name: 'confirm', char: 'c', hasValue: true}],
  run: cli.command({preauth: true}, co.wrap(function * (context, heroku) {
    let addon = yield api.getRedisAddon(context, heroku)

    let config = yield heroku.get(`/apps/${context.app}/config-vars`)

    let redis = yield api.request(context, `/redis/v0/databases/${addon.name}`)
    let hobby = redis.plan.indexOf('hobby') === 0

    if (hobby) {
      yield cli.confirmApp(context.app, context.flags.confirm, 'WARNING: Insecure action.\nAll data, including the Redis password, will not be encrypted.')
    }

    let vars = {}
    addon.config_vars.forEach(function (key) { vars[key] = config[key] })
    let nonBastionVars = addon.config_vars.filter(function (configVar) {
      return !(/(?:BASTIONS|BASTION_KEY|BASTION_REKEYS_AFTER)$/.test(configVar))
    }).join(', ')

    cli.log(`Connecting to ${addon.name} (${nonBastionVars}):`)
    maybeTunnel(redis, vars)
  }))
}
