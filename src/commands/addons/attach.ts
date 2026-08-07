import type {AddOnAttachment, AddOnConfig} from '@heroku/types/3.sdk'

import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuApiClient} from '@heroku/heroku-fetch'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'

import {trapConfirmationRequired} from '../../lib/addons/util.js'

export default class Attach extends Command {
  static args = {
    addon_name: Args.string({description: 'unique identifier or globally unique name of the add-on', required: true}),
  }
  static description = 'attach an existing add-on resource to an app'
  static flags = {
    app: flags.app({required: true}),
    as: flags.string({description: 'name for add-on attachment'}),
    confirm: flags.string({description: 'overwrite existing add-on attachment with same name'}),
    credential: flags.string({description: 'credential name for scoped access to Heroku Postgres'}),
    remote: flags.remote(),
  }
  static topic = 'addons'

  public async run(): Promise<AddOnAttachment> {
    const {args,  flags} = await this.parse(Attach)
    const {app, as, confirm, credential} = flags
    const {platform} = new HerokuSDK()
    const addon = await platform.addOn.info(args.addon_name)
    const createAttachment = async (confirmed?: string) =>  {
      let namespace: string | undefined
      if (credential && credential !== 'default') {
        namespace = 'credential:' + credential
      }

      const body = {
        addon: addon.name!, app, confirm: confirmed, name: as, namespace,
      }

      try {
        ux.action.start(`Attaching ${credential ? color.name(credential) + ' of ' : ''}${color.datastore(addon.name || '')}${as ? ' as ' + color.attachment(as) : ''} to ${color.app(app)}`)
        const attachment = await platform.addOnAttachment.create(body)
        ux.action.stop()

        return attachment
      } catch (error: unknown) {
        ux.action.stop(color.red('!'))
        throw error
      }
    }

    if (credential && credential !== 'default') {
      const client = new HerokuApiClient()
      const response = await client.get(`/addons/${addon.name}/config/credential:${encodeURIComponent(credential)}`)
      const credentialConfig = await response.json() as AddOnConfig[]
      if (credentialConfig.length === 0) {
        throw new Error(`Could not find credential ${color.name(credential)} for database ${color.datastore(addon.name || '')}`)
      }
    }

    const attachment = await trapConfirmationRequired<AddOnAttachment>(app, confirm, (confirmed?: string) => createAttachment(confirmed))
    ux.action.start(`Setting ${color.attachment(attachment.name || '')} config vars and restarting ${color.app(app)}`)
    const releases = await platform
      .withHeaders({Range: 'version ..; max=1, order=desc'})
      .release.list(app)
    ux.action.stop(`done, v${releases[0].version}`)

    return attachment
  }
}
