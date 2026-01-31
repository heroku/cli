import {color} from '@heroku/heroku-cli-util'
import {Command, flags} from '@heroku-cli/command'
import * as Heroku from '@heroku-cli/schema'
import {Args, ux} from '@oclif/core'

import push from '../../../lib/git/push.js'

function map(stack: string): string {
  return stack === 'cedar-10' ? 'cedar' : stack
}

export default class Set extends Command {
  static args = {
    stack: Args.string({description: 'unique name or identifier of the stack', required: true}),
  }

  static description = 'set the stack of an app'

  static example = `${color.command('heroku stack:set heroku-24 -a myapp')}
Setting stack to heroku-24... done
You will need to redeploy myapp for the change to take effect.
Run git push heroku main to trigger a new build on myapp.`

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static hiddenAliases = ['stack:set']

  async run() {
    const {args, flags} = await this.parse(Set)
    const stack = map(args.stack)

    ux.action.start(`Setting stack to ${color.name(stack)}`)
    const {body: app} = await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {
      body: {build_stack: stack},
    })

    // A redeployment is not required for apps that have never been deployed, since
    // API updates the app's `stack` to match `build_stack` immediately.
    if (app.stack?.name !== app.build_stack?.name) {
      ux.stdout(`You will need to redeploy ${color.app(flags.app)} for the change to take effect.`)
      ux.stdout(`Run ${color.code(push(flags.remote))} to trigger a new build on ${color.app(flags.app)}.`)
    }

    ux.action.stop()
  }
}
