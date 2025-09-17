import {ux} from '@oclif/core'
import {hux} from '@heroku/heroku-cli-util'
import {color} from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'
import {flags, Command} from '@heroku-cli/command'

function styledDrain(id: string, name: string, drain: Heroku.LogDrain) {
  let output = `${id} (${name})`
  if (drain.extended) output += ` drain_id=${drain.extended.drain_id}`
  ux.stdout(output)
}

export default class Drains extends Command {
  static description = 'display the log drains of an app'

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
    extended: flags.boolean({char: 'x', hidden: true}),
    json: flags.boolean({description: 'output in json format'}),
  }

  async run() {
    const {flags} = await this.parse(Drains)

    let path = `/apps/${flags.app}/log-drains`
    if (flags.extended) {
      path += '?extended=true'
    }

    const {body: drains} = await this.heroku.get<Heroku.LogDrain[]>(path)

    if (flags.json) {
      hux.styledJSON(drains)
    } else {
      const [drainsWithAddons, drainsWithoutAddons] = drains.reduce<Heroku.LogDrain[]>(
        (acc, drain) => {
          if(drain.addon){
            acc[0].push(drain)
          } else{
             acc[1].push(drain) 
          }
          return acc
        }, [[],[]]
      )

      if (drainsWithoutAddons.length > 0) {
        hux.styledHeader('Drains')
        drainsWithoutAddons.forEach((drain: Heroku.LogDrain) => {
          styledDrain(drain.url || '', color.green(drain.token || ''), drain)
        })
      }

      if (drainsWithAddons.length > 0) {
        const addons = await Promise.all(
          drainsWithAddons.map((d: Heroku.LogDrain) => this.heroku.get<Heroku.AddOn>(`/apps/${flags.app}/addons/${d.addon?.name}`)),
        )
        hux.styledHeader('Add-on Drains')
        addons.forEach(({body: addon}, i) => {
          styledDrain(color.yellow(addon.plan?.name || ''), color.green(addon.name || ''), drainsWithAddons[i])
        })
      }
    }
  }
}
