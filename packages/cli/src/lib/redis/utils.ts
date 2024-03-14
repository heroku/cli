'use strict'
import {AddOn} from '@heroku-cli/schema'
import {APIClient} from '@heroku-cli/command'
import {HTTP} from 'http-call'
import {ux} from '@oclif/core'

const HOST = process.env.HEROKU_REDIS_HOST || 'api.data.heroku.com'
const ADDON = process.env.HEROKU_REDIS_ADDON_NAME || 'heroku-redis'

export interface RedisFormation {
  addon_id: string
  name: string
  plan: string
  created_at: string,
  formation: {
    id: string
    primary: string
  },
  metaas_source: string,
  port: number
  resource_url: string
  info: {name: string, values: string }[],
  version: string
  prefer_native_tls: boolean,
}

export function makeAddonsFilter(filter = '') {
  const matcher = new RegExp(`/(${filter})/ig`)

  function matches(addon: Required<AddOn>) {
    for (let i = 0; i < addon.config_vars.length; i++) {
      if (matcher.test(addon.config_vars[i])) {
        return true
      }
    }

    return matcher.test(addon.name)
  }

  function onResponse(addons: Required<AddOn>[]) {
    const redisAddons = []
    // eslint-disable-next-line unicorn/no-for-loop
    for (let i = 0; i < addons.length; i++) {
      const addon = addons[i]
      const service = addon.addon_service.name ?? ''

      if (service.indexOf(ADDON) === 0 && (!filter || matches(addon))) {
        redisAddons.push(addon)
      }
    }

    return redisAddons
  }

  return onResponse
}

export async function getRedisAddon(appId: string, database: string | undefined, heroku: APIClient, addonsRequest?: Promise<HTTP<Required<AddOn[]>>>) {
  addonsRequest = addonsRequest || heroku.get(`/apps/${appId}/addons`)
  const {body: addonsList} = await addonsRequest
  const addonsFilter = makeAddonsFilter(database ?? '')
  const addons = addonsFilter(addonsList as Required<AddOn>[])

  if (addons.length === 0) {
    ux.error('No Redis instances found.', {exit: 1})
  } else if (addons.length > 1) {
    const names = addons.map(function (addon) {
      return addon.name
    })
    ux.error(`Please specify a single instance. Found: ${names.join(', ')}`, {exit: 1})
  }

  return addons[0]
}

type StyledRedisJson = Omit<RedisFormation, 'formation' | 'metaas_source' | 'port'> & Pick<Required<AddOn>, 'app' | 'config_vars'>
export async function getRedisFormation(heroku: APIClient, formationIdentifier: string): Promise<HTTP<RedisFormation>> {
  return heroku.request<RedisFormation>(`/redis/v0/databases/${formationIdentifier}`, {hostname: HOST, port: 443})
}

export async function info(heroku: APIClient, appId: string, database: string, json: boolean) {
  let {body: addons} = await heroku.get<Required<AddOn>[]>(`/apps/${appId}/addons`)
  // filter out non-redis addons
  addons = makeAddonsFilter(database)(addons)
  // get info for each db
  const dbs = await Promise.allSettled(addons.map(addon => getRedisFormation(heroku, addon.name)))
  const databases = addons.map((addon, index) => {
    const promiseSettledResult = dbs[index]
    return {
      addon: addon,
      redis() {
        if (promiseSettledResult.status === 'fulfilled') {
          return promiseSettledResult.value.body
        }

        const {message, statusCode} = promiseSettledResult.reason as {message: string, statusCode: number}
        if (statusCode !== 404) {
          ux.error(message, {exit: 1})
        }

        return null
      },
    }
  })

  if (json) {
    const redii: StyledRedisJson[] = []
    for (const db of databases) {
      const redis = db.redis()
      // eslint-disable-next-line no-eq-null, eqeqeq
      if (redis == null) {
        continue
      }

      const {formation, metaas_source, port, ...others} = redis
      const filteredRedis: StyledRedisJson = {...others, app: db.addon.app, config_vars: db.addon.config_vars}

      redii.push(filteredRedis)
    }

    return ux.styledJSON(redii)
  }

  // print out the info of the addon and redis db info
  for (const db of databases) {
    const redis = db.redis()
    if (redis === null) {
      continue
    }

    ux.styledHeader(`${db.addon.name} (${db.addon.config_vars.join(', ')})`)
    ux.styledObject(
      redis.info.reduce((memo: Record<string, unknown>, row) => {
        memo[row.name] = row.values
        return memo
      }, {}),
      redis.info.map(function (row) {
        return row.name
      }),
    )
  }
}
