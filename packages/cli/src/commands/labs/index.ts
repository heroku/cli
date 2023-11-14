import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

function printJSON(features) {
  ux.log(JSON.stringify(features, null, 2))
}

function printFeatures(features) {
  const {sortBy} = require('lodash')

  features = sortBy(features, 'name')
  const longest = Math.max.apply(null, features.map(f => f.name.length))
  for (const f of features) {
    let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name.padEnd(longest)}`
    if (f.enabled) line = color.green(line)
    line = `${line}  ${f.description}`
    ux.log(line)
  }
}

export default class LabsIndex extends Command {
  static description = 'list experimental features'
  static topic = 'labs'

  static args = {
    app: Args.string({required: true}),
  }

  static flags = {
    json: flags.boolean({description: 'display as json', required: false}),
  }

  async run() {
    const {args, flags} = await this.parse(LabsIndex)
    const [currentUser, user, app] = await Promise.all([
      this.heroku.get('/account'),
      this.heroku.get('/account/features'),
      args.app ? this.heroku.get(`/apps/${args.app}/features`) : null,
    ])

    const features = {
      currentUser,
      user,
      app,
    }
    // general features are managed via `features` not `labs`
    features.user = features.user.filter(f => f.state !== 'general')
    if (features.app) features.app = features.app.filter(f => f.state !== 'general')
    if (flags.json) {
      delete features.currentUser
      printJSON(features)
    } else {
      ux.styledHeader(`User Features ${color.cyan(features.currentUser.email)}`)
      printFeatures(features.user)
      if (features.app) {
        ux.log()
        ux.styledHeader(`App Features ${color.app(args.app)}`)
        printFeatures(features.app)
      }
    }
  }
}
