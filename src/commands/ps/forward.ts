import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {Args, ux} from '@oclif/core'
import debug from 'debug'
import net from 'node:net'
import {SocksClient} from 'socks'
import tsheredoc from 'tsheredoc'

import {HerokuExec} from '../../lib/ps-exec/exec.js'

const heredoc = tsheredoc.default
const forwardDebug = debug('cli:ps:forward')

export default class Forward extends Command {
  static args = {
    port: Args.string({description: 'port or list of ports to forward', required: true}),
  }
  static description = 'Forward traffic on a local port to a dyno'
  static examples = [heredoc`
    Provide a port or comma-separated list of ports to forward.

    For example, "4000,9000:9001" will forward port 4000 to port 4000 and
    port 9000 to port 9001.

    ${color.command('heroku ps:forward 8080 --app murmuring-headland-14719')}
  `]
  static flags = {
    app: flags.app({required: true}),
    dyno: flags.string({
      char: 'd',
      description: 'specify the dyno to connect to',
    }),
    localPort: flags.string({
      char: 'p',
      description: 'the local port to use',
      hidden: true,
    }),
    remote: flags.remote(),
  }
  static topic = 'ps'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Forward)
    const {app, dyno, localPort} = flags

    const context = {
      app,
      auth: {password: this.heroku.auth},
      flags: {dyno},
    }

    const exec = new HerokuExec()

    const portMappings: string[] = args.port.split(',').map((portMapping: string) => {
      const ports = portMapping.split(':')

      // this will error out if localPort is used with multiple ports, but
      // that's ok because localPort is only here for backwards compat
      return [ports[0], ports[1] || localPort || ports[0]]
    })

    // Each local listener binds asynchronously, so we don't know until its
    // 'listening'/'error' event whether the port was actually claimed. Resolve
    // this once every listener has settled with the count that bound, so run()
    // can fail loudly if forwarding nothing (every requested port in use)
    // instead of silently exiting 0.
    let resolveBoundCount!: (count: number) => void
    const boundCountPromise = new Promise<number>(resolve => {
      resolveBoundCount = resolve
    })

    await exec.initFeature(context, this.heroku, async (configVars: Heroku.ConfigVars) => {
      await exec.createSocksProxy(context, this.heroku, configVars, (dynoIp: string, dynoName: string, socksPort: number) => {
        let bound = 0
        let settled = 0
        const onSettled = () => {
          settled++
          if (settled === portMappings.length) resolveBoundCount(bound)
        }

        for (const portMapping of portMappings) {
          const [localPortNum, remotePort] = portMapping

          net.createServer(connIn => {
            // Without a handler a socket reset (e.g. the peer hangs up) surfaces
            // as an unhandled 'error' and crashes the CLI.
            connIn.on('error', err => {
              forwardDebug('local connection error: %o', err)
              connIn.destroy()
            })
            SocksClient.createConnection({
              command: 'connect',
              destination: {host: '0.0.0.0', port: Number.parseInt(remotePort, 10)},
              proxy: {host: 'localhost', port: socksPort, type: 5},
            }, (err, info) => {
              if (err || !info) {
                forwardDebug('SOCKS connection to %s:%s failed: %o', dynoName, remotePort, err)
                connIn.destroy()
                return
              }

              info.socket.on('error', socketErr => {
                forwardDebug('proxied socket error: %o', socketErr)
                connIn.destroy()
              })
              connIn.pipe(info.socket)
              info.socket.pipe(connIn)
            })
          }).listen(Number.parseInt(localPortNum, 10))
            .on('listening', () => {
              bound++
              ux.stdout(`Listening on ${color.bold(localPortNum)} and forwarding to ${color.bold(`${dynoName}:${remotePort}`)}`)
              onSettled()
            })
            .on('error', (err: NodeJS.ErrnoException) => {
              const detail = err.code === 'EADDRINUSE' ? 'port is already in use' : err.message
              ux.warn(`Cannot forward to ${dynoName}:${remotePort} on local port ${localPortNum}: ${detail}`)
              onSettled()
            })
        }
      })
    }, 'forward')

    const boundCount = await boundCountPromise
    if (boundCount === 0) {
      this.error('Could not forward any of the requested ports; every requested local port is already in use.')
    }

    ux.stdout(`Use ${color.magenta('CTRL+C')} to stop port forwarding`)

    // Keep the process running until interrupted
    await new Promise<void>(resolve => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  }
}
