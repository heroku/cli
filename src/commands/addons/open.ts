
import {color} from '@heroku/heroku-cli-util'
import {HTTP, HTTPError} from '@heroku/http-call'
import {Command, flags} from '@heroku-cli/command'
import {AddOnAttachment} from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import open from 'open'

import {attachmentResolver, resolveAddon} from '../../lib/addons/resolve.js'

export interface SsoParams {
  /**
   * billing app name
   */
  app: string
  /**
   * context app name
   */
  context_app: string
  /**
   * user email address
   */
  email: string
  /**
   * Provider ID (deprecated)
   */
  id: string
  /**
   * Navigation metadata (deprecated)
   */
  'nav-data': string
  /**
   * Add-on resource ID
   */
  resource_id: string
  /**
   * SSO v3 token
   */
  resource_token: string
  /**
   * SSO request timestamp
   */
  timestamp: string
  /**
   * SSO v1 token (deprecated)
   */
  token: string
  /**
   * user ID
   */
  user_id: string
}

export interface AddonSso {
  /**
   * URL of the SSO request
   */
  action: string
  /**
   * SSO request method
   */
  method:
    | 'get'
    | 'post'
  /**
   * SSO params for POST request
   */
  params?: SsoParams
}

export default class Open extends Command {
  public static args = {
    addon: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }

  public static description = 'open an add-on\'s dashboard in your browser'
  public static flags = {
    app: flags.app(),
    remote: flags.remote(),
    'show-url': flags.boolean({description: 'show URL, do not open browser'}),
  }

  public static topic = 'addons'

  public static urlOpener: (url: string) => Promise<unknown> = open

  public static async openUrl(url: string): Promise<void> {
    ux.stdout(`Opening ${color.info(url)}...`)
    await Open.urlOpener(url)
  }

  public async run(): Promise<void> {
    const {args: {addon}, flags} = await this.parse(Open)
    const {app} = flags

    if (process.env.HEROKU_SUDO) {
      return this.sudo(app, addon)
    }

    let attachment: AddOnAttachment | null | void = null
    try {
      attachment = await attachmentResolver(this.heroku, app, addon)
    } catch (error) {
      if (error instanceof HTTPError && error.statusCode !== 404) {
        throw error
      }
    }

    let webUrl: string
    if (attachment) {
      webUrl = attachment.web_url as string
    } else {
      const resolvedAddon = await resolveAddon(this.heroku, app, addon)
      webUrl = resolvedAddon.web_url as string
    }

    if (flags['show-url']) {
      ux.stdout(webUrl)
    } else {
      await Open.openUrl(webUrl)
    }
  }

  private async sudo(app: string, addon: string): Promise<void> {
    const sso: HTTP<AddonSso> = await this.heroku.request(`/apps/${app}/addons/${addon}/sso`, {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
      },
      method: 'GET',
    })
    const {action, method} = sso.body
    if (method === 'get') {
      await Open.openUrl(action)
    } else {
      const ssoPath = await this.writeSudoTemplate(app, addon, sso.body)
      await Open.openUrl(`file://${ssoPath}`)
    }
  }

  private async writeSudoTemplate(app: string, addon: string, sso:AddonSso): Promise<string> {
    const ssoPath = path.join(os.tmpdir(), 'heroku-sso.html')
    const html = `<!DOCTYPE HTML>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>Heroku Add-ons SSO</title>\n    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>\n  </head>\n\n  <body>\n    <h3>Opening ${addon}${app ? ` on ${app}` : ''}...</h3>\n    <form method="POST" action="${sso.action}">\n    </form>\n\n    <script>\n      var params = ${JSON.stringify(sso.params)}\n      var form = document.forms[0]\n      $(document).ready(function() {\n        $.each(params, function(key, value) {\n          $('<input>').attr({ type: 'hidden', name: key, value: value })\n            .appendTo(form)\n        })\n        form.submit()\n      })\n    </script>\n  </body>\n</html>`
    await fs.writeFile(ssoPath, html)
    return ssoPath
  }
}
