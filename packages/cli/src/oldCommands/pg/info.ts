/*
import {color, utils} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import {ExtendedAddonAttachment, hux} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {configVarNamesFromValue, databaseNameFromUrl} from '../../lib/pg/util'
import {PgDatabaseTenant} from '../../lib/pg/types'
import {nls} from '../../nls'

type DBObject = {
  addon: ExtendedAddonAttachment | ExtendedAddonAttachment['addon'] & {attachment_names?: string[]},
  configVars?: string[],
  dbInfo: PgDatabaseTenant | null,
  config: Heroku.ConfigVars,
}

function displayDB(db: DBObject, app: string) {
  if (db.addon.attachment_names) {
    hux.styledHeader(db.addon.attachment_names.map((c: string) => color.attachment(c + '_URL'))
      .join(', '))
  } else {
    hux.styledHeader(db.configVars?.map(c => color.green(c))
      .join(', ') || '')
  }

  if (db.addon.app.name && db.addon.app.name !== app) {
    db.dbInfo?.info.push({name: 'Billing App', values: [color.app(db.addon.app.name)]})
  }

  db.dbInfo?.info.push({name: 'Add-on', values: [color.database(db.addon.name)]})
  const info: Record<string, never> | Record<string, string> = {}
  db.dbInfo?.info.forEach(infoObject => {
    if (infoObject.values.length > 0) {
      let valuesArray: string[]
      if (infoObject.resolve_db_name) {
        valuesArray = infoObject.values.map(v => databaseNameFromUrl(v, db.config))
      } else {
        valuesArray = infoObject.values
      }

      info[infoObject.name] = valuesArray.join(', ')
    }
  })
  const keys = db.dbInfo?.info.map(i => i.name)
  hux.styledObject(info, keys)
  ux.log()
}

export default class Info extends Command {
    static topic = 'pg';
    static description = 'show database information';
    static flags = {
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    static args = {
      database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:all-dbs:suffix')}`}),
    };

    static aliases = ['pg']

    public async run(): Promise<void> {
      const {flags, args} = await this.parse(Info)
      const {app} = flags
      const {sortBy} = require('lodash')
      const {database: db} = args
      let addons: Array<ExtendedAddonAttachment | ExtendedAddonAttachment['addon'] & {attachment_names?: string[]}>
      const {body: config} = await this.heroku.get<Heroku.ConfigVars>(`/apps/${app}/config-vars`)
      if (db) {
        const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
        const {addon} = await dbResolver.getAttachment(app, db)
        addons = [addon]
      } else {
        const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
        addons = await dbResolver.getAllLegacyDatabases(app)
        if (addons.length === 0) {
          ux.log(`${color.app(app)} has no heroku-postgresql databases.`)
          return
        }
      }

      let dbs: DBObject[] = await Promise.all(addons.map(async addon => {
        const pgResponse = await this.heroku.get<PgDatabaseTenant>(
          `/client/v11/databases/${addon.id}`,
          {
            hostname: utils.pg.host(),
          })
          .catch(error => {
            if (error.statusCode !== 404)
              throw error
            ux.warn(`${color.database(addon.name)} is not yet provisioned.\nRun ${color.cyan.bold('heroku addons:wait')} to wait until the db is provisioned.`)
          })
        const {body: dbInfo} = pgResponse || {body: null}
        return {
          addon,
          config,
          dbInfo,
        }
      }))
      dbs = dbs.filter(db => db.dbInfo)
      dbs.forEach(db => {
        db.configVars = configVarNamesFromValue(db.config, db.dbInfo?.resource_url || '')
      })
      dbs = sortBy(dbs, (db: DBObject) => db.configVars && db.configVars[0] !== 'DATABASE_URL', 'configVars[0]')
      dbs.forEach(db => displayDB(db, app))
    }
}
*/
