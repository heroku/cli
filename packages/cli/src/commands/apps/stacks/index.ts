import {ux} from '@oclif/core'
import {Command, flags} from '@heroku-cli/command'
import * as _ from 'lodash'
import color from '@heroku-cli/color'
import {Stacks} from '../../../lib/types/stacks'
import {App} from '../../../lib/types/app'

export default class StacksIndex extends Command {
  static description = 'show the list of available stacks'
  static topic = 'apps'
  static aliases = ['apps:stacks:index', 'stack']

  static flags = {
    app: flags.app({required: true}),
  }

  async run() {
    const {flags} = await this.parse(StacksIndex)

    const {body: app} = await this.heroku.get<App>(`/apps/${flags.app}`)
    let {body: stacks} = await this.heroku.get<Stacks>('/stacks')

    stacks = _.sortBy(stacks, 'name')
    ux.styledHeader(`${color.app(app.name)} Available Stacks`)
    for (const stack of stacks) {
      if (stack.name === app.stack.name) {
        ux.log(color.green('* ' + stack.name))
      } else if (stack.name === app.build_stack.name) {
        ux.log(`  ${stack.name} (active on next deploy)`)
      } else {
        ux.log(`  ${stack.name}`)
      }
    }
  }
}
