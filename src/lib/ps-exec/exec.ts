import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {hux} from '@heroku/heroku-cli-util'
import {ux} from '@oclif/core/ux'
import debug from 'debug'
import got, {Response} from 'got'
import keypair from 'keypair'
import forge from 'node-forge'
import child from 'node:child_process'
import {URL} from 'node:url'
import tsheredoc from 'tsheredoc'

import {App, BuildpackInstallation} from '../types/fir.js'
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

const execDebug = debug('cli:ps-exec:exec')

export class HerokuExec {
  async checkStatus(context: ExecContext, heroku: APIClient, configVars: Heroku.ConfigVars): Promise<void> {
    const {body: dynos} = await heroku.request<Heroku.Dyno[]>(`/apps/${context.app}/dynos`)

    const execUrl = this._execUrl(context, configVars)
    const execApiPath = this._execApiPath(configVars)

    try {
      const response = await got(`https://${execUrl.host}${execApiPath}`, {
        headers: this._execHeaders(),
        method: 'GET',
        password: execUrl.password,
        username: execUrl.username,
      })

      const reservations = JSON.parse(response.body)

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
            dyno_status: dyno ? (dyno.state === 'up' ? color.success(dyno.state) : color.yellow(dyno.state)) : color.error('missing!'),
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

  createSocksProxy(context: ExecContext, heroku: APIClient, configVars: Heroku.ConfigVars, callback?: (dynoIp: string, dyno: string, socksPort: number) => void) {
    return this.updateClientKey(context, heroku, configVars, (privateKey, dyno, response) => {
      execDebug(response.body)
      const json = JSON.parse(response.body)

      new HerokuSsh().socksv5(json.tunnel_host, json.client_user, privateKey, json.proxy_public_key, socks_port => {
        if (callback) callback(json.dyno_ip, dyno, socks_port)
        else ux.stdout(`Use ${color.command('CTRL+C')} to stop the proxy`)
      })
    })
  }

  async initFeature(context: ExecContext, heroku: APIClient, callback: (configVars: Heroku.ConfigVars) => unknown, command?: string): Promise<void> {
    const buildpackUrls = ['https://github.com/heroku/exec-buildpack', 'urn:buildpack:heroku/exec']

    const {body: app} = await heroku.get<App>(`/apps/${context.app}`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
    })

    if (app.generation === 'fir') {
      const errorMessage = command === 'exec'
        ? `This command is unavailable for this app. Use ${color.command('heroku run:inside')} instead. See https://devcenter.heroku.com/articles/run-tasks-in-an-existing-dyno.`
        : 'This command is unavailable for this app.  See https://devcenter.heroku.com/articles/generations.'
      ux.error(errorMessage)
    }

    const [{body: buildpacks}, {body: configVars}, {body: feature}] = await Promise.all([
      heroku.get<BuildpackInstallation[]>(`/apps/${context.app}/buildpack-installations`),
      heroku.get<Heroku.ConfigVars>(`/apps/${context.app}/config-vars`),
      heroku.get<{enabled: boolean}>(`/apps/${context.app}/features/runtime-heroku-exec`),
    ])

    if (app.space && app.space.shield) {
      ux.error('This feature is restricted for Shield Private Spaces')
    } else if (app.space) {
      if (app.build_stack.name === 'container') {
        ux.warn(`${context.app} is using the container stack which is not officially supported.`)
      } else if (buildpacks.length === 0) {
        ux.error(`${context.app} has no Buildpack URL set. You must deploy your application first!`)
      } else if (!(this._hasExecBuildpack(buildpacks, buildpackUrls))) {
        await this._enableFeature(context, heroku)
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
    } else if (!feature.enabled) {
      ux.stdout('Running this command for the first time requires a dyno restart.')
      const answer = await hux.prompt('Do you want to continue? [y/n]')

      if (answer.trim().toLowerCase() !== 'y') {
        ux.exit()
      }

      await this._enableFeature(context, heroku)

      ux.action.start('Restarting dynos')
      await new Promise<void>(resolve => {
        setTimeout(() => resolve(), 2000)
      })
      await heroku.delete(`/apps/${context.app}/dynos`)
      ux.action.stop()

      const dynoName = this._dyno(context)
      let state: string | undefined = 'down'
      ux.action.start(`Waiting for ${color.name(dynoName)} to start`)
      while (state !== 'up') {
        await new Promise<void>(resolve => {
          setTimeout(() => resolve(), 1000)
        })
        const {body: dyno} = await heroku.request<Heroku.Dyno>(`/apps/${context.app}/dynos/${dynoName}`)
        state = dyno.state
        if (state === 'crashed') {
          ux.action.stop()
          throw new Error('The dyno crashed')
        }
      }

      ux.action.stop()
    }

    await callback(configVars)
  }

  async updateClientKey(context: ExecContext, heroku: APIClient, configVars: Heroku.ConfigVars, callback: (privkeypem: string, dyno: string, response: Response<string>) => Promise<void> | void) {
    ux.action.start('Establishing credentials')
    const key = (keypair as any)()
    const privkeypem = key.private
    const publicKey = forge.pki.publicKeyFromPem(key.public)
    const pubkeypem = forge.ssh.publicKeyToOpenSSH(publicKey, '')

    try {
      const execUrl = this._execUrl(context, configVars)
      const dyno = this._dyno(context)

      const response = await got(`https://${execUrl.host}/${this._execApiPath(configVars)}/${dyno}`, {
        body: JSON.stringify({client_key: pubkeypem}),
        headers: {...this._execHeaders(), 'content-type': 'application/json'},
        method: 'PUT',
        password: execUrl.password,
        username: execUrl.username,
      })

      ux.action.stop()
      await callback(privkeypem, dyno, response)
    } catch (error) {
      ux.action.stop('error')
      execDebug(error)
      ux.error('Could not connect to dyno!\nCheck if the dyno is running with `heroku ps\'')
    }
  }

  private _dyno(context: ExecContext) {
    return context.flags.dyno || 'web.1'
  }

  private async _enableFeature(context: ExecContext, heroku: APIClient) {
    ux.action.start('Initializing feature')
    await heroku.patch(`/apps/${context.app}/features/runtime-heroku-exec`, {
      body: {enabled: true},
    })
    ux.action.stop()
  }

  private _execApiPath(configVars: Heroku.ConfigVars) {
    if (configVars.HEROKU_EXEC_URL) {
      return '/api/v1'
    }

    return '/api/v2'
  }

  private _execHeaders() {
    if (process.env.HEROKU_HEADERS) {
      execDebug(`using headers: ${process.env.HEROKU_HEADERS}`)
      return JSON.parse(process.env.HEROKU_HEADERS)
    }

    return {}
  }

  private _execUrl(context: ExecContext, configVars: Heroku.ConfigVars) {
    let urlString = configVars.HEROKU_EXEC_URL
    if (urlString) {
      return new URL(urlString)
    }

    if (process.env.HEROKU_EXEC_URL === undefined) {
      urlString = 'https://exec-manager.heroku.com/'
    } else {
      urlString = process.env.HEROKU_EXEC_URL
    }

    const execUrl = new URL(urlString)
    execUrl.username = context.app
    execUrl.password = process.env.HEROKU_API_KEY || context.auth.password || ''
    return execUrl
  }

  private _hasExecBuildpack(buildpacks: BuildpackInstallation[], urls: string[]) {
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
