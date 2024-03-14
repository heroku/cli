import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import redisApi from '../../lib/redis/api'

export default class MaxMemory extends Command {
  static topic = 'redis'
  static description = 'set the key eviction policy'
  static help = `Set the key eviction policy when instance reaches its storage limit. Available policies for key eviction include:

  noeviction      # returns errors when memory limit is reached
  allkeys-lfu     # removes less frequently used keys first
  volatile-lfu    # removes less frequently used keys first that have an expiry set
  allkeys-lru     # removes less recently used keys first
  volatile-lru    # removes less recently used keys first that have an expiry set
  allkeys-random  # evicts random keys
  volatile-random # evicts random keys but only those that have an expiry set
  volatile-ttl    # only evicts keys with an expiry set and a short TTL
`
  static aliases = ['redis']
  static flags = {
    app: flags.app({required: true}),
    policy: flags.string({char: 'p', description: 'set policy name', required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string(),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(MaxMemory)
    const {app, policy} = flags
    const {database} = args

    const addon = await redisApi(app, database, false, this.heroku).getRedisAddon()
    const {body: config}: {body: any} = await redisApi(app, database, false, this.heroku).request(`/redis/v0/databases/${addon.name}/config`, 'PATCH', {maxmemory_policy: policy})
    const configVars = addon.config_vars || []
    ux.log(`Maxmemory policy for ${addon.name} (${configVars.join(', ')}) set to ${config.maxmemory_policy.value}.`)
    ux.log(`${config.maxmemory_policy.value} ${config.maxmemory_policy.values[config.maxmemory_policy.value]}.`)
  }
}
