/* eslint-disable complexity */
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, utils} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {getRelease} from '../../lib/pg/fetcher.js'
import {PgDatabase, PgStatus} from '../../lib/pg/types.js'
import {nls} from '../../nls.js'

const heredoc = tsheredoc.default

export default class Promote extends Command {
  static args = {
    database: Args.string({description: nls('pg:database:arg:description'), required: true}),
  }
  static description = 'sets DATABASE as your DATABASE_URL'
  static flags = {
    app: flags.app({required: true}),
    force: flags.boolean({char: 'f'}),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Promote)
    const {app, force} = flags
    const {database} = args
    const dbResolver = new utils.pg.DatabaseResolver(this.heroku)
    const attachment = await dbResolver.getAttachment(app, database)
    ux.action.start(`Ensuring an alternate alias for existing ${color.datastore('DATABASE_URL')}`)
    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/apps/${app}/addon-attachments`)
    const current = attachments.find(a => a.name === 'DATABASE')
    if (current) {
      // eslint-disable-next-line eqeqeq
      if (current.addon?.name === attachment.addon.name && current.namespace == attachment.namespace) {
        if (attachment.namespace) {
          ux.error(`${color.attachment(attachment.name)} is already promoted on ${color.app(app)}`)
        } else {
          ux.error(`${color.addon(attachment.addon.name)} is already promoted on ${color.app(app)}`)
        }
      }

      const existing = attachments.filter(a => a.addon?.id === current.addon?.id && a.namespace === current.namespace)
        .find(a => a.name !== 'DATABASE')
      if (existing) {
        ux.action.stop(color.attachment(existing.name + '_URL'))
      } else {
        // The current add-on occupying the DATABASE attachment has no
        // other attachments. In order to promote this database without
        // error, we can create a secondary attachment, just-in-time.
        const {body: backup} = await this.heroku.post<Heroku.AddOnAttachment>('/addon-attachments', {
          body: {
            addon: {name: current.addon?.name},
            app: {name: app},
            confirm: app,
            namespace: current.namespace,
          },
        })
        ux.action.stop(color.attachment(backup.name + '_URL'))
      }
    }

    if (!force) {
      const {body: status} = await this.heroku.get<PgStatus>(`/client/v11/databases/${attachment.addon.id}/wait_status`, {
        hostname: utils.pg.host(),
      })
      if (status['waiting?']) {
        ux.error(heredoc(`
          Database cannot be promoted while in state: ${status.message}

          Promoting this database can lead to application errors and outage. Please run ${color.code('heroku pg:wait')} to wait for database to become available.

          To ignore this error, you can pass the --force flag to promote the database and risk application issues.
        `))
      }
    }

    const promotionMessage = attachment.namespace
      ? `Promoting ${color.attachment(attachment.name)} to ${color.datastore('DATABASE_URL')} on ${color.app(app)}`
      : `Promoting ${color.datastore(attachment.addon.name)} to ${color.datastore('DATABASE_URL')} on ${color.app(app)}`

    ux.action.start(promotionMessage)
    await this.heroku.post('/addon-attachments', {
      body: {
        addon: {name: attachment.addon.name},
        app: {name: app},
        confirm: app,
        name: 'DATABASE',
        namespace: attachment.namespace || null,
      },
    })
    ux.action.stop()
    const currentPooler = attachments.find(a => a.namespace === 'connection-pooling:default' && a.addon?.id === current?.addon?.id && a.name === 'DATABASE_CONNECTION_POOL')
    if (currentPooler) {
      ux.action.start('Reattaching pooler to new leader')
      await this.heroku.post('/addon-attachments', {
        body: {
          addon: {name: attachment.addon.name},
          app: {name: app},
          confirm: app,
          name: currentPooler.name,
          namespace: 'connection-pooling:default',
        },
      })
      ux.action.stop()
    }

    const {body: promotedDatabaseDetails} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${attachment.addon.id}`, {
      hostname: utils.pg.host(),
    })
    if (promotedDatabaseDetails.following) {
      const unfollowLeaderCmd = `heroku pg:unfollow ${attachment.addon.name}`
      ux.warn(heredoc(`
        Your database has been promoted but it is currently a follower database in read-only mode.

        Promoting a database with ${color.code('heroku pg:promote')} doesn't automatically unfollow its leader.

        Use ${color.code(unfollowLeaderCmd)} to stop this follower from replicating from its leader (${color.datastore(promotedDatabaseDetails.leader as string)}) and convert it into a writable database.
      `))
    }

    const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
    const releasePhase = formation.find(process => process.type === 'release')
    if (releasePhase) {
      ux.action.start('Checking release phase')
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
        headers: {
          Range: 'version ..; max=5, order=desc',
        },
        partial: true,
      })

      const attach = releases.find(release => release.description?.includes('Attach DATABASE'))
      const detach = releases.find(release => release.description?.includes('Detach DATABASE'))
      if (!attach || !detach) {
        ux.error('Unable to check release phase. Check your Attach DATABASE release for failures.')
      }

      const endTime = Date.now() + 900_000 // 15 minutes from now
      const [attachId, detachId] = [attach?.id as string, detach?.id as string]
      while (true) {
        const attach = await getRelease(this.heroku, app, attachId)
        if (attach && attach.status === 'succeeded') {
          let msg = 'pg:promote succeeded.'
          const detach = await getRelease(this.heroku, app, detachId)
          if (detach && detach.status === 'failed') {
            msg += ` It is safe to ignore the failed ${detach.description} release.`
          }

          ux.action.stop(msg)
          return
        }

        if (attach && attach.status === 'failed') {
          let msg = `pg:promote failed because ${attach.description} release was unsuccessful. Your application is currently running `
          const detach = await getRelease(this.heroku, app, detachId)
          msg += detach && detach.status === 'succeeded'
            ? 'without an attached DATABASE_URL.'
            : `with ${current?.addon?.name} attached as DATABASE_URL.`

          msg += ' Check your release phase logs for failure causes.'
          ux.action.stop(msg)
          return
        }

        if (Date.now() > endTime) {
          ux.action.stop('timeout. Check your Attach DATABASE release for failures.')
          return
        }

        await new Promise(resolve => setTimeout(resolve, 5000))
      }
    }
  }
}
