import {Command, flags} from '@heroku-cli/command'
import * as color from '@heroku/heroku-cli-util/color'
import {HerokuSDK} from '@heroku/sdk'
import {ux} from '@oclif/core/ux'
import tsheredoc from 'tsheredoc'

import {lazyModuleLoader} from '../../lib/lazy-module-loader.js'
import {type ScaleUpdate, scaleDynos} from '../../lib/ps/sdk-adapter.js'

const heredoc = tsheredoc.default

const emptyFormationErr = (app: string) => (
  new Error(`No process types on ${color.app(app)}.\nUpload a Procfile to add process types.\nhttps://devcenter.heroku.com/articles/procfile`)
)

export default class Scale extends Command {
  static aliases = ['dyno:scale']
  static description = heredoc`
    scale dyno quantity up or down
    Appending a size (eg. web=2:Standard-2X) allows simultaneous scaling and resizing.

    Omitting any arguments will display the app's current dyno formation, in a
    format suitable for passing back into ps:scale.
  `
  static examples = [heredoc`
    ${color.command('heroku ps:scale web=3:Standard-2X worker+1 --app APP')}
    Scaling dynos... done, now running web at 3:Standard-2X, worker at 1:Standard-1X.
  `, heredoc`
    ${color.command('heroku ps:scale --app APP')}
    web=3:Standard-2X worker=1:Standard-1X
  `]
  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }
  static hiddenAliases = ['scale']
  static strict = false

  public async run(): Promise<void> {
    const _ = await lazyModuleLoader.loadLodash()

    const {flags, ...restParse} = await this.parse(Scale)
    const argv = restParse.argv as string[]
    const {app} = flags

    function parse(args: string[]): ScaleUpdate[] {
      return _.compact(args.map(arg => {
        const change = arg.match(/^([\w-]+)([=+-]\d+)(?::([\w-]+))?$/)
        if (!change)
          return
        const quantity = change[2][0] === '=' ? change[2].slice(1) : change[2]
        if (change[3])
          change[3] = change[3].replace('Shield-', 'Private-')
        return {quantity, size: change[3], type: change[1]}
      }))
    }

    const {platform} = new HerokuSDK()
    const changes = parse(argv)

    if (changes.length === 0) {
      const [formation, appProps] = await Promise.all([
        platform.formation.list(app),
        platform.app.info(app),
      ])
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        for (const d of formation) {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        }
      }

      if (formation.length === 0) {
        throw emptyFormationErr(app)
      }

      ux.stdout(formation.map(d => `${d.type}=${d.quantity}:${d.size}`)
        .sort()
        .join(' '))
    } else {
      ux.action.start('Scaling dynos')
      const [appProps, formation] = await Promise.all([
        platform.app.info(app),
        scaleDynos(platform, app, changes),
      ])
      const shielded = appProps.space && appProps.space.shield
      if (shielded) {
        for (const d of formation) {
          if (d.size !== undefined) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        }
      }

      const output = formation.filter(f => changes.find(c => c.type === f.type))
        .map(d => `${color.green(d.type || '')} at ${d.quantity}:${d.size}`)
      ux.action.stop(`done, now running ${output.join(', ')}`)
    }
  }
}
