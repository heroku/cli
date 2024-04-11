import type {AddOnAttachmentWithConfigVarsAndPlan} from './types'
import {parse} from 'url'
import {env} from 'process'

export function getConfigVarName(configVars: string[]): string {
  const connStringVars = configVars.filter(cv => (cv.endsWith('_URL')))
  if (connStringVars.length === 0) throw new Error('Database URL not found for this addon')
  return connStringVars[0]
}

export const essentialNumPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/^essential/))
export const legacyEssentialPlan = (addon: AddOnAttachmentWithConfigVarsAndPlan) => Boolean(addon?.plan?.name?.split(':')[1].match(/(dev|basic|mini)$/))

export function essentialPlan(addon:AddOnAttachmentWithConfigVarsAndPlan) {
  return essentialNumPlan(addon) || legacyEssentialPlan(addon)
}

export const parsePostgresConnectionString = (db: string) => {
  const dbPath = db.match(/:\/\//) ? db : `postgres:///${db}`
  const parsedURL = parse(dbPath)
  const {auth, hostname, pathname, port} = parsedURL
  const [user, password] = auth ? auth.split(':') : []
  const databaseName = pathname && pathname.charAt(0) === '/' ?
    pathname.slice(1) || null :
    pathname
  return {
    ...parsedURL,
    user,
    password,
    database: databaseName,
    host: hostname,
    port: hostname ? port || env.PGPORT || 5432 : port || env.PGPORT,
  }
}
