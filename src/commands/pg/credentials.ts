import type {CredentialInfo} from '@heroku/sdk/resources/data/postgres-database'

import {Command, flags} from '@heroku-cli/command'
import {hux} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'

import {presentCredentialAttachments} from '../../lib/pg/util.js'
import {createSDK} from '../../lib/sdk.js'
import {huxTableNoWrapOptions} from '../../lib/utils/table-utils.js'
import {nls} from '../../nls.js'

export default class Credentials extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'show information on credentials in the database'
  static flags = {
    app: flags.app({required: true}),
    'no-wrap': flags.noWrap(),
    remote: flags.remote(),
  }
  static topic = 'pg'

  protected isDefaultCredential(cred: CredentialInfo): boolean {
    return cred.name === 'default'
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Credentials)
    const {app} = flags
    const {database} = args
    const {data, platform} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    const {addon, credentials} = await data.postgresDatabase.listCredentials(app, {addonIdentity: database})
    const sortedCredentials = this.sortByDefaultAndName(credentials)
    const attachments = await platform.addOnAttachment.listByAddOn(addon.id)

    const presentCredential = (cred: CredentialInfo): string => {
      const credAttachments = cred.name === 'default' ? attachments.filter(a => a.namespace === null) : attachments.filter(a => a.namespace === `credential:${cred.name}`)

      return presentCredentialAttachments(app, credAttachments, sortedCredentials, cred.name)
    }

    this.log(hux.table(credentials, {
      Credential: {
        get: presentCredential,
      },
      State: {
        get: cred => cred.state,
      },
    }, huxTableNoWrapOptions(flags['no-wrap'])))
  }

  protected sortByDefaultAndName(credentials: CredentialInfo[]) {
    return credentials.sort((a: CredentialInfo, b: CredentialInfo) => {
      const isDefaultA = this.isDefaultCredential(a)
      const isDefaultB = this.isDefaultCredential(b)

      return isDefaultB < isDefaultA ? -1 : (isDefaultA < isDefaultB ? 1 : a.name.localeCompare(b.name))
    })
  }
}
