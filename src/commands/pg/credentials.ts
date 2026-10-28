import type {CredentialInfo} from '@heroku/sdk/resources/data/postgres-database'

import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {hux, utils} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'

// import {presentCredentialAttachments} from '../../lib/pg/util.js'
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
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon} = await dbResolver.getAttachment(app, database)

    const {data} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})
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

// TODO: Remove this once pg:credentials is migrated to use the SDK
import * as color from '@heroku/heroku-cli-util/color'

import {multiSortCompareFn} from '../../lib/utils/multisort.js'
import {renderAttachment} from '../addons/index.js'

function presentCredentialAttachments(app: string, credAttachments: Required<Heroku.AddOnAttachment>[], credentials: CredentialInfo[], cred: string) {
  const isForeignApp = (attOrAddon: Required<Heroku.AddOnAttachment>) => attOrAddon.app.name === app ? 0 : 1
  const comparators = [
    (a: Required<Heroku.AddOnAttachment>, b: Required<Heroku.AddOnAttachment>) => {
      const fa = isForeignApp(a)
      const fb = isForeignApp(b)
      return fa < fb ? -1 : (fb < fa ? 1 : 0)
    },
    (a: Required<Heroku.AddOnAttachment>, b: Required<Heroku.AddOnAttachment>) => a.name.localeCompare(b.name),
    (a: Required<Heroku.AddOnAttachment>, b: Required<Heroku.AddOnAttachment>) => a.app?.name?.localeCompare(b.app?.name ?? '') ?? 0,
  ]
  credAttachments.sort(multiSortCompareFn(comparators))
  const attLines = credAttachments.map((attachment, idx) => {
    const isLast = (idx === credAttachments.length - 1)
    return renderAttachment(attachment, app, isLast)
  })

  const rotationLines = []
  const credentialStore = credentials.find(a => a.name === cred)
  if (credentialStore?.state === 'rotating') {
    const formatted = credentialStore.credentials.map(credential => ({
      connections: credential.connections,
      state: credential.state,
      user: credential.user,
    }))
    // eslint-disable-next-line no-eq-null, eqeqeq
    const connectionInformationAvailable = formatted.some(c => c.connections != null)
    if (connectionInformationAvailable) {
      const prefix = '       '
      rotationLines.push(`${prefix}Usernames currently active for this credential:`)

      hux.table(formatted, {
        connections: {
          get(row) {
            return `${row.connections} connections`
          },
        },
        state: {
          get(row) {
            return row.state === 'revoking' ? 'waiting for no connections to be revoked' : row.state
          },
        },
        user: {
          get(row: typeof formatted[0]) {
            return `${prefix}${row.user}`
          },
        },
      })
    }
  }

  return [color.name(cred), ...attLines, ...rotationLines].join('\n') + '\n'
}
