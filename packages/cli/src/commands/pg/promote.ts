/* eslint-disable complexity */
import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import {attachment, getRelease} from '../../lib/pg/fetcher'
import pgHost from '../../lib/pg/host'
import {PgStatus, PgDatabase} from '../../lib/pg/types'

// const cli = require('heroku-cli-util')
// const host = require('../lib/host')
export default class Promote extends Command {
  static topic = 'pg';
  static description = 'sets DATABASE as your DATABASE_URL';
  static flags = {
    force: flags.boolean({char: 'f'}),
    app: flags.app({required: true}),
    remote: flags.remote(),
  };

  static args = {
    database: Args.string({required: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Promote)
    // const fetcher = require('../lib/fetcher')(heroku)
    // const {app, args, flags} = context
    const {force, app} = flags
    const {database} = args
    const dbAttachment = await attachment(this.heroku, app, database)
    // let current
    // let attachments
    ux.action.start(`Ensuring an alternate alias for existing ${color.green('DATABASE_URL')}`)
    // await ux.action(`Ensuring an alternate alias for existing ${color.green('DATABASE_URL')}`, (async () => {
    const {body: attachments} = await this.heroku.get<Heroku.AddOnAttachment[]>(`/apps/${app}/addon-attachments`)
    // attachments = addonAttachments
    const current = attachments.find(a => a.name === 'DATABASE')
    if (!current)
      return
    if (current.addon?.name === dbAttachment.addon.name && current.namespace === dbAttachment.namespace) {
      if (dbAttachment.namespace) {
        throw new Error(`${color.cyan(dbAttachment.name)} is already promoted on ${color.magenta(app)}`)
      } else {
        throw new Error(`${color.yellow(dbAttachment.addon.name)} is already promoted on ${color.magenta(app)}`)
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
          app: {name: app}, addon: {name: current.addon?.name}, namespace: current.namespace, confirm: app,
        },
      })
      ux.action.stop(color.green(backup.name + '_URL'))
    }

    if (!force) {
      const {body: status} = await this.heroku.get<PgStatus>(`/client/v11/databases/${dbAttachment.addon.id}/wait_status`, {
        hostname: pgHost(),
      })
      if (status['waiting?']) {
        ux.error(heredoc(`
          Database cannot be promoted while in state: ${status.message}
          
          Promoting this database can lead to application errors and outage. Please run ${color.cmd('pg:wait')} to wait for database to become available.
          
          To ignore this error, you can pass the --force flag to promote the database and risk application issues.
        `))
        // ux.error(`Database cannot be promoted while in state: ${status.message}\n\nPromoting this database can lead to application errors and outage. Please run pg:wait to wait for database to become available.\n\nTo ignore this error, you can pass the --force flag to promote the database and risk application issues.`)
      }
    }

    let promotionMessage
    if (dbAttachment.namespace) {
      promotionMessage = `Promoting ${color.cyan(dbAttachment.name)} to ${color.green('DATABASE_URL')} on ${color.magenta(app)}`
    } else {
      promotionMessage = `Promoting ${color.addon(dbAttachment.addon.name)} to ${color.green('DATABASE_URL')} on ${color.magenta(app)}`
    }

    ux.action.start(promotionMessage)
    // await ux.action(promotionMessage, (async function () {
    await this.heroku.post('/addon-attachments', {
      body: {
        name: 'DATABASE',
        app: {name: app},
        addon: {name: dbAttachment.addon.name},
        namespace: dbAttachment.namespace,
        confirm: app,
      },
    })
    ux.action.stop()
    // })())
    const currentPooler = attachments.find(a => a.namespace === 'connection-pooling:default' && a.addon?.id === current.addon?.id && a.name === 'DATABASE_CONNECTION_POOL')
    if (currentPooler) {
      ux.action.start('Reattaching pooler to new leader')
      // await ux.action('Reattaching pooler to new leader', (async function () {
      await this.heroku.post('/addon-attachments', {
        body: {
          name: currentPooler.name,
          app: {name: app},
          addon: {name: dbAttachment.addon.name},
          namespace: 'connection-pooling:default',
          confirm: app,
        },
      })
      // })())
      ux.action.stop()
    }

    const {body: promotedDatabaseDetails} = await this.heroku.get<PgDatabase>(`/client/v11/databases/${dbAttachment.addon.id}`, {
      hostname: pgHost(),
    })
    if (promotedDatabaseDetails.following) {
      const unfollowLeaderCmd = `heroku pg:unfollow ${dbAttachment.addon.name}`
      ux.warn(heredoc(`
        WARNING: Your database has been promoted but it is currently a follower database in read-only mode.
        
        Promoting a database with ${color.cmd('heroku pg:promote')} doesn't automatically unfollow its leader.
        
        Use ${color.cyan(unfollowLeaderCmd)} to stop this follower from replicating from its leader (${color.yellow(promotedDatabaseDetails.leader as string)}) and convert it into a writable database.
      `))
      // ux.warn(`WARNING: Your database has been promoted but it is currently a follower database in read-only mode.\n      \n Promoting a database with ${color.cyan.bold('heroku pg:promote')} doesn't automatically unfollow its leader.\n      \n Use ${color.cyan.bold(unfollowLeaderCmd)} to stop this follower from replicating from its leader (${color.yellow(promotedDatabaseDetails.leader.name)}) and convert it into a writable database.`)
    }

    const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
    const releasePhase = formation.find(process => process.type === 'release')
    if (releasePhase) {
      ux.action.start('Checking release phase')
      // await ux.action('Checking release phase', (async function () {
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
        partial: true,
        headers: {
          Range: 'version ..; max=5, order=desc',
        },
      })
      // let releases = await this.heroku.request({
      //   path: `/apps/${app}/releases`, partial: true, headers: {
      //     Range: 'version ..; max=5, order=desc',
      //   },
      // })
      const attach = releases.find(release => release.description?.includes('Attach DATABASE'))
      const detach = releases.find(release => release.description?.includes('Detach DATABASE'))
      if (!attach || !detach) {
        ux.error('Unable to check release phase. Check your Attach DATABASE release for failures.')
      }

      const endTime = Date.now() + 900000
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
          // return ux.action.done(msg)
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
          // return ux.action.done(msg)
        }

        if (Date.now() > endTime) {
          ux.action.stop('timeout. Check your Attach DATABASE release for failures.')
          // return ux.action.done('timeout. Check your Attach DATABASE release for failures.')
        }

        await new Promise(resolve => setTimeout(resolve, 5000))
      }
      // })())
    }
  }
}
