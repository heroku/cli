import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import heredoc from 'tsheredoc'
import color from '@heroku-cli/color'

export type SpaceTopology = {
  version: number,
  apps: Array<{
    id?: string
    domains: string[]
    formations: Array<{
      process_type: string
      dynos: Array<{
        number: number
        private_ip: string
        hostname: string
      }>
    }>
  }>
}

export default class Topology extends Command {
  static topic = 'spaces';
  static description = 'show space topology';
  static flags = {
    space: flags.string({char: 's', description: 'space to get topology of'}),
    json: flags.boolean({description: 'output in json format'}),
  };

  static args = {
    space: Args.string({hidden: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Topology)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      ux.error(heredoc(`
        Error: Missing 1 required arg:
        space
        See more help with --help
      `))
    }

    const {body: topology} = await this.heroku.get<SpaceTopology>(`/spaces/${spaceName}/topology`)
    let appInfo: Heroku.App[] = []
    if (topology.apps) {
      appInfo = await Promise.all(topology.apps.map(async topologyApp => {
        const {body: app} = await this.heroku.get<Heroku.App>(`/apps/${topologyApp.id}`)
        return app
      }))
    }

    this.render(topology, appInfo, flags.json)
  }

  protected render(topology: SpaceTopology, appInfo: Heroku.App[], json: boolean) {
    if (json) {
      ux.styledJSON(topology)
    } else if (topology.apps) {
      topology.apps.forEach(app => {
        const formations: string[] = []
        const dynos: string[] = []
        if (app.formations) {
          app.formations.forEach(formation => {
            formations.push(formation.process_type)
            if (formation.dynos) {
              formation.dynos.forEach(dyno => {
                const dynoS = [`${formation.process_type}.${dyno.number}`, dyno.private_ip, dyno.hostname].filter(Boolean)
                dynos.push(dynoS.join(' - '))
              })
            }
          })
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
          header += ` (${color.cyan(formations.join(', '))})`
        }

        ux.styledHeader(header || '')
        ux.styledObject({
          Domains: domains, Dynos: dynos,
        }, ['Domains', 'Dynos'])
        ux.log()
      })
    }
  }

  protected getProcessType(s: string) {
    return s.split('-', 2)[0].split('.', 2)[0]
  }

  protected getProcessNum(s: string) {
    return Number.parseInt(s.split('-', 2)[0].split('.', 2)[1], 10)
  }
}
