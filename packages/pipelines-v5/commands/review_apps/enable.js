const cli = require('heroku-cli-util')
const co = require('co')
const { flags } = require('@heroku-cli/command')
const api = require('../../lib/api')
const KolkrabbiAPI = require('../../lib/kolkrabbi-api')

module.exports = {
  topic: 'reviewapps',
  command: 'enable',
  description: 'enable review apps and/or settings on an existing pipeline',
  examples: `$ heroku reviewapps:enable -p mypipeline --a myapp --autodeploy --autodestroy
Enabling review apps ...
Enabling auto deployment ...
Enabling auto destroy ...
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
      name: 'remote',
      char: 'r',
      description: 'git remote of parent app used by review apps',
      hasValue: true,
      required: false
    },
    {
      name: 'autodeploy',
      description: 'autodeploy the review app',
      hasValue: false
    },
    {
      name: 'autodestroy',
      description: 'autodestroy the review app',
      hasValue: false
    }
  ],
  run: cli.command(co.wrap(function * (context, heroku) {
    const kolkrabbi = new KolkrabbiAPI(context.version, heroku.options.token)

    const settings = {
      pull_requests: {
        enabled: true
      }
    }

    if (context.flags.autodeploy) {
      cli.log('Enabling auto deployment...')
      settings.pull_requests.auto_deploy = true
    }
    if (context.flags.autodestroy) {
      cli.log('Enabling auto destroy...')
      settings.pull_requests.auto_destroy = true
    }

    let app = yield api.getApp(heroku, context.flags.app)

    yield cli.action(
      'Configuring pipeline',
      kolkrabbi.updateAppLink(app.id, settings)
    )
  }))
}
