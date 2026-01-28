import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import {hux, utils} from '@heroku/heroku-cli-util'
import * as Heroku from '@heroku-cli/schema'
import type {CredentialInfo, CredentialsInfo} from '../../lib/pg/types.js'
import {presentCredentialAttachments} from '../../lib/pg/util.js'
import {nls} from '../../nls.js'

export default class Credentials extends Command {
  static topic = 'pg'
  static description = 'show information on credentials in the database'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Credentials)
    const {app} = flags
    const {database} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, database)

    const {body: credentials} = await this.heroku.get<CredentialsInfo>(
      `/postgres/v0/databases/${addon.id}/credentials`,
      {
        hostname: utils.pg.host(),
        headers: {
          Authorization: `Basic ${Buffer.from(`:${this.heroku.auth}`).toString('base64')}`,
        },
      },
    )
    const sortedCredentials = this.sortByDefaultAndName(credentials)
    const {body: attachments} = await this.heroku.get<Required<Heroku.AddOnAttachment>[]>(`/addons/${addon.id}/addon-attachments`)

    const presentCredential = (cred: CredentialInfo): string => {
      let credAttachments = [] as Required<Heroku.AddOnAttachment>[]
      if (cred.name === 'default') {
        credAttachments = attachments.filter(a => a.namespace === null)
      } else {
        credAttachments = attachments.filter(a => a.namespace === `credential:${cred.name}`)
      }

      return presentCredentialAttachments(app, credAttachments, sortedCredentials, cred.name)
    }

    hux.table(credentials, {
      Credential: {
        get: presentCredential,
      },
      State: {
        get: cred => cred.state,
      },
    }, {
      overflow: 'wrap',
    })
  }

  protected sortByDefaultAndName(credentials: CredentialsInfo) {
    return credentials.sort((a: CredentialInfo, b: CredentialInfo) => {
      const isDefaultA = this.isDefaultCredential(a)
      const isDefaultB = this.isDefaultCredential(b)

      return isDefaultB < isDefaultA ? -1 : (isDefaultA < isDefaultB ? 1 : a.name.localeCompare(b.name))
    })
  }

  protected isDefaultCredential(cred: CredentialInfo): boolean {
    return cred.name === 'default'
  }
}
