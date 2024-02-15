import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {attachmentResolver, resolveAddon} from '../../lib/addons/resolve'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'
import * as path from 'node:path'
import {HTTP, HTTPError} from 'http-call'
import {AddOnAttachment} from '@heroku-cli/schema'
import * as open from 'open'

export interface SsoParams {
  /**
   * user email address
   */
  email: string
  /**
   * user ID
   */
  user_id: string
  /**
   * billing app name
   */
  app: string
  /**
   * context app name
   */
  context_app: string
  /**
   * SSO request timestamp
   */
  timestamp: string
  /**
   * Navigation metadata (deprecated)
   */
  'nav-data': string
  /**
   * Provider ID (deprecated)
   */
  id: string
  /**
   * SSO v1 token (deprecated)
   */
  token: string
  /**
   * Add-on resource ID
   */
  resource_id: string
  /**
   * SSO v3 token
   */
  resource_token: string
}

export interface AddonSso {
  /**
   * SSO request method
   */
  method:
    | 'get'
    | 'post'
  /**
   * URL of the SSO request
   */
  action: string
  /**
   * SSO params for POST request
   */
  params?: SsoParams
}

export default class Open extends Command {
  public static urlOpener: (url: string) => Promise<unknown> = open
  public static topic = 'addons'
  public static description = 'open an add-on\'s dashboard in your browser'
  public static flags = {
    'show-url': flags.boolean({description: 'show URL, do not open browser'}),
    app: flags.app(),
  }

  public static args = {
    addon: Args.string({required: true}),
  }

  public static async openUrl(url: string): Promise<void> {
    ux.log(`Opening ${color.cyan(url)}...`)
    await Open.urlOpener(url)
  }

  private parsed = this.parse(Open)

  public async run(): Promise<void> {
    const ctx = await this.parsed
    const {flags: {app}, args: {addon}} = ctx

    if (process.env.HEROKU_SUDO) {
      return this.sudo(ctx)
    }

    let attachment: void | AddOnAttachment
    try {
      attachment = await attachmentResolver(this.heroku, app, addon)
    } catch (error) {
      if (error instanceof HTTPError && error.statusCode !== 404) {
        throw error
      }
    }

    let webUrl
    if (attachment) {
      webUrl = attachment.web_url
    } else {
      const resolvedAddon = await resolveAddon(this.heroku, app, addon)
      webUrl = resolvedAddon.web_url
    }

    if (ctx.flags['show-url']) {
      ux.log(webUrl)
    } else {
      await Open.openUrl(webUrl)
    }
  }

  private async sudo(ctx: Awaited<typeof this.parsed>): Promise<void> {
    const {flags: {app}, args} = ctx
    const sso: HTTP<AddonSso> = await this.heroku.request(`/apps/${app}/addons/${args.addon}/sso`, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.add-ons-sso',
      },
    })
    const {method, action} = sso.body
    if (method === 'get') {
      await Open.openUrl(action)
    } else {
      const ssoPath = await this.writeSudoTemplate(ctx, sso.body)
      await Open.openUrl(`file://${ssoPath}`)
    }
  }

  private async writeSudoTemplate(ctx: Awaited<typeof this.parsed>, sso:AddonSso): Promise<string> {
    const ssoPath = path.join(os.tmpdir(), 'heroku-sso.html')
    const {flags: {app}, args} = ctx
    const html = `<!DOCTYPE HTML>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>Heroku Add-ons SSO</title>\n    <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min.js"></script>\n  </head>\n\n  <body>\n    <h3>Opening ${args.addon}${app ? ` on ${app}` : ''}...</h3>\n    <form method="POST" action="${sso.action}">\n    </form>\n\n    <script>\n      var params = ${JSON.stringify(sso.params)}\n      var form = document.forms[0]\n      $(document).ready(function() {\n        $.each(params, function(key, value) {\n          $('<input>').attr({ type: 'hidden', name: key, value: value })\n            .appendTo(form)\n        })\n        form.submit()\n      })\n    </script>\n  </body>\n</html>`
    await fs.writeFile(ssoPath, html)
    return ssoPath
  }
}
