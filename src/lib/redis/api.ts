import {hux} from '@heroku/heroku-cli-util'
import {APIClient} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'

export type RedisFormationResponse = {
  addon_id: string
  created_at: string
  customer_encryption_key?: string
  formation: {
    id: string
    primary: null | string
  }
  info: {
    name: string,
    values: string[]
  }[]
  metaas_source: string
  name: string
  plan: string
  port: number,
  prefer_native_tls: boolean
  resource_url: string,
  version: string
}

type RedisEvictionPolicies = 'allkeys-lfu' | 'allkeys-lru' | 'allkeys-random' | 'noeviction' | 'volatile-lfu' | 'volatile-lru' | 'volatile-random' | 'volatile-ttl'

export type RedisApiResponse = {
  message: string
}

export type RedisFormationConfigResponse = {
  maxmemory_policy: {
    default: RedisEvictionPolicies,
    desc: string,
    value: RedisEvictionPolicies,
    values: Record<RedisEvictionPolicies, string>
  },
  notify_keyspace_events: {
    default: string,
    desc: string,
    value: string,
  },
  standby_segv_workaround: {
    default: boolean,
    desc: string,
    value: boolean,
  },
  timeout: {
    default: number,
    desc: string,
    value: number,
  },
}

export type RedisMaintenanceWindowResponse = {
  scheduled_at?: string
  window: null | string
}

export type RedisFormationWaitResponse = {
  message: string
  'waiting?': boolean
}

type HttpVerb = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export default (app: string, database: string | undefined, json: boolean, heroku: APIClient) => {
  const HOST = process.env.HEROKU_DATA_HOST || process.env.HEROKU_REDIS_HOST || 'api.data.heroku.com'
  const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

  return {
    async getRedisAddon(addons?: Required<Heroku.AddOn>[]): Promise<Required<Heroku.AddOn>> {
      if (!addons) {
        ({body: addons} = await heroku.get<Required<Heroku.AddOn>[]>(`/apps/${app}/addons`))
      }

      const addonsFilter = this.makeAddonsFilter(database)
      const redisAddons = addonsFilter(addons)

      if (redisAddons.length === 0) {
        ux.error('No Redis instances found.', {exit: 1})
      } else if (redisAddons.length > 1) {
        const names = redisAddons.map(addon => addon.name)
        ux.error(`Please specify a single instance. Found: ${names.join(', ')}`, {exit: 1})
      }

      return redisAddons[0] as Required<Heroku.AddOn>
    },

    async info() {
      let {body: addons} = await heroku.get<Required<Heroku.AddOn>[]>(`/apps/${app}/addons`)
      // filter out non-redis addons
      addons = this.makeAddonsFilter(database)(addons)
      // get info for each db
      const databases = addons.map(addon => ({
        addon,
        redis: this.request<RedisFormationResponse>(`/redis/v0/databases/${addon.name}`).catch(error => {
          if (error.statusCode !== 404) {
            throw error
          }

          return null
        }),
      }))

      if (json) {
        const redii = []
        for (const db of databases) {
          const {body: redis} = await db.redis || {}
          if (!redis) {
            continue
          }

          const json_data: {app?: Heroku.AddOn['app'], config_vars?: string[]} & RedisFormationResponse = redis
          json_data.app = db.addon.app
          json_data.config_vars = db.addon.config_vars
          const {formation, metaas_source, port, ...filteredRedis} = json_data
          redii.push(filteredRedis)
        }

        hux.styledJSON(redii)
        return
      }

      // print out the info of the addon and redis db info
      for (const db of databases) {
        const {body: redis} = await db.redis || {}
        if (!redis) {
          continue
        }

        let uxHeader = db.addon.name
        if (db.addon && db.addon.config_vars) {
          uxHeader += ` (${db.addon.config_vars.join(', ')})`
        }

        if (uxHeader) {
          hux.styledHeader(uxHeader)
          hux.styledObject(
            // eslint-disable-next-line unicorn/no-array-reduce
            redis.info.reduce((memo: { [x: string]: any }, row: { name: number | string; values: any }) => {
              memo[row.name] = row.values
              return memo
            }, {}),
            redis.info.map(row => row.name),
          )
        }
      }
    },

    makeAddonsFilter(filter: string | undefined) {
      if (filter) {
        filter = filter.toUpperCase()
      }

      function matches(addon: Required<Heroku.AddOn>) {
        const configVars = addon.config_vars || []
        for (const configVar of configVars) {
          const cfgName = configVar.toUpperCase()
          if (filter && cfgName.includes(filter)) {
            return true
          }
        }

        if (addon.name && filter && addon.name.toUpperCase().includes(filter)) {
          return true
        }

        return false
      }

      function onResponse(addons: Required<Heroku.AddOn>[]) {
        const redisAddons = []
        for (const addon of addons) {
          const service = addon?.addon_service?.name

          if (service && service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
            redisAddons.push(addon)
          }
        }

        return redisAddons
      }

      return onResponse
    },

    request<T>(path: string, method: HttpVerb = 'GET', body: unknown = null) {
      const headers = {}
      if (process.env.HEROKU_HEADERS) {
        Object.assign(headers, JSON.parse(process.env.HEROKU_HEADERS))
      }

      return heroku.request<T>(path, {
        body,
        headers,
        hostname: HOST,
        method,
      })
    },
  }
}
