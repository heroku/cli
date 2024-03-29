import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {legacyEssentialPlan} from '../../../lib/pg/util'
import {getAddon} from '../../../lib/pg/fetcher'
import pgHost from '../../../lib/pg/host'
import {URL} from 'url'
import type {CredentialsInfo} from '../../../lib/pg/types'
import heredoc from 'tsheredoc'

export default class Url extends Command {
  static topic = 'pg';
  static description = 'show information on a database credential';
  static flags = {
    name: flags.string({
      char: 'n',
      description: 'which credential to show (default credentials if not specified)',
      default: 'default',
    }),
    app: flags.app({required: true}),
  };

  static args = {
    database: Args.string(),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Url)
    const {app, name} = flags
    const {database} = args
    const db = await getAddon(this.heroku, app, database)
    console.log('db', db)
    if (legacyEssentialPlan(db) && name !== 'default') {
      throw new Error('Legacy Essential-tier databases do not support named credentials.')
    }

    const {body: credInfo} = await this.heroku.get<CredentialsInfo>(
      `/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(name)}`,
      {hostname: pgHost()},
    )
    const activeCreds = credInfo.credentials.find(c => c.state === 'active')
    if (!activeCreds) {
      ux.error(`could not find any active credentials for ${name}`, {exit: 1})
    }

    const creds = Object.assign({}, db, {
      database: credInfo.database, host: credInfo.host, port: credInfo.port,
    }, {
      user: activeCreds?.user, password: activeCreds?.password,
    })
    const connUrl = new URL(`/${creds.database}`)
    connUrl.host = `${creds.host}:${creds.port}`
    if (creds.user && creds.password) {
      connUrl.username = creds.user
      connUrl.password = creds.password
    }

    connUrl.protocol = 'postgres:'
    ux.log(heredoc(`
      Connection information for ${color.yellow(name)} credential.
      Connection info string:
          "dbname=${creds.database} host=${creds.host} port=${creds.port} user=${creds.user} password=${creds.password} sslmode=require"
      Connection URL:
          ${connUrl}
    `))
  }
}
