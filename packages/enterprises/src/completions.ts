import {APIClient, flags} from '@heroku-cli/command'
import {IConfig} from '@oclif/config'

export const oneDay = 60 * 60 * 24

const herokuGet = async (resource: string, config: IConfig, cbk?: (d: any) => string): Promise<string[]> => {
  const heroku = new APIClient(config)
  let {body} = await heroku.get<any[]>(resource, {retryAuth: false})
  // tslint:disable-next-line:strict-type-predicates
  if (typeof body === 'string') body = JSON.parse(body)
  if (cbk) return (body as string[]).map(cbk).sort()
  return (body as string[]).map((a: any) => a.name).sort()
}

export const Accounts: flags.ICompletion = {
  cacheDuration: oneDay * 30, // one month
  cacheKey: async _ => 'enterprise_accounts',
  options: async ctx => herokuGet('/enterprise-accounts', ctx.config),
}

export const AccountMembers: flags.ICompletion = {
  cacheDuration: oneDay * 30, // one month
  cacheKey: async ctx => {
    return ctx.flags && ctx.flags['enterprise-account'] ? `${ctx.flags['enterprise-account']}_members` : ''
  },
  options: async ctx => {
    const ea = ctx.flags && ctx.flags['enterprise-account']
    if (!ea) return []
    const emailsCbk = (m: any): string => m.user && m.user.email
    return herokuGet(`/enterprise-accounts/${ea}/members`, ctx.config, emailsCbk)
  }
}

export const Permissions: flags.ICompletion = {
  skipCache: true,
  options: async _ => ['billing', 'create', 'manage', 'view'],
}

export const Teams: flags.ICompletion = {
  cacheDuration: oneDay * 30, // one month
  cacheKey: async ctx => {
    return ctx.flags && ctx.flags['enterprise-account'] ? `${ctx.flags['enterprise-account']}_teams` : ''
  },
  options: async ctx => {
    const ea = ctx.flags && ctx.flags['enterprise-account']
    if (!ea) return []
    return herokuGet(`/enterprise-accounts/${ea}/teams`, ctx.config)
  }
}

export const Archives: flags.ICompletion = {
  cacheDuration: oneDay * 30, // one month
  cacheKey: async ctx => {
    return ctx.flags && ctx.flags['enterprise-account'] ? `${ctx.flags['enterprise-account']}_archives` : ''
  },
  options: async ctx => {
    const ea = ctx.flags && ctx.flags['enterprise-account']
    if (!ea) return []
    const archiveCbk = (archive: any): string => `${archive.year}-${archive.month}`
    return herokuGet(`/enterprise-accounts/${ea}/archives`, ctx.config, archiveCbk)
  }
}
