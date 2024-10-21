import color from '@heroku-cli/color'
import {Command, flags} from '@heroku-cli/command'
import {Args, ux} from '@oclif/core'
import push from '../../../lib/git/push'
import * as Heroku from '@heroku-cli/schema'

function map(stack: string): string {
  return stack === 'cedar-10' ? 'cedar' : stack
}

export default class Set extends Command {
  static description = 'set the stack of an app'

  static example = `$ heroku stack:set heroku-24 -a myapp
Setting stack to heroku-24... done
You will need to redeploy myapp for the change to take effect.
Run git push heroku main to trigger a new build on myapp.`

  static hiddenAliases = ['stack:set']

  static flags = {
    app: flags.app({required: true}),
    remote: flags.remote(),
  }

  static args = {
    stack: Args.string({required: true, description: 'Unique name of stack or unique identifier of stack.'}),
  }

  async run() {
    const {flags, args} = await this.parse(Set)
    const stack = map(args.stack)

    ux.action.start(`Setting stack to ${color.green(stack)}`)
    const {body: app} = await this.heroku.patch<Heroku.App>(`/apps/${flags.app}`, {
      body: {build_stack: stack},
    })

    // A redeployment is not required for apps that have never been deployed, since
    // API updates the app's `stack` to match `build_stack` immediately.
    if (app.stack?.name !== app.build_stack?.name) {
      ux.log(`You will need to redeploy ${color.app(flags.app)} for the change to take effect.`)
      ux.log(`Run ${color.cmd(push(flags.remote))} to trigger a new build on ${color.app(flags.app)}.`)
    }

    ux.action.stop()
  }
}
