import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import BaseCommand from '../../../lib/data/base-command.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../../lib/object-store/addon.js'
import {OBJECT_STORE_CAPABILITIES, ObjectStoreCredentialInfo} from '../../../lib/object-store/types.js'

const heredoc = tsheredoc.default

export default class ObjectStoreCredentialsCreate extends BaseCommand {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'create a scoped credential on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --name reports --capability read --capability list --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    capability: Flags.string({
      description: 'capability to grant the credential (repeatable)',
      multiple: true,
      options: [...OBJECT_STORE_CAPABILITIES],
      required: true,
    }),
    name: Flags.string({char: 'n', description: 'name for the credential', required: true}),
    prefix: Flags.string({description: 'object key prefix to scope the credential to (defaults to the whole bucket)'}),
    remote: Flags.remote(),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(ObjectStoreCredentialsCreate)
    const {app, capability, name, prefix} = flags
    const {object_store: objectStore} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const body = {capabilities: capability, key_prefix: prefix ?? '', name}

    let credential: ObjectStoreCredentialInfo
    try {
      ux.action.start(`Creating credential ${color.name(name)} on ${color.addon(addon.name)}`)
      const {body: created} = await this.dataApi.post<ObjectStoreCredentialInfo>(`/object-stores/${addon.id}/credentials`, {body})
      credential = created
      ux.action.stop()
    } catch (error) {
      ux.action.stop(color.red('!'))
      throw error
    }

    const attachCmd = `heroku object-store:attachments:create ${addon.name} --credential ${credential.name} --app ${app}`
    ux.stdout(heredoc`
      Created credential ${color.name(credential.name)} (${credential.capabilities.join(', ')}${credential.key_prefix ? ` on ${color.name(credential.key_prefix)}` : ''}).
      Attach it to an app with ${color.code(attachCmd)}.
    `)
  }
}
