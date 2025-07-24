import {color} from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'

interface Features {
  currentUser: Heroku.Account,
  user: Heroku.AccountFeature,
  app?: Heroku.AppFeature | null,
}

function printJSON(features: Heroku.Account | Heroku.AccountFeature | Heroku.AppFeature) {
  ux.stdout(JSON.stringify(features, null, 2))
}

function printFeatures(features: Heroku.AccountFeature | Heroku.AppFeature) {
  const groupedFeatures = features.sort((a: Heroku.AccountFeature | Heroku.AppFeature, b: Heroku.AppFeature | Heroku.AccountFeature) =>
    (a.name || '').localeCompare(b.name || ''))
  const longest = Math.max(...groupedFeatures.map((f: Heroku.AccountFeature | Heroku.AppFeature) => (f.name || '').length))
  for (const f of groupedFeatures) {
    let line = `${f.enabled ? '[+]' : '[ ]'} ${f.name?.padEnd(longest) ?? ''}`
    if (f.enabled) line = color.green(line)
    line = `${line}  ${f.description}`
    ux.stdout(line)
  }
}

export default class LabsIndex extends Command {
  static description = 'list experimental features'
  static topic = 'labs'

  static flags = {
    app: flags.app({required: false}),
    remote: flags.remote(),
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
    // eslint-disable-next-line unicorn/no-negated-condition
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
      printJSON({app, user})
    } else {
      hux.styledHeader(`User Features ${color.cyan(features.currentUser.email!)}`)
      printFeatures(features.user)
      if (features.app) {
        ux.stdout()
        hux.styledHeader(`App Features ${color.app(flags.app!)}`)
        printFeatures(features.app)
      }
    }
  }
}
