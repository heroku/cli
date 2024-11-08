import {Command, flags} from '@heroku-cli/command'
import {Args} from '@oclif/core'
import redisApi, {RedisFormationConfigResponse} from '../../lib/redis/api'
import heredoc from 'tsheredoc'
import {ux} from '@oclif/core'

export default class KeyspaceNotifications extends Command {
  static topic = 'redis'
  static description = heredoc`
    set the keyspace notifications configuration
    Set the configuration to enable keyspace notification events:
    K     Keyspace events, published with __keyspace@<db>__ prefix.
    E     Keyevent events, published with __keyevent@<db>__ prefix.
    g     Generic commands (non-type specific) like DEL, EXPIRE, RENAME, ...
    $     String commands
    l     List commands
    s     Set commands
    h     Hash commands
    z     Sorted set commands
    t     Stream commands
    x     Expired events (events generated every time a key expires)
    e     Evicted events (events generated when a key is evicted for maxmemory)
    m     Key miss events (events generated when a key that doesn't exist is accessed)
    A     Alias for "g$lshztxe", so that the "AKE" string means all the events except "m".

    pass an empty string ('') to disable keyspace notifications
  `

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    config: flags.string({char: 'c', description: 'set keyspace notifications configuration', hasValue: true, required: true}),
  }

  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(KeyspaceNotifications)
    const {app, config} = flags
    const {database} = args
    const api = redisApi(app, database, false, this.heroku)

    const addon = await api.getRedisAddon()

    const {body: updated_config} = await api.request<RedisFormationConfigResponse>(
      `/redis/v0/databases/${addon.name}/config`, 'PATCH', {notify_keyspace_events: config},
    )
    ux.log(`Keyspace notifications for ${addon.name} (${addon.config_vars.join(', ')}) set to '${updated_config.notify_keyspace_events.value}'.`)
  }
}
