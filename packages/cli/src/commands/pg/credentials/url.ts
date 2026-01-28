import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'
import {URL} from 'url'

import type {CredentialInfo} from '../../../lib/pg/types.js'

import {nls} from '../../../nls.js'

const heredoc = tsheredoc.default

export default class Url extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }

  static description = 'show information on a database credential'
  static flags = {
    app: flags.app({required: true}),
    name: flags.string({
      char: 'n',
      default: 'default',
      description: 'which credential to show (default credentials if not specified)',
    }),
    remote: flags.remote(),
  }

  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Url)
    const {app, name} = flags
    const {database} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const {addon: db} = await dbResolver.getAttachment(app, database)
    if (utils.pg.isLegacyEssentialDatabase(db) && name !== 'default') {
      ux.error('Legacy Essential-tier databases do not support named credentials.')
    }

    const {body: credInfo} = await this.heroku.get<CredentialInfo>(
      `/postgres/v0/databases/${db.name}/credentials/${encodeURIComponent(name)}`,
      {
        headers: {
          Authorization: `Basic ${Buffer.from(`:${this.heroku.auth}`).toString('base64')}`,
        },
        hostname: utils.pg.host(),
      },
    )
    const activeCreds = credInfo.credentials.find(c => c.state === 'active')
    if (!activeCreds) {
      ux.error(`Could not find any active credentials for ${name}`, {exit: 1})
    }

    const creds = Object.assign({}, db, {
      database: credInfo.database, host: credInfo.host, port: credInfo.port,
    }, {
      user: activeCreds?.user, password: activeCreds?.password,
    })
    const connUrl = new URL(`postgres://${creds.host}/${creds.database}`)
    connUrl.port = creds.port.toString()
    if (creds.user && creds.password) {
      connUrl.username = creds.user
      connUrl.password = creds.password
    }

    ux.stdout(heredoc(`
      Connection information for ${color.yellow(name)} credential.
      Connection info string:
        "dbname=${creds.database} host=${creds.host} port=${creds.port} user=${creds.user} password=${creds.password} sslmode=require"
      Connection URL:
        ${connUrl}
    `))
  }
}
