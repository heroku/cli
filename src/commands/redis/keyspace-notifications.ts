import {Command, flags} from '@heroku-cli/command'
import {HerokuSDK} from '@heroku/sdk'
import {redisExtensions} from '@heroku/sdk/extensions/data'
import {Args} from '@oclif/core'
import tsheredoc from 'tsheredoc'

const heredoc = tsheredoc.default

export default class KeyspaceNotifications extends Command {
  static args = {
    database: Args.string({description: 'name of the Key-Value Store database. If omitted, it defaults to the primary database associated with the app.'}),
  }
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
    config: flags.string({char: 'c', description: 'set keyspace notifications configuration', required: true}),
    remote: flags.remote(),
  }
  static topic = 'redis'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(KeyspaceNotifications)
    const {app, config} = flags
    const {database} = args

    const {data} = new HerokuSDK({extensions: [redisExtensions]})
    const addon = await data.redis.resolveByApp(app, {database})
    const updatedConfig = await data.redis.updateConfig(addon.name!, {notify_keyspace_events: config} as never)
    this.log(`Keyspace notifications for ${addon.name} (${addon.config_vars!.join(', ')}) set to '${updatedConfig.notify_keyspace_events.value}'.`)
  }
}
