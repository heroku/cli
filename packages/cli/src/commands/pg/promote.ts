/* eslint-disable complexity */
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {getAttachment, getRelease} from '../../lib/pg/fetcher'
import pgHost from '../../lib/pg/host'
import {PgStatus, PgDatabase} from '../../lib/pg/types'

export default class Promote extends Command {
  static topic = 'pg';
  static description = 'sets DATABASE as your DATABASE_URL';
  static flags = {
    force: flags.boolean({char: 'f'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    database: Args.string({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Promote)
    const {force, app} = flags
    const {database} = args
    const attachment = await getAttachment(this.heroku, app, database)
    ux.action.start(`Ensuring an alternate alias for existing ${color.green('DATABASE_URL')}`)
    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/apps/${app}/addon-attachments`)
    const current = attachments.find(a => a.name === 'DATABASE')
    if (!current)
      return
    // eslint-disable-next-line eqeqeq
    if (current.addon?.name === attachment.addon.name && current.namespace == attachment.namespace) {
      if (attachment.namespace) {
        ux.error(`${color.cyan(attachment.name)} is already promoted on ${color.app(app)}`)
      } else {
        ux.error(`${color.addon(attachment.addon.name)} is already promoted on ${color.app(app)}`)
      }
    }

    const existing = attachments.filter(a => a.addon?.id === current.addon?.id && a.namespace === current.namespace)
      .find(a => a.name !== 'DATABASE')
    if (existing) {
      ux.action.stop(color.green(existing.name + '_URL'))
    } else {
      // The current add-on occupying the DATABASE attachment has no
      // other attachments. In order to promote this database without
      // error, we can create a secondary attachment, just-in-time.
      const {body: backup} = await this.heroku.post<Heroku.AddOnAttachment>('/addon-attachments', {
        body: {
          app: {name: app},
          addon: {name: current.addon?.name},
          namespace: current.namespace,
          confirm: app,
        },
      })
      ux.action.stop(color.green(backup.name + '_URL'))
    }

    if (!force) {
      const {body: status} = await this.heroku.get<PgStatus>(`/client/v11/databases/${attachment.addon.id}/wait_status`, {
        hostname: pgHost(),
      })
      if (status['waiting?']) {
        ux.error(heredoc(`
          Database cannot be promoted while in state: ${status.message}
          
          Promoting this database can lead to application errors and outage. Please run ${color.cmd('heroku pg:wait')} to wait for database to become available.
          
          To ignore this error, you can pass the --force flag to promote the database and risk application issues.
        `))
      }
    }

    let promotionMessage
    if (attachment.namespace) {
      promotionMessage = `Promoting ${color.cyan(attachment.name)} to ${color.green('DATABASE_URL')} on ${color.app(app)}`
    } else {
      promotionMessage = `Promoting ${color.addon(attachment.addon.name)} to ${color.green('DATABASE_URL')} on ${color.app(app)}`
    }

    ux.action.start(promotionMessage)
    await this.heroku.post('/addon-attachments', {
      body: {
        name: 'DATABASE',
        app: {name: app},
        addon: {name: attachment.addon.name},
        namespace: attachment.namespace || null,
        confirm: app,
      },
    })
    ux.action.stop()
    const currentPooler = attachments.find(a => a.namespace === 'connection-pooling:default' && a.addon?.id === current.addon?.id && a.name === 'DATABASE_CONNECTION_POOL')
    if (currentPooler) {
      ux.action.start('Reattaching pooler to new leader')
      await this.heroku.post('/addon-attachments', {
        body: {
          name: currentPooler.name,
          app: {name: app},
          addon: {name: attachment.addon.name},
          namespace: 'connection-pooling:default',
          confirm: app,
        },
      })
      ux.action.stop()
    }

    const {body: promotedDatabaseDetails} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${attachment.addon.id}`, {
      hostname: pgHost(),
    })
    if (promotedDatabaseDetails.following) {
      const unfollowLeaderCmd = `heroku pg:unfollow ${attachment.addon.name}`
      ux.warn(heredoc(`
        Your database has been promoted but it is currently a follower database in read-only mode.
        
        Promoting a database with ${color.cmd('heroku pg:promote')} doesn't automatically unfollow its leader.
        
        Use ${color.cmd(unfollowLeaderCmd)} to stop this follower from replicating from its leader (${color.yellow(promotedDatabaseDetails.leader as string)}) and convert it into a writable database.
      `))
    }

    const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
    const releasePhase = formation.find(process => process.type === 'release')
    if (releasePhase) {
      ux.action.start('Checking release phase')
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
        partial: true,
        headers: {
          Range: 'version ..; max=5, order=desc',
        },
      })

      const attach = releases.find(release => release.description?.includes('Attach DATABASE'))
      const detach = releases.find(release => release.description?.includes('Detach DATABASE'))
      if (!attach || !detach) {
        ux.error('Unable to check release phase. Check your Attach DATABASE release for failures.')
      }

      const endTime = Date.now() + 900000 // 15 minutes from now
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
          if (detach && detach.status === 'succeeded') {
            msg += 'without an attached DATABASE_URL.'
          } else {
            msg += `with ${current.addon?.name} attached as DATABASE_URL.`
          }

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
