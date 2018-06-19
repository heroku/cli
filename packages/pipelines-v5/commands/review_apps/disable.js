const cli = require('heroku-cli-util')
const co = require('co')
const { flags } = require('@heroku-cli/command')
const api = require('../../lib/api')
const KolkrabbiAPI = require('../../lib/kolkrabbi-api')

module.exports = {
  topic: 'reviewapps',
  command: 'disable',
  description: 'disable review apps or settings on an existing pipeline',
  examples: `$ heroku reviewapps:disable -p mypipeline -a myapp --autodeploy
Disabling auto deployment ...
Configuring pipeline... done`,
  needsApp: false,
  needsAuth: true,
  wantsOrg: false,
  args: [],
  flags: [
    flags.pipeline({ name: 'pipeline', required: true, hasValue: true }),
    {
      name: 'app',
      char: 'a',
      description: 'parent app used by review apps',
      hasValue: true,
      required: true
    },
    {
      name: 'autodeploy',
      description: 'disable autodeployments',
      hasValue: false
    },
    {
      name: 'autodestroy',
      description: 'disable automatically destroying review apps',
      hasValue: false
    }
  ],
  run: cli.command(co.wrap(function* (context, heroku) {
    let disable = false

    // if no flags are passed then the user is disabling review apps
    if (!context.flags.autodeploy && !context.flags.autodestroy) {
      disable = true
    }

    const kolkrabbi = new KolkrabbiAPI(context.version, heroku.options.token)

    const settings = {
      pull_requests: {
        enabled: !disable
      }
    }

    if (context.flags.autodeploy) {
      settings.pull_requests.auto_deploy = false
    }
    if (context.flags.autodestroy) {
      settings.pull_requests.auto_destroy = false
    }

    let app = yield api.getApp(heroku, context.flags.app)

    yield cli.action(
      'Configuring pipeline',
      kolkrabbi.updateAppLink(app.id, settings)
    )
  }))
}
