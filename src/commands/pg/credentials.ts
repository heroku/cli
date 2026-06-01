import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux, utils} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import type {CredentialInfo} from '@heroku/sdk/resources/data/postgres-database'
import {Args} from '@oclif/core'

import {presentCredentialAttachments} from '../../lib/pg/util.js'
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
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, database)

    const {data} = new HerokuSDK({extensions: [postgresDatabaseExtensions]})
    const credentials = await data.postgresDatabase.listCredentials(app, addon.name)
    const sortedCredentials = this.sortByDefaultAndName(credentials)
    const {body: attachments} = await this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`)

    const presentCredential = (cred: CredentialInfo): string => {
      let credAttachments = [] as Required<Heroku.AddOnAttachment>[]
      credAttachments = cred.name === 'default' ? attachments.filter(a => a.namespace === null) : attachments.filter(a => a.namespace === `credential:${cred.name}`)

      return presentCredentialAttachments(app, credAttachments, sortedCredentials as any, cred.name)
    }

    hux.table(credentials, {
      Credential: {
        get: presentCredential,
      },
      State: {
        get: cred => cred.state,
      },
    }, huxTableNoWrapOptions(flags['no-wrap']))
  }

  protected sortByDefaultAndName(credentials: CredentialInfo[]) {
    return credentials.sort((a: CredentialInfo, b: CredentialInfo) => {
      const isDefaultA = this.isDefaultCredential(a)
      const isDefaultB = this.isDefaultCredential(b)

      return isDefaultB < isDefaultA ? -1 : (isDefaultA < isDefaultB ? 1 : a.name.localeCompare(b.name))
    })
  }
}
