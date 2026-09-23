import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {
  DynoCrashedError,
  dynoExtensions,
  type ExecCredentials,
  type ExecPrereqs,
} from '@heroku/sdk/extensions/platform'
import {ConfigVar} from '@heroku/types/3.sdk'
import {ux} from '@oclif/core/ux'
import debug from 'debug'
import keypair from 'keypair'
import forge from 'node-forge'
import child from 'node:child_process'
import tsheredoc from 'tsheredoc'

import {HerokuSsh} from './ssh.js'

const heredoc = tsheredoc.default

interface ExecContext {
  app: string
  auth: {
    password: string | undefined
  }
  flags: {
    dyno?: string
  }
}

/**
 * Bounds the wait for the dyno to come back `up` after the first-run
 * restart. The SDK's `restartForExec` defaults to 20 attempts (~20s);
 * the CLI historically waited indefinitely, so this approximates that
 * with a generous ceiling instead of an unbounded loop.
 */
const EXEC_RESTART_ATTEMPTS = 3600

const execDebug = debug('cli:ps-exec:exec')

type Platform = HerokuSDK<readonly [typeof dynoExtensions]>['platform']

export class HerokuExec {
  async checkStatus(context: ExecContext, platform: Platform, configVars: ConfigVar): Promise<void> {
    const dynos = await platform.dyno.list(context.app)

    try {
      const reservations = await platform.dyno.execStatus(context.app, {
        apiKey: this._apiKey(context),
        configVars,
        headers: this._execHeaders(),
      })

      hux.styledHeader(`Heroku Exec ${color.app(context.app)}`)

      if (reservations.length === 0) {
        ux.error(`Heroku Exec is not running. Check dyno status with ${color.command('heroku ps')}.`)
      } else {
        const statuses = []

        for (const reservation of reservations) {
          const name = reservation.dyno_name
          const dyno = dynos.find(d => d.name === name)

          statuses.push({
            dyno_name: color.name(name),
            dyno_status: dyno ? (dyno.state === 'up' ? color.success(dyno.state) : color.yellow(dyno.state || '')) : color.error('missing!'),
            proxy_status: 'running',
          })
        }

        hux.table(statuses, {
          dyno_name: {header: 'Dyno'},
          dyno_status: {header: 'Dyno Status'},
          proxy_status: {header: 'Proxy Status'},
        })
      }
    } catch (error) {
      ux.error(error as Error)
    }
  }

  createSocksProxy(context: ExecContext, platform: Platform, configVars: ConfigVar, callback?: (dynoIp: string, dyno: string, socksPort: number) => void) {
    return this.updateClientKey(context, platform, configVars, (privateKey, dyno, credentials) => {
      execDebug(credentials)

      new HerokuSsh().socksv5(credentials.tunnel_host, credentials.client_user, privateKey, credentials.proxy_public_key, socks_port => {
        if (callback) callback(credentials.dyno_ip, dyno, socks_port)
        else ux.stdout(`Use ${color.command('CTRL+C')} to stop the proxy`)
      })
    })
  }

  async initFeature(context: ExecContext, platform: Platform, callback: (configVars: ConfigVar) => unknown, command?: string): Promise<void> {
    const buildpackUrls = ['https://github.com/heroku/exec-buildpack', 'urn:buildpack:heroku/exec']

    const {buildStack, buildpacks, configVars, featureEnabled, generation, space} = await platform.dyno.execPrereqs(context.app)

    if (generation === 'fir') {
      const errorMessage = command === 'exec'
        ? `This command is unavailable for this app. Use ${color.command('heroku run:inside')} instead. See https://devcenter.heroku.com/articles/run-tasks-in-an-existing-dyno.`
        : 'This command is unavailable for this app.  See https://devcenter.heroku.com/articles/generations.'
      ux.error(errorMessage)
    }

    if (space && space.shield) {
      ux.error('This feature is restricted for Shield Private Spaces')
    } else if (space) {
      if (buildStack === 'container') {
        ux.warn(`${context.app} is using the container stack which is not officially supported.`)
      } else if (buildpacks.length === 0) {
        ux.error(`${context.app} has no Buildpack URL set. You must deploy your application first!`)
      } else if (!(this._hasExecBuildpack(buildpacks, buildpackUrls))) {
        await this._enableFeature(context, platform)
        ux.stdout(`Adding the Heroku Exec buildpack to ${context.app}`)
        child.execSync(`heroku buildpacks:add -i 1 heroku/exec -a ${context.app}`)
        ux.stdout(heredoc`

        Run the following commands to redeploy your app, then Heroku Exec will be ready to use:
        ${color.command('  git commit -m "Heroku Exec initialization" --allow-empty')}
        ${color.command('  git push heroku main')}
        `)
        ux.exit(0)
      }
    } else if (this._hasExecBuildpack(buildpacks, buildpackUrls)) {
      ux.warn('The Heroku Exec buildpack is no longer required for this app,\n'
        + 'and may interfere with the \'heroku run\' command. Please run the\n'
        + 'following command to remove it:\n  '
        + color.command('heroku buildpacks:remove https://github.com/heroku/exec-buildpack'))
    }

    const addonUrl = configVars.HEROKU_EXEC_URL
    if (addonUrl) {
      ux.error("It looks like you're using the Heroku Exec addon, which is no longer required\n"
        + 'to use this feature. Please run the following command to remove the addon\n'
        + 'and then try using Heroku Exec again:\n'
        + color.command('  heroku addons:destroy heroku-exec'))
    } else if (!featureEnabled) {
      ux.stdout('Running this command for the first time requires a dyno restart.')
      const answer = await hux.prompt('Do you want to continue? [y/n]')

      if (answer.trim().toLowerCase() !== 'y') {
        ux.exit()
      }

      await this._enableFeature(context, platform)

      const dynoName = this._dyno(context)
      let waitingForStart = false
      ux.action.start('Restarting dynos')

      try {
        await platform.dyno.restartForExec(context.app, dynoName, {
          attempts: EXEC_RESTART_ATTEMPTS,
          onPoll: () => {
            if (!waitingForStart) {
              waitingForStart = true
              ux.action.stop()
              ux.action.start(`Waiting for ${color.name(dynoName)} to start`)
            }
          },
        })
      } catch (error) {
        ux.action.stop()
        if (error instanceof DynoCrashedError) {
          throw new Error('The dyno crashed')
        }

        throw error
      }

      ux.action.stop()
    }

    await callback(configVars)
  }

  async updateClientKey(context: ExecContext, platform: Platform, configVars: ConfigVar, callback: (privkeypem: string, dyno: string, credentials: ExecCredentials) => Promise<void> | void) {
    ux.action.start('Establishing credentials')
    const key = (keypair as any)()
    const privkeypem = key.private
    const publicKey = forge.pki.publicKeyFromPem(key.public)
    const pubkeypem = forge.ssh.publicKeyToOpenSSH(publicKey, '')

    try {
      const dyno = this._dyno(context)

      const credentials = await platform.dyno.exchangeExecCredentials(context.app, {
        apiKey: this._apiKey(context),
        configVars,
        dyno,
        headers: this._execHeaders(),
        publicKey: pubkeypem,
      })

      ux.action.stop()
      await callback(privkeypem, dyno, credentials)
    } catch (error) {
      ux.action.stop('error')
      execDebug(error)
      ux.error('Could not connect to dyno!\nCheck if the dyno is running with `heroku ps\'')
    }
  }

  private _apiKey(context: ExecContext): string {
    return process.env.HEROKU_API_KEY || context.auth.password || ''
  }

  private _dyno(context: ExecContext) {
    return context.flags.dyno || 'web.1'
  }

  private async _enableFeature(context: ExecContext, platform: Platform) {
    ux.action.start('Initializing feature')
    await platform.dyno.enableExec(context.app)
    ux.action.stop()
  }

  private _execHeaders() {
    if (process.env.HEROKU_HEADERS) {
      execDebug(`using headers: ${process.env.HEROKU_HEADERS}`)
      return JSON.parse(process.env.HEROKU_HEADERS)
    }

    return {}
  }

  private _hasExecBuildpack(buildpacks: ExecPrereqs['buildpacks'], urls: string[]) {
    if (!Array.isArray(buildpacks)) {
      execDebug('buildpacks is not an array:', buildpacks)
      return false
    }

    for (const b of buildpacks) {
      for (const u of urls) {
        if (b.buildpack.url && b.buildpack.url.indexOf(u) === 0) return true
      }
    }

    return false
  }
}
