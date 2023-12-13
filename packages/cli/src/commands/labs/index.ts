import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {sortBy} from 'lodash'

interface Features {
  currentUser: Heroku.Account,
  user: Heroku.AccountFeature,
  app?: Heroku.AppFeature | null,
}

function printJSON(features: Heroku.Account | Heroku.AccountFeature | Heroku.AppFeature) {
  ux.log(JSON.stringify(features, null, 2))
}

function printFeatures(features: Heroku.AppFeature | Heroku.AccountFeature) {
  const groupedFeatures = sortBy<(Heroku.AppFeature | Heroku.AccountFeature)>(features, 'name')
  const longest = Math.max(...groupedFeatures.map(f => f.name.length))
  for (const f of groupedFeatures) {
    let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name?.padEnd(longest) ?? ''}`
    if (f.enabled) line = color.green(line)
    line = `${line}  ${f.description}`
    ux.log(line)
  }
}

export default class LabsIndex extends Command {
  static description = 'list experimental features'
  static topic = 'labs'

  static flags = {
    app: flags.app({required: false}),
    json: flags.boolean({description: 'display as json', required: false}),
  }

  async run() {
    const {flags} = await this.parse(LabsIndex)
    const [currentUserResponse, userResponse, appResponse] = await Promise.all([
      this.heroku.get<Heroku.Account>('/account'),
      this.heroku.get<Heroku.AccountFeature>('/account/features'),
      (flags.app ? this.heroku.get<Heroku.AppFeature>(`/apps/${flags.app}/features`) : null),
    ])

    let app = null
    const currentUser = currentUserResponse.body
    const user = userResponse.body

    const features: Features = {
      currentUser,
      user,
    }

    // makes sure app isn't added to json object if null
    // eslint-disable-next-line no-negated-condition
    if (appResponse !== null) {
      app = appResponse?.body
      features.app = app
    } else {
      features.app = app
    }

    // general features are managed via `features` not `labs`
    features.user = features.user.filter((f: Record<string, string>) => f.state !== 'general')
    if (features.app) features.app = features.app.filter((f: Record<string, string>) => f.state !== 'general')
    if (flags.json) {
      printJSON({currentUser, user})
    } else {
      ux.styledHeader(`User Features ${color.cyan(features.currentUser.email!)}`)
      printFeatures(features.user)
      if (features.app) {
        ux.log()
        ux.styledHeader(`App Features ${color.app(flags.app!)}`)
        printFeatures(features.app)
      }
    }
  }
}
