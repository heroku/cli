import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {trapConfirmationRequired} from '../../lib/addons/util'

export default class Attach extends Command {
    static topic = 'addons';
    static description = 'attach an existing add-on resource to an app';
    static flags = {
      as: flags.string({description: 'name for add-on attachment'}),
      credential: flags.string({description: 'credential name for scoped access to Heroku Postgres'}),
      confirm: flags.string({description: 'overwrite existing add-on attachment with same name'}),
      app: flags.app({required: true}),
      remote: flags.remote(),
    };

    static args = {
      addon_name: Args.string({required: true}),
    };

    public async run(): Promise<void> {
      const {flags,  args} = await this.parse(Attach)
      const {app, credential, as, confirm} = flags
      const {body: addon} = await this.heroku.get<Heroku.AddOn>(`/addons/${encodeURIComponent(args.addon_name)}`)
      const createAttachment = async (confirmed?: string) =>  {
        let namespace: string | undefined
        if (credential && credential !== 'default') {
          namespace = 'credential:' + credential
        }

        const body = {
          name: as, app: {name: app}, addon: {name: addon.name}, confirm: confirmed, namespace,
        }

        ux.action.start(`Attaching ${credential ? color.yellow(credential) + ' of ' : ''}${color.yellow(addon.name || '')}${as ? ' as ' + color.cyan(as) : ''} to ${color.magenta(app)}`)
        const {body: attachments} = await this.heroku.post<Heroku.AddOnAttachment>('/addon-attachments', {body})
        ux.action.stop()
        return attachments
      }

      if (credential && credential !== 'default') {
        const {body: credentialConfig} = await this.heroku.get<Heroku.AddOnConfig[]>(`/addons/${addon.name}/config/credential:${encodeURIComponent(credential)}`)
        if (credentialConfig.length === 0) {
          throw new Error(`Could not find credential ${credential} for database ${addon.name}`)
        }
      }

      const attachment = await trapConfirmationRequired<Heroku.AddOnAttachment>(app, confirm, (confirmed?: string) => createAttachment(confirmed))
      ux.action.start(`Setting ${color.cyan(attachment.name || '')} config vars and restarting ${color.magenta(app)}`)
      const {body: releases} = await this.heroku.get<Heroku.Release[]>(`/apps/${app}/releases`, {
        partial: true, headers: {Range: 'version ..; max=1, order=desc'},
      })
      ux.action.stop(`done, v${releases[0].version}`)
    }
}
