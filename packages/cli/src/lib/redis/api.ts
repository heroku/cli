import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {APIClient} from '@heroku-cli/command'

export type RedisFormationResponse = {
  addon_id: string
  name: string
  plan: string
  created_at: string
  formation: {
    id: string
    primary: string | null
  }
  metaas_source: string
  port: number,
  resource_url: string,
  info: {
    name: string,
    values: string[]
  }[]
  version: string
  prefer_native_tls: boolean
  customer_encryption_key?: string
}

type RedisEvictionPolicies = 'noeviction' | 'allkeys-lru' | 'volatile-lru' | 'allkeys-random' | 'volatile-random' | 'volatile-ttl' | 'allkeys-lfu' | 'volatile-lfu'

export type RedisFormationConfigResponse = {
  maxmemory_policy: {
    desc: string,
    value: RedisEvictionPolicies,
    default: RedisEvictionPolicies,
    values: Record<RedisEvictionPolicies, string>
  },
  notify_keyspace_events: {
    desc: string,
    value: string,
    default: string,
  },
  timeout: {
    desc: string,
    value: number,
    default: number,
  },
  standby_segv_workaround: {
    desc: string,
    value: boolean,
    default: boolean,
  },
}

export default (app: string, database: string | undefined, json: boolean, heroku: APIClient) => {
  const HOST = process.env.HEROKU_REDIS_HOST || 'api.data.heroku.com'
  const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

  return {
    request<T>(path: string, method: 'GET' | 'POST' = 'GET', body = {}) {
      const headers = {Accept: 'application/json'}
      if (process.env.HEROKU_HEADERS) {
        Object.assign(headers, JSON.parse(process.env.HEROKU_HEADERS))
      }

      return heroku.request<T>(path, {
        hostname: HOST,
        method,
        headers,
        body,
      })
    },

    makeAddonsFilter(filter: string | undefined) {
      if (filter) {
        filter = filter.toUpperCase()
      }

      function matches(addon: Heroku.AddOn) {
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

      function onResponse(addons: Heroku.AddOn[]) {
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

    async getRedisAddon() {
      const {body: addons} = await heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`)

      const addonsFilter = this.makeAddonsFilter(database)
      const redisAddons = addonsFilter(addons)

      if (redisAddons.length === 0) {
        ux.error('No Redis instances found.', {exit: 1})
      } else if (addons.length > 1) {
        const names = redisAddons.map(function (addon) {
          return addon.name
        })
        ux.error(`Please specify a single instance. Found: ${names.join(', ')}`, {exit: 1})
      }

      return addons[0]
    },

    async info() {
      let {body: addons} = await heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`)
      // filter out non-redis addons
      addons = this.makeAddonsFilter(database)(addons)
      // get info for each db
      const databases = addons.map(addon => {
        return {
          addon: addon,
          redis: this.request<RedisFormationResponse>(`/redis/v0/databases/${addon.name}`).catch(function (error) {
            if (error.statusCode !== 404) {
              throw error
            }

            return null
          }),
        }
      })

      if (json) {
        const redii = []
        for (const db of databases) {
          // eslint-disable-next-line no-await-in-loop
          const {body: redis} = await db.redis || {}
          if (!redis) {
            continue
          }

          const json_data: RedisFormationResponse & {app?: Heroku.AddOn['app'], config_vars?: string[]} = redis
          json_data.app = db.addon.app
          json_data.config_vars = db.addon.config_vars
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const {formation, metaas_source, port, ...filteredRedis} = json_data
          redii.push(filteredRedis)
        }

        ux.styledJSON(redii)
        return
      }

      // print out the info of the addon and redis db info
      for (const db of databases) {
        // eslint-disable-next-line no-await-in-loop
        const {body: redis} = await db.redis || {}
        if (!redis) {
          continue
        }

        let uxHeader = db.addon.name
        if (db.addon && db.addon.config_vars) {
          uxHeader += ` (${db.addon.config_vars.join(', ')})`
        }

        if (uxHeader) {
          ux.styledHeader(uxHeader)
          ux.styledObject(
            // eslint-disable-next-line unicorn/no-array-reduce
            redis.info.reduce(function (memo: { [x: string]: any }, row: { name: string | number; values: any }) {
              memo[row.name] = row.values
              return memo
            }, {}),
            redis.info.map(row => row.name),
          )
        }
      }
    },
  }
}
