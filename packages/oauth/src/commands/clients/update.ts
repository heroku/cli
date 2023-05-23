import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {CliUx} from '@oclif/core'

import {validateURL} from '../../lib/clients'

interface Updates {
  redirect_uri?: string;
  name?: string;
}

const isEmpty = (o: Updates) => Object.keys(o).length === 0

const getUpdates = (flags: any) => {
  const updates: Updates = {}

  if (flags.url) updates.redirect_uri = validateURL(flags.url)
  if (flags.name) updates.name = flags.name

  return updates
}

export default class ClientsUpdate extends Command {
  static description = 'update OAuth client'

  static examples = [
    '$ heroku clients:update 3e304bda-d376-4278-bdea-6d6c08aa1359 --url https://amazing-client.herokuapp.com/auth/heroku/callback',
  ]

  static flags = {
    name: flags.string({char: 'n', description: 'change the client name'}),
    url: flags.string({description: 'change the client redirect URL'}),
  }

  static args = [{name: 'id', required: true}]

  async run() {
    const {args, flags} = await this.parse(ClientsUpdate)
    const body = getUpdates(flags)

    if (isEmpty(body)) this.error('No changes provided.')

    CliUx.ux.action.start(`Updating ${color.cyan(args.id)}`)

    await this.heroku.patch<Heroku.OAuthClient>(
      `/oauth/clients/${encodeURIComponent(args.id)}`,
      {body},
    )

    CliUx.ux.action.stop()
  }
}
