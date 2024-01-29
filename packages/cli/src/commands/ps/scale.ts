import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {compact} from 'lodash'

const emptyFormationErr = (app: string) => {
  return new Error(`No process types on ${color.magenta(app)}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
}

export default class Scale extends Command {
  static strict = false
  static description = 'scale dyno quantity up or down'

  static help = `Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

Omitting any arguments will display the app's current dyno formation, in a
format suitable for passing back into ps:scale.`

  static examples = [
    `$ heroku ps:scale web=3:Standard-2X worker+1 --app APP
Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.

$ heroku ps:scale --app APP
web=3:Standard-2X worker=1:Standard-1X`,
  ]

  static aliases = ['dyno:scale', 'scale']

  static flags = {
    app: flags.app({required: true}),
  }

  public async run(): Promise<void> {
    const {flags, ...restParse} = await this.parse(Scale)
    const argv = restParse.argv as string[]
    const {app} = flags
    function parse(argv: string[]) {
      return compact(argv.map(arg => {
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

    if (changes.length === 0) {
      const {body: appProps} = await this.heroku.get<Heroku.App>(`/apps/${app}`)
      const {body: formation} = await this.heroku.get<Heroku.Formation[]>(`/apps/${app}/formation`)
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        formation.forEach(d => {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        })
      }

      if (formation.length === 0)
        throw emptyFormationErr(app)
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
