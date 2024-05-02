'use strict'
const cli = require('@heroku/heroku-cli-util')

const HOST = process.env.HEROKU_REDIS_HOST || 'api.data.heroku.com'
const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

module.exports = (context, heroku) => {
  return {
    request(path, method, body) {
      let headers = {Accept: 'application/json'}
      if (process.env.HEROKU_HEADERS) {
        Object.assign(headers, JSON.parse(process.env.HEROKU_HEADERS))
      }

      return heroku[(method || 'GET').toLowerCase()](path, {
        host: HOST,
        auth: `${context.auth.username}:${context.auth.password}`,
        headers,
        body,
      })
    },

    makeAddonsFilter(filter) {
      if (filter) {
        filter = filter.toUpperCase()
      }

      function matches(addon) {
        for (let i = 0; i < addon.config_vars.length; i++) {
          let cfgName = addon.config_vars[i].toUpperCase()
          if (cfgName.includes(filter)) {
            return true
          }
        }

        if (addon.name.toUpperCase().includes(filter)) {
          return true
        }

        return false
      }

      function onResponse(addons) {
        let redisAddons = []
        // eslint-disable-next-line unicorn/no-for-loop
        for (let i = 0; i < addons.length; i++) {
          let addon = addons[i]
          let service = addon.addon_service.name

          if (service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
            redisAddons.push(addon)
          }
        }

        return redisAddons
      }

      return onResponse
    },

    async getRedisAddon(addonsList) {
      addonsList = addonsList || heroku.get(`/apps/${context.app}/addons`)

      let addonsFilter = this.makeAddonsFilter(context.args.database)
      let addons = addonsFilter(await addonsList)

      if (addons.length === 0) {
        cli.exit(1, 'No Redis instances found.')
      } else if (addons.length > 1) {
        let names = addons.map(function (addon) {
          return addon.name
        })
        cli.exit(1, `Please specify a single instance. Found: ${names.join(', ')}`)
      }

      return addons[0]
    },

    async info() {
      let addons = await heroku.get(`/apps/${context.app}/addons`)
      // filter out non-redis addons
      addons = this.makeAddonsFilter(context.args.database)(addons)
      // get info for each db
      let databases = addons.map(addon => {
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

      if (context.flags.json) {
        let redii = []
        for (let db of databases) {
          let redis = await db.redis
          // eslint-disable-next-line no-eq-null, eqeqeq
          if (redis == null) {
            continue
          }

          redis.app = db.addon.app
          redis.config_vars = db.addon.config_vars
          const {formation, metaas_source, port, ...filteredRedis} = redis
          redii.push(filteredRedis)
        }

        cli.styledJSON(redii)
        return
      }

      // print out the info of the addon and redis db info
      for (let db of databases) {
        const redis = await db.redis
        if (redis === null) {
          continue
        }

        cli.styledHeader(`${db.addon.name} (${db.addon.config_vars.join(', ')})`)
        cli.styledHash(
          redis.info.reduce(function (memo, row) {
            memo[row.name] = row.values
            return memo
          }, {}),
          redis.info.map(function (row) {
            return row.name
          }),
        )
      }
    },
  }
}
