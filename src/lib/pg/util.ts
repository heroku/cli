import type {APIClient} from '@heroku-cli/command'
import type {AddOnAttachment} from '@heroku-cli/schema'

import {
  color,
  hux,
  pg,
  utils,
} from '@heroku/heroku-cli-util'

import {renderAttachment} from '../../commands/addons/index.js'
import {type CredentialInfo, type NonAdvancedCredentialInfo, isAdvancedCredentialInfo} from '../../lib/data/types.js'
import {multiSortCompareFn} from '../utils/multisort.js'

export function essentialPlan(addon: pg.ExtendedAddon | pg.ExtendedAddonAttachment['addon']) {
  return utils.pg.isEssentialDatabase(addon) || utils.pg.isLegacyEssentialDatabase(addon)
}

export function formatResponseWithCommands(response: string): string {
  return response.replaceAll(/`(.*?)`/g, (_, word) => color.code(word))
}

export function presentCredentialAttachments(app: string, credAttachments: Required<AddOnAttachment>[], credentials: CredentialInfo[], cred: string) {
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
  const attLines = credAttachments.map((attachment, idx) => {
    const isLast = (idx === credAttachments.length - 1)
    return renderAttachment(attachment, app, isLast)
  })

  // We would use utils.pg.isAdvancedDatabase from @heroku/heroku-cli-util, but we're not passing the add-on as a parameter.
  if (credentials.length > 0 && isAdvancedCredentialInfo(credentials[0])) {
    return [color.name(cred), ...attLines].join('\n') + '\n'
  }

  const rotationLines = []
  const credentialStore = credentials.find(a => a.name === cred) as NonAdvancedCredentialInfo | undefined
  if (credentialStore?.state === 'rotating') {
    const formatted = credentialStore?.credentials.map(credential => ({
      connections: credential.connections,
      state: credential.state,
      user: credential.user,
    }))
    // eslint-disable-next-line no-eq-null, eqeqeq
    const connectionInformationAvailable = formatted.some(c => c.connections != null)
    if (connectionInformationAvailable) {
      const prefix = '       '
      rotationLines.push(`${prefix}Usernames currently active for this credential:`)
      const printLine = (line: unknown) => {
        rotationLines.push(line as string)
      }

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
      }, {
        printLine,
      })
    }
  }

  return [color.name(cred), ...attLines, ...rotationLines].join('\n') + '\n'
}

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
    return color.name(name.replace(/_URL$/, ''))
  }

  const conn = utils.pg.DatabaseResolver.parsePostgresConnectionString(uri)
  return `${conn.host}:${conn.port}${conn.pathname}`
}

/**
 * Helper function that attempts to find all Heroku Postgres Advanced-tier attachments on a given app.
 *
 * @param heroku - The API client to use
 * @param app - The name of the app to get the attachments for
 * @returns Promise resolving to an array of all Heroku Postgres Advanced-tier attachments on the app
 */
async function allAdvancedDatabaseAttachments(heroku: APIClient, app: string) {
  const {body: attachments} = await heroku.get<pg.ExtendedAddonAttachment[]>(
    `/apps/${app}/addon-attachments`,
    {
      headers: {
        Accept: 'application/vnd.heroku+json; version=3.sdk',
        'Accept-Inclusion': 'addon:plan,config_vars',
      },
    },
  )
  return attachments.filter(a => utils.pg.isAdvancedDatabase(a.addon))
}

/**
 * Return all Heroku Postgres databases on the Advanced-tier for a given app.
 *
 * @param heroku - The API client to use
 * @param app - The name of the app to get the databases for
 * @returns Promise resolving to all Heroku Postgres databases
 * @throws {Error} When no legacy database add-on exists on the app
 */
export async function getAllAdvancedDatabases(heroku: APIClient, app: string): Promise<Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']>> {
  const allAttachments = await allAdvancedDatabaseAttachments(heroku, app)
  const addons: Array<{attachment_names?: string[]} & pg.ExtendedAddonAttachment['addon']> = []
  for (const attachment of allAttachments) {
    if (!addons.some(a => a.id === attachment.addon.id)) {
      addons.push(attachment.addon)
    }
  }

  const attachmentNamesByAddon = getAttachmentNamesByAddon(allAttachments)
  for (const addon of addons) {
    addon.attachment_names = attachmentNamesByAddon[addon.id]
  }

  return addons
}

/**
 * Helper function that groups attachment names by addon.
 *
 * @param attachments - The attachments to group by addon
 * @returns A record of addon IDs with their attachment names
 */
export function getAttachmentNamesByAddon(attachments: pg.ExtendedAddonAttachment[]): Record<string, string[]> {
  const addons: Record<string, string[]> = {}
  for (const attachment of attachments) {
    addons[attachment.addon.id] = [...(addons[attachment.addon.id] || []), attachment.name]
  }

  return addons
}

