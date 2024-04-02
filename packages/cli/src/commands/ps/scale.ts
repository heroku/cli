import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {compact} from 'lodash'
import heredoc from 'tsheredoc'
import {HTTPError} from 'http-call'

const emptyFormationErr = (app: string) => {
  return new Error(`No process types on ${color.magenta(app)}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
}

export default class Scale extends Command {
  static strict = false
  static description = heredoc`
    scale dyno quantity up or down
    Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

    Omitting any arguments will display the app's current dyno formation, in a
    format suitable for passing back into ps:scale.
  `
  static examples = [heredoc`
    $ heroku ps:scale web=3:Standard-2X worker+1 --app APP
    Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.
  `, heredoc`
    $ heroku ps:scale --app APP
    web=3:Standard-2X worker=1:Standard-1X
  `]

  static aliases = ['dyno:scale', 'scale']
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Scale)
    const argv = restParse.argv as string[]
    const {app} = flags

    // will remove this flag once we have
    // successfully launched larger dyno sizes
    let isLargerDyno = false
    const {body: largerDynoFeatureFlag} = await this.heroku.get<Heroku.AccountFeature>('/account/features/frontend-larger-dynos')
      .catch((error: HTTPError) => {
        if (error.statusCode === 404) {
          return {body: {enabled: false}}
        }

        throw error
      })

    function parse(args: string[]) {
      return compact(args.map(arg => {
        const change = arg.match(/^([\w-]+)([=+-]\d+)(?::([\w-]+))?$/)
        if (!change)
          return
        const quantity = change[2][0] === '=' ? change[2].slice(1) : change[2]
        if (change[3])
          change[3] = change[3].replace('Shield-', 'Private-')
        return {type: change[1], quantity, size: change[3]}
      }))
    }

    const changes = parse(argv)

    // checks for larger dyno sizes
    // if the feature is not enabled
    if (!largerDynoFeatureFlag.enabled) {
      changes.forEach(({size}) => {
        const largerDynoNames = /^(?!standard-[12]x$)(performance|private|shield)-(l-ram|xl|2xl)$/i
        isLargerDyno = largerDynoNames.test(size)

        if (isLargerDyno) {
          const availableDynoSizes = 'eco, basic, standard-1x, standard-2x, performance-m, performance-l, private-s, private-m, private-l, shield-s, shield-m, shield-l'
          ux.error(`No such size as ${size}. Use ${availableDynoSizes}.`, {exit: 1})
        }
      })
    }

    if (changes.length === 0) {
      const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
      const {body: appProps} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        formation.forEach(d => {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        })
      }

      if (formation.length === 0) {
        throw emptyFormationErr(app)
      }

      ux.log(formation.map(d => `${d.type}=${d.quantity}:${d.size}`)
        .sort()
        .join(' '))
    } else {
      ux.action.start('Scaling dynos')
      const {body: appProps} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const {body: formation} = await this.heroku.patch<Heroku.Formation[]>(`/apps/${app}/formation`, {body: {updates: changes}})
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        formation.forEach(d => {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        })
      }

      const output = formation.filter(f => changes.find(c => c.type === f.type))
        .map(d => `${color.green(d.type || '')} at ${d.quantity}:${d.size}`)
      ux.action.stop(`done, now running ${output.join(', ')}`)
    }
  }
}
