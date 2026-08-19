import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {color, hux} from '@heroku/heroku-cli-util'
import {HerokuSDK} from '@heroku/sdk'
import {Args, ux} from '@oclif/core'
import tsheredoc from 'tsheredoc'

import {SpaceTopology} from '../../lib/types/spaces.js'

const heredoc = tsheredoc.default

export default class Topology extends Command {
  static args = {
    space: Args.string({hidden: true}),
  }
  static description = 'show space topology'
  static flags = {
    json: flags.boolean({description: 'output in json format'}),
    space: flags.string({char: 's', description: 'space to get topology of'}),
  }
  static topic = 'spaces'

  protected getProcessNum(s: string) {
    return Number.parseInt(s.split('-', 2)[0].split('.', 2)[1], 10)
  }

  protected getProcessType(s: string) {
    return s.split('-', 2)[0].split('.', 2)[0]
  }

  protected render(topology: SpaceTopology, appInfo: Heroku.App[], json: boolean) {
    if (json) {
      hux.styledJSON(topology)
    } else if (topology.apps) {
      for (const app of topology.apps) {
        const formations: string[] = []
        const dynos: string[] = []
        if (app.formations) {
          for (const formation of app.formations) {
            formations.push(formation.process_type)
            if (formation.dynos) {
              for (const dyno of formation.dynos) {
                const dynoS = [`${formation.process_type}.${dyno.number}`, dyno.private_ip, dyno.hostname].filter(Boolean)
                dynos.push(dynoS.join(' - '))
              }
            }
          }
        }

        const domains = app.domains.sort()
        formations.sort()
        dynos.sort((a, b) => {
          const apt = this.getProcessType(a)
          const bpt = this.getProcessType(b)
          if (apt > bpt) {
            return 1
          }

          if (apt < bpt) {
            return -1
          }

          return this.getProcessNum(a) - this.getProcessNum(b)
        })
        const info = appInfo.find(info => info.id === app.id)
        let header = info?.name
        if (formations.length > 0) {
          header += ` (${color.info(formations.join(', '))})`
        }

        hux.styledHeader(header || '')
        hux.styledObject({
          Domains: domains, Dynos: dynos,
        }, ['Domains', 'Dynos'])
        ux.stdout()
      }
    }
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(Topology)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {platform} = new HerokuSDK()
    const topology = await platform.spaceTopology.topology(spaceName as string) as SpaceTopology
    let appInfo: Heroku.App[] = []
    if (topology.apps) {
      appInfo = await Promise.all(topology.apps.map(async topologyApp => {
        return await platform.app.info(topologyApp.id as string) as Heroku.App
      }))
    }

    this.render(topology, appInfo, flags.json)
  }
}
