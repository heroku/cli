import color from '@heroku-cli/color'
import type {AddOnAttachment} from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import debug from 'debug'
import {renderAttachment} from '../../commands/addons'
import {multiSortCompareFn} from '../utils/multisort'
import {getBastion} from './bastion'
import type {AddOnAttachmentWithConfigVarsAndPlan, CredentialsInfo} from './types'
import {env} from 'process'
import {Server} from 'net'

export function getConfigVarName(configVars: string[]): string {
  const connStringVars = configVars.filter(cv => (cv.endsWith('_URL')))
  if (connStringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connStringVars[0]
}

export const essentialNumPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/^essential/))
export const legacyEssentialPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/(dev|basic|mini)$/))

export function essentialPlan(addon: AddOnAttachmentWithConfigVarsAndPlan) {
  return essentialNumPlan(addon) || legacyEssentialPlan(addon)
}

export function getConfigVarNameFromAttachment(attachment: Required<AddOnAttachment & {
  addon: AddOnAttachmentWithConfigVarsAndPlan
}>, config: Record<string, string> = {}): string {
  const configVars = attachment.config_vars?.filter((cv: string) => {
    return config[cv]?.startsWith('postgres://')
  }) ?? []
  if (configVars.length === 0) {
    ux.error(`No config vars found for ${attachment.name}; perhaps they were removed as a side effect of ${color.cmd('heroku rollback')}? Use ${color.cmd('heroku addons:attach')} to create a new attachment and then ${color.cmd('heroku addons:detach')} to remove the current attachment.`)
  }

  const configVarName = `${attachment.name}_URL`
  if (configVars.includes(configVarName) && configVarName in config) {
    return configVarName
  }

  return getConfigVarName(configVars)
}

export function formatResponseWithCommands(response: string): string {
  return response.replace(/`(.*?)`/g, (_, word) => color.cmd(word))
}

export function presentCredentialAttachments(app: string, credAttachments: Required<AddOnAttachment>[], credentials: CredentialsInfo, cred: string) {
  const isForeignApp = (attOrAddon: Required<AddOnAttachment>) => attOrAddon.app.name === app ? 0 : 1
  const comparators = [
    (a: Required<AddOnAttachment>, b: Required<AddOnAttachment>) => {
      const fa = isForeignApp(a)
      const fb = isForeignApp(b)
      return fa < fb ? -1 : (fb < fa ? 1 : 0)
    },
    (a: Required<AddOnAttachment>, b: Required<AddOnAttachment>) => a.name.localeCompare(b.name),
    (a: Required<AddOnAttachment>, b: Required<AddOnAttachment>) => a.app?.name?.localeCompare(b.app?.name ?? '') ?? 0,
  ]
  credAttachments.sort(multiSortCompareFn(comparators))
  // render each attachment under the credential
  const attLines = credAttachments.map(function (attachment, idx) {
    const isLast = (idx === credAttachments.length - 1)
    return renderAttachment(attachment, app, isLast)
  })

  const rotationLines = []
  const credentialStore = credentials.find(a => a.name === cred)
  if (credentialStore?.state === 'rotating') {
    const formatted = credentialStore?.credentials.map(credential => {
      return {
        user: credential.user,
        state: credential.state,
        connections: credential.connections,
      }
    })
    // eslint-disable-next-line no-eq-null, eqeqeq
    const connectionInformationAvailable = formatted.some(c => c.connections != null)
    if (connectionInformationAvailable) {
      const prefix = '       '
      rotationLines.push(`${prefix}Usernames currently active for this credential:`)
      ux.table(formatted, {
        user: {
          get(row: typeof formatted[0]) {
            return `${prefix}${row.user}`
          },
        },
        state: {
          get(row) {
            return row.state === 'revoking' ? 'waiting for no connections to be revoked' : row.state
          },
        },
        connections: {
          get(row) {
            return `${row.connections} connections`
          },
        },
      }, {
        'no-header': true,
        printLine(line: unknown): void {
          rotationLines.push(line)
        },
      })
    }
  }

  return [cred, ...attLines, ...rotationLines].join('\n')
}

export type ConnectionDetails = {
  user: string
  password: string
  database: string
  host: string
  port: string
  pathname: string
  url: string
  bastionKey?: string
  bastionHost?: string
  _tunnel?: Server
}

export type ConnectionDetailsWithAttachment = ConnectionDetails & {
  attachment: Required<AddOnAttachment & {addon: AddOnAttachmentWithConfigVarsAndPlan}>
}

export const getConnectionDetails = (attachment: Required<AddOnAttachment & {
  addon: AddOnAttachmentWithConfigVarsAndPlan
}>, configVars: Record<string, string> = {}): ConnectionDetailsWithAttachment => {
  const connStringVar = getConfigVarNameFromAttachment(attachment, configVars)

  // remove _URL from the end of the config var name
  const baseName = connStringVar.slice(0, -4)

  // build the default payload for non-bastion dbs
  debug(`Using "${connStringVar}" to connect to your database…`)

  const conn = parsePostgresConnectionString(configVars[connStringVar])

  const payload: ConnectionDetailsWithAttachment = {
    user: conn.user,
    password: conn.password,
    database: conn.database,
    host: conn.host,
    port: conn.port,
    pathname: conn.pathname,
    url: conn.url,
    attachment,
  }

  // If bastion creds exist, graft it into the payload
  const bastion = getBastion(configVars, baseName)
  if (bastion) {
    Object.assign(payload, bastion)
  }

  return payload
}

export const bastionKeyPlan = (a: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(a.plan.name.match(/private/))

export const configVarNamesFromValue = (config: Record<string, string>, value: string) => {
  const keys: string[] = []
  for (const key of Object.keys(config)) {
    const configVal = config[key]
    if (configVal === value) {
      keys.push(key)
    } else if (configVal.startsWith('postgres://')) {
      try {
        const configURL = new URL(configVal)
        const ourURL = new URL(value)
        const components: (keyof URL)[] = ['protocol', 'hostname', 'port', 'pathname']
        if (components.every(component => ourURL[component] === configURL[component])) {
          keys.push(key)
        }
      } catch {
        // ignore -- this is not a valid URL so not a matching URL
      }
    }
  }

  const comparator = (a: string, b: string) => {
    const isDatabaseUrlA = Number(a === 'DATABASE_URL')
    const isDatabaseUrlB = Number(b === 'DATABASE_URL')
    return isDatabaseUrlA < isDatabaseUrlB ? -1 : (isDatabaseUrlB < isDatabaseUrlA ? 1 : 0)
  }

  return keys.sort(comparator)
}

export const databaseNameFromUrl = (uri: string, config: Record<string, string>) => {
  const names = configVarNamesFromValue(config, uri)
  let name = names.pop()
  while (names.length > 0 && name === 'DATABASE_URL') name = names.pop()
  if (name) {
    return color.configVar(name.replace(/_URL$/, ''))
  }

  const conn = parsePostgresConnectionString(uri)
  return `${conn.host}:${conn.port}${conn.pathname}`
}

export const parsePostgresConnectionString = (db: string): ConnectionDetails => {
  const dbPath = db.match(/:\/\//) ? db : `postgres:///${db}`
  const url = new URL(dbPath)
  const {username, password, hostname, pathname, port} = url

  return {
    user: username,
    password,
    database: pathname.charAt(0) === '/' ? pathname.slice(1) : pathname,
    host: hostname,
    port: port || env.PGPORT || (hostname && '5432'),
    pathname,
    url: dbPath,
  }
}
