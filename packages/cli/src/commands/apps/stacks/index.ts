import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as _ from 'lodash'
import color from '@heroku-cli/color'
import * as Heroku from '@heroku-cli/schema'

function updateCedarName(stack: string) {
  if (stack === 'cedar') {
    return 'cedar-10'
  }

  return stack
}

export default class StacksIndex extends Command {
  static description = 'show the list of available stacks'
  static topic = 'apps'
  static aliases = ['stack']

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags} = await this.parse(StacksIndex)

    const [appResponse, stackResponse] = await Promise.all([
      this.heroku.get<Heroku.App>(`/apps/${flags.app}`),
      this.heroku.get<Heroku.Stack[]>('/stacks'),
    ])

    const app = appResponse.body
    const stacks = stackResponse.body
    const sortedStacks = _.sortBy(stacks, 'name')

    ux.styledHeader(`${color.app(app.name!)} Available Stacks`)
    for (const stack of sortedStacks) {
      if (stack.name === app.stack!.name) {
        ux.log(color.green('* ' + updateCedarName(stack.name!)))
      } else if (stack.name === app.build_stack!.name) {
        ux.log(`  ${updateCedarName(stack.name!)} (active on next deploy)`)
      } else {
        ux.log(`  ${updateCedarName(stack.name!)}`)
      }
    }
  }
}
