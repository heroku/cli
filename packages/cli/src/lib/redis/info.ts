import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {APIClient} from '@heroku-cli/command'

export default (app: string, database: string | undefined, json: boolean, heroku: APIClient) => {
  const HOST = process.env.HEROKU_REDIS_HOST || 'api.data.heroku.com'
  const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

  return {
    request(path: string, method = 'get', body = {}) {
      const headers = {Accept: 'application/json'}
      if (process.env.HEROKU_HEADERS) {
        Object.assign(headers, JSON.parse(process.env.HEROKU_HEADERS))
      }

      return heroku.request(path, {
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
        for (const configVar of addon.configVars) {
          const cfgName = configVar.toUpperCase()
          if (cfgName.includes(filter)) {
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
