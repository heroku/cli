import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

export default class MaxMemory extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }
  static description = `set the key eviction policy when instances reach their storage limit
  Available policies for key eviction include:

  noeviction      # returns errors when memory limit is reached
  allkeys-lfu     # removes less frequently used keys first
  volatile-lfu    # removes less frequently used keys first that have an expiry set
  allkeys-lru     # removes less recently used keys first
  volatile-lru    # removes less recently used keys first that have an expiry set
  allkeys-random  # evicts random keys
  volatile-random # evicts random keys but only those that have an expiry set
  volatile-ttl    # only evicts keys with an expiry set and a short TTL
  `
  static flags = {
    app: flags.app({required: true}),
    policy: flags.string({char: 'p', description: 'set policy name', required: true}),
    remote: flags.remote(),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(MaxMemory)
    const {app, policy} = flags
    const {database} = args

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})
    const config = await data.redis.updateConfig(addon.name!, {maxmemory_policy: policy} as never)
    const configVars = addon.config_vars || []
    ux.stdout(`Maxmemory policy for ${addon.name} (${configVars.join(', ')}) set to ${config.maxmemory_policy.value}.`)
    ux.stdout(`${config.maxmemory_policy.value} ${config.maxmemory_policy.values[config.maxmemory_policy.value as keyof typeof config.maxmemory_policy.values]}.`)
  }
}
