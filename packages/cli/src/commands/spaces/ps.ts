import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import * as Heroku from '@heroku-cli/schema'
import {ago} from '../../lib/time'

const getProcessNum = (s: string) => Number.parseInt(s.split('.', 2)[1], 10)

type SpaceDynosInfo = {
  app_name: string,
  dynos: Required<Heroku.Dyno>[]
}
export default class Ps extends Command {
  static topic = 'spaces';
  static description = 'list dynos for a space';
  static flags = {
    space: flags.string({char: 's', description: 'space to get dynos of'}),
    json: flags.boolean({description: 'output in json format'}),
  };

  static args = {
    space: Args.string({hidden: true}),
  };

  public async run(): Promise<void> {
    const {flags, args} = await this.parse(Ps)
    const spaceName = flags.space || args.space
    if (!spaceName) {
      throw new Error('Space name required.\nUSAGE: heroku spaces:ps my-space')
    }

    const [{body: spaceDynos}, {body: space}] = await Promise.all([
      this.heroku.get<SpaceDynosInfo[]>(`/spaces/${spaceName}/dynos`),
      this.heroku.get<Heroku.Space>(`/spaces/${spaceName}`),
    ])

    if (space.shield) {
      spaceDynos.forEach(spaceDyno => {
        spaceDyno.dynos.forEach(d => {
          if (d.size?.startsWith('Private')) {
            d.size = d.size.replace('Private-', 'Shield-')
          }
        })
      })
    }

    if (flags.json) {
      ux.styledJSON(spaceDynos)
    } else {
      this.render(spaceDynos)
    }
  }

  private render(spaceDynos?: SpaceDynosInfo[]) {
    spaceDynos?.forEach(spaceDyno => {
      this.printDynos(spaceDyno.app_name, spaceDyno.dynos)
    })
  }

  private printDynos(appName: string, dynos: Required<Heroku.Dyno>[]) {
    const dynosByCommand = new Map<string, string[]>()
    for (const dyno of dynos) {
      const since = ago(new Date(dyno.updated_at))
      const size = dyno.size ?? '1X'
      let key = ''
      let item = ''
      if (dyno.type === 'run') {
        key = 'run: one-off processes'
        item = `${dyno.name} (${size}): ${dyno.state} ${since}: ${dyno.command}`
      } else {
        key = `${color.green(dyno.type)} (${color.cyan(size)}): ${dyno.command}`
        const state = dyno.state === 'up' ? color.green(dyno.state) : color.yellow(dyno.state)
        item = `${dyno.name}: ${color.green(state)} ${color.dim(since)}`
      }

      if (!dynosByCommand.has(key)) {
        dynosByCommand.set(key, [])
      }

      dynosByCommand.get(key)?.push(item)
    }

    for (const [key, dynos] of dynosByCommand) {
      ux.styledHeader(`${appName} ${key} (${color.yellow(dynos.length)})`)
      dynos.sort((a, b) => getProcessNum(a) - getProcessNum(b))
      for (const dyno of dynos) {
        ux.log(dyno)
      }

      ux.log()
    }
  }
}
