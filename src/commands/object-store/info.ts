import {flags as Flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {
  ago, styledHeader, styledObject, toTitleCase,
} from '@heroku/heroku-cli-util/hux'
import {AddonResolver} from '@heroku/heroku-cli-util/utils'
import {Args} from '@oclif/core'
import {filesize} from 'filesize'

import BaseCommand from '../../lib/data/base-command.js'
import {OBJECT_STORE_ADDON_SERVICE} from '../../lib/object-store/addon.js'
import {ObjectStoreInfo} from '../../lib/object-store/types.js'

export default class ObjectStoreInfoCommand extends BaseCommand {
  static args = {
    object_store: Args.string({
      description: 'object store name, attachment name, or related config var on an app',
      required: true,
    }),
  }
  static description = 'show details on an object store'
  static examples = [
    '<%= config.bin %> <%= command.id %> object_store_name --app example-app',
  ]
  static flags = {
    app: Flags.app({required: true}),
    remote: Flags.remote(),
  }

  async run() {
    const {args, flags} = await this.parse(ObjectStoreInfoCommand)
    const {app} = flags
    const {object_store: objectStore} = args

    const addonResolver = new AddonResolver(this.heroku)
    const addon = await addonResolver.resolve(objectStore, app, OBJECT_STORE_ADDON_SERVICE)

    const {body: info} = await this.dataApi.get<ObjectStoreInfo>(`/object-stores/${addon.id}`)

    styledHeader(`${color.addon(addon.name)} on ${color.app(app)}`)

    const statusInfo = info.status === 'Available'
      ? color.success(info.status)
      : color.warning(info.status)

    /* eslint-disable perfectionist/sort-objects */
    styledObject({
      Plan: toTitleCase(info.plan),
      Status: statusInfo,
      Region: info.region,
      Storage: this.renderStorage(info.storage),
      'Session TTL': `${info.session_ttl_hours}h`,
      Created: this.renderDate(info.created_at),
    }, ['Plan', 'Status', 'Region', 'Storage', 'Session TTL', 'Created'])
    /* eslint-enable perfectionist/sort-objects */
  }

  private renderDate(dateStr: string): string {
    return new Date(dateStr).toISOString().replace('T', ' ').replace(/:\d{2}\.\d{3}Z$/, ' UTC')
  }

  private renderStorage(storage: ObjectStoreInfo['storage']): string {
    if (storage.stored_bytes === null) {
      return color.gray('No data yet')
    }

    const size = filesize(storage.stored_bytes, {round: 1, standard: 'jedec'})
    const count = `${storage.objects_count ?? 0} object${storage.objects_count === 1 ? '' : 's'}`
    const collected = storage.updated_at ? ` ${color.gray(ago(new Date(storage.updated_at)))}` : ''
    return `${size} / ${count}${collected}`
  }
}
