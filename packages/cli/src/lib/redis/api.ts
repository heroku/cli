import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {APIClient} from '@heroku-cli/command'

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
    request<T>(path: string, method = 'get', body = {}) {
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

    async getRedisAddon(addonsList?: Heroku.AddOn[]) {
      if (addonsList === undefined) {
        const {body: list} = await heroku.get<Heroku.AddOn[]>(`/apps/${app}/addons`)
        addonsList = list
      }

      const addonsFilter = this.makeAddonsFilter(database)
      const addons = addonsFilter(addonsList)

      if (addons.length === 0) {
        throw new Error('No Redis instances found.')
      } else if (addons.length > 1) {
        const names = addons.map(function (addon) {
          return addon.name
        })
        throw new Error(`Please specify a single instance. Found: ${names.join(', ')}`)
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
          redis: this.request(`/redis/v0/databases/${addon.name}`).catch(function (error) {
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
          const {body: redis} = <Heroku.AddOn> await db.redis || {}
          // eslint-disable-next-line no-eq-null, eqeqeq
          if (redis == null) {
            continue
          }

          redis.app = db.addon.app
          redis.config_vars = db.addon.config_vars
          const {formation, metaas_source, port, ...filteredRedis} = redis
          redii.push(filteredRedis)
        }

        ux.styledJSON(redii)
        return
      }

      // print out the info of the addon and redis db info
      for (const db of databases) {
        // eslint-disable-next-line no-await-in-loop
        const {body: redis} = <Heroku.AddOn> await db.redis || {}
        // eslint-disable-next-line no-eq-null, eqeqeq
        if (redis == null) {
          continue
        }

        let uxHeader = db.addon.name
        if (db.addon && db.addon.config_vars) {
          uxHeader += ` (${db.addon.config_vars.join(', ')})`
        }

        if (uxHeader) {
          ux.styledHeader(uxHeader)
          ux.styledObject(
            redis.info.reduce(function (memo: { [x: string]: any }, row: { name: string | number; values: any }) {
              memo[row.name] = row.values
              return memo
            }, {}),
            redis.info.map(function (row: { name: any }) {
              return row.name
            }),
          )
        }
      }
    },
  }
}
