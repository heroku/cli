import {Command, flags as Flags, HerokuAPIError} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import * as color from '@heroku/heroku-cli-util/color'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {trapConfirmationRequired} from '../../../lib/addons/util.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'

const heredoc = tsheredoc.default

export default class ObjectStoreAttachmentsCreate extends Command {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'attach a scoped credential of an object store to an app'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --credential reports --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    as: Flags.string({description: 'name for the object store attachment'}),
    confirm: Flags.string({char: 'c', description: 'pass in the app name to skip confirmation prompts'}),
    credential: Flags.string({description: 'scoped credential to attach', required: true}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ObjectStoreAttachmentsCreate)
    const {object_store: objectStoreArg} = args
    const {app, as, confirm, credential} = flags
    const addonResolver = new AddonResolver(this.heroku)

    // The app flag is always the target app for the attachment. Resolving with
    // the app finds an object store on that app; when the store lives on another
    // app we retry without the app so the resolver matches by name.
    let addon
    try {
      addon = await addonResolver.resolve(objectStoreArg, app, OBJECT_STORE_ADDON_SERVICE)
    } catch (error: unknown) {
      if (error instanceof HerokuAPIError && error.http.statusCode === 404) {
        addon = await addonResolver.resolve(objectStoreArg, undefined, OBJECT_STORE_ADDON_SERVICE)
      } else {
        throw error
      }
    }

    const createAttachment = async (confirmed?: string): Promise<Required<Heroku.AddOnAttachment>> => {
      const body = {
        addon: {name: addon.name},
        app: {name: app},
        confirm: confirmed,
        name: as,
        namespace_config: {credential},
      }

      try {
        ux.action.start(`Attaching ${color.addon(addon.name)} with credential ${color.name(credential)}${as ? ' as ' + color.attachment(as) : ''} to ${color.app(app)}`)
        const {body: attachment} = await this.heroku.post<Required<Heroku.AddOnAttachment>>('/addon-attachments', {body})
        ux.action.stop()

        return attachment
      } catch (error) {
        ux.action.stop(color.red('!'))

        if (error instanceof Error && error.message.includes('invalid credential provided')) {
          ux.error(
            heredoc(`
              The credential ${color.name(credential)} doesn't exist on the object store ${color.addon(addon.name)}.
              Use ${color.code(`heroku object-store:credentials ${addon.name} -a ${app}`)} to list its credentials.
            `).trimEnd(),
            {exit: 1},
          )
        }

        throw error
      }
    }

    const attachment = await trapConfirmationRequired<Required<Heroku.AddOnAttachment>>(app, confirm, (confirmed?: string) => createAttachment(confirmed))

    try {
      ux.action.start(`Setting ${color.attachment(attachment.name)} config vars and restarting ${color.app(app)}`)
      const {body: releases} = await this.heroku.get<Required<Heroku.Release>[]>(`/apps/${app}/releases`, {
        headers: {Range: 'version ..; max=1, order=desc'}, partial: true,
      })
      ux.action.stop(`done, v${releases[0].version}`)
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }
  }
}
