import {Command, flags} from '@heroku-cli/command'
import {color} from '@heroku/heroku-cli-util'
import {postgresDatabaseExtensions} from '@heroku/sdk/extensions/data'
import {Args, ux} from '@oclif/core'

import ConfirmCommand from '../../../lib/confirm-command.js'
import {createSDK} from '../../../lib/sdk.js'
import {nls} from '../../../nls.js'

export default class Rotate extends Command {
  static args = {
    database: Args.string({description: `${nls('pg:database:arg:description')} ${nls('pg:database:arg:description:default:suffix')}`}),
  }
  static description = 'rotate the database credentials'
  static flags = {
    all: flags.boolean({description: 'rotate all credentials', exclusive: ['name']}),
    app: flags.app({required: true}),
    confirm: flags.string({char: 'c', description: 'set to app name to bypass confirm prompt'}),
    force: flags.boolean({description: 'forces rotating the targeted credentials'}),
    name: flags.string({
      char: 'n',
      description: 'which credential to rotate (default credentials if not specified and --all is not used)',
    }),
    remote: flags.remote(),
  }
  static topic = 'pg'

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Rotate)
    const {all, app, confirm, force, name} = flags
    const {data, platform} = createSDK(this.heroku, {extensions: [postgresDatabaseExtensions]})

    const cred = name || 'default'

    await data.postgresDatabase.rotateCredential(app, {all, credName: name, forced: force}, {
      addonIdentity: args.database,
      async beforeRotate({addon}) {
        const warnings: string[] = []

        if (all && force) {
          warnings.push('This forces rotation on all credentials including the default credential.')
        }

        let attachments = await platform.addOnAttachment.listByAddOn(addon.id)

        if (name) {
          attachments = attachments.filter(a => a.namespace === `credential:${cred}`)
        }

        if (!all) {
          warnings.push(`The password for the ${cred} credential will rotate.`)
        }

        if (all || force || cred === 'default') {
          warnings.push('Connections will be reset and applications will be restarted.')
        } else {
          warnings.push('Connections older than 30 minutes will be reset, and a temporary rotation username will be used during the process.')
        }

        if (force) {
          warnings.push(`Any followers lagging in replication (see ${color.code('heroku pg:info')}) will be inaccessible until caught up.`)
        }

        if (attachments.length > 0) {
          const uniqueAppNames = [...new Set(attachments.map(attachment => color.app(attachment.app.name || '')))]
            .sort()
            .join(', ')

          warnings.push(`This command will affect the app${(uniqueAppNames.length > 1) ? 's' : ''} ${uniqueAppNames}.`)
        }

        await new ConfirmCommand().confirm(app, confirm, `Destructive Action\n${warnings.join('\n')}`)

        if (all) {
          ux.action.start(`Rotating all credentials on ${color.datastore(addon.name)}`)
        } else {
          ux.action.start(`Rotating ${cred} on ${color.datastore(addon.name)}`)
        }
      },
    })

    ux.action.stop()
  }
}
