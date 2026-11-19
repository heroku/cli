import {Command, flags} from '@heroku-cli/command'
import {color, hux} from '@heroku/heroku-cli-util'
import {Args, ux} from '@oclif/core'

import {createSDK} from '../../lib/sdk.js'

export default class ClientsRotate extends Command {
  static args = {
    id: Args.string({description: 'ID of the OAuth client', required: true}),
  }
  static description = 'rotate OAuth client secret'
  static flags = {
    json: flags.boolean({char: 'j', description: 'output in json format'}),
    shell: flags.boolean({char: 's', description: 'output in shell format'}),
  }

  async run() {
    const {platform} = createSDK(this.heroku)
    const {args, flags} = await this.parse(ClientsRotate)

    ux.action.start(`Updating ${color.name(args.id)}`)

    const client = await platform.oauthClient.rotateCredentials(args.id)

    ux.action.stop()

    if (flags.json) {
      this.logJson(client)
    } else if (flags.shell) {
      ux.stdout(`HEROKU_OAUTH_ID=${client.id}`)
      ux.stdout(`HEROKU_OAUTH_SECRET=${client.secret}`)
    } else {
      this.log(hux.styledHeader(`${client.name}`))
      this.log(hux.styledObject(client))
    }
  }
}
