import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import socks from '@heroku/socksv5'
import {Args, ux} from '@oclif/core'
import net from 'node:net'
import tsheredoc from 'tsheredoc'

import {HerokuExec} from '../../lib/ps-exec/exec.js'

const heredoc = tsheredoc.default

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

    await exec.initFeature(context, this.heroku, async (configVars: Heroku.ConfigVars) => {
      await exec.createSocksProxy(context, this.heroku, configVars, (dynoIp: string, dynoName: string, socksPort: number) => {
        for (const portMapping of portMappings) {
          const [localPortNum, remotePort] = portMapping

          ux.stdout(`Listening on ${color.white.bold(localPortNum)} and forwarding to ${color.white.bold(`${dynoName}:${remotePort}`)}`)

          net.createServer(connIn => {
            socks.connect({
              auths: [socks.auth.None()], // eslint-disable-line new-cap
              host: '0.0.0.0',
              port: Number.parseInt(remotePort, 10),
              proxyHost: 'localhost',
              proxyPort: socksPort,
            }, socket => {
              connIn.pipe(socket)
              socket.pipe(connIn)
            })
          }).listen(Number.parseInt(localPortNum, 10))
        }

        ux.stdout(`Use ${color.magenta('CTRL+C')} to stop port forwarding`)
      })
    }, 'forward')

    // Keep the process running until interrupted
    await new Promise<void>(resolve => {
      process.once('SIGINT', resolve)
      process.once('SIGTERM', resolve)
    })
  }
}
