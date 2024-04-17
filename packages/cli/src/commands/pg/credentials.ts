import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import pghost from '../../lib/pg/host'
import {getAddon} from '../../lib/pg/fetcher'
import {CredentialInfo, CredentialsInfo} from '../../lib/pg/types'
import {presentCredentialAttachments} from '../../lib/pg/util'

export default class Credentials extends Command {
  static topic = 'pg'
  static description = 'show information on credentials in the database'
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Credentials)
    const {app} = flags
    const {database} = args
    const addon = await getAddon(this.heroku, app, database)

    const {body: credentials} = await this.heroku.get<CredentialsInfo>(
      `/postgres/v0/databases/${addon.id}/credentials`,
      {
        hostname: pghost(),
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

    ux.table(credentials, {
      Credential: {
        get: presentCredential,
      },
      State: {
        get: cred => cred.state,
      },
    })
  }

  protected sortByDefaultAndName(credentials: CredentialsInfo) {
    return credentials.sort((a, b) => {
      const isDefaultA = this.isDefaultCredential(a)
      const isDefaultB = this.isDefaultCredential(b)

      return isDefaultB < isDefaultA ? -1 : (isDefaultA < isDefaultB ? 1 : a.name.localeCompare(b.name))
    })
  }

  protected isDefaultCredential(cred: CredentialInfo): boolean {
    return cred.name === 'default'
  }
}
