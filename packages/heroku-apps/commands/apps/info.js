'use strict'

const co = require('co')
const cli = require('heroku-cli-util')

function * run (context, heroku) {
  const filesize = require('filesize')
  const util = require('util')
  const S = require('string')
  const countBy = require('lodash.countby')

  function * getInfo (app) {
    let promises = {
      addons: heroku.get(`/apps/${app}/addons`),
      app: heroku.request({
        path: `/apps/${app}`,
        headers: {'Accept': 'application/vnd.heroku+json; version=3.cedar-acm'}
      }),
      dynos: heroku.get(`/apps/${app}/dynos`).catch(() => []),
      collaborators: heroku.get(`/apps/${app}/collaborators`).catch(() => []),
      pipeline: heroku.get(`/apps/${app}/pipeline-couplings`).catch(() => null)
    }

    if (context.flags.extended) {
      promises.appExtended = heroku.get(`/apps/${app}?extended=true`)
    }

    let data = yield promises

    if (context.flags.extended) {
      data.appExtended.acm = data.app.acm
      data.app = data.appExtended
      delete data['appExtended']
    }

    return data
  }

  let app = context.args.app || context.app
  if (!app) throw new Error('No app specified.\nUSAGE: heroku info my-app')

  context.app = app // make sure context.app is always set for herkou-cli-util

  let info = yield getInfo(app)
  let addons = info.addons.map(a => a.plan.name).sort()
  let collaborators = info.collaborators.map(c => c.user.email).filter(c => c !== info.app.owner.email).sort()

  function print () {
    let data = {}
    data.Addons = addons
    data.Collaborators = collaborators

    if (info.app.archived_at) data['Archived At'] = cli.formatDate(new Date(info.app.archived_at))
    if (info.app.cron_finished_at) data['Cron Finished At'] = cli.formatDate(new Date(info.app.cron_finished_at))
    if (info.app.cron_next_run) data['Cron Next Run'] = cli.formatDate(new Date(info.app.cron_next_run))
    if (info.app.database_size) data['Database Size'] = filesize(info.app.database_size, {round: 0})
    if (info.app.create_status !== 'complete') data['Create Status'] = info.app.create_status
    if (info.app.space) data['Space'] = info.app.space.name
    if (info.pipeline) data['Pipeline'] = `${info.pipeline.pipeline.name} - ${info.pipeline.stage}`

    data['Auto Cert Mgmt'] = info.app.acm
    data['Git URL'] = info.app.git_url
    data['Web URL'] = info.app.web_url
    data['Repo Size'] = filesize(info.app.repo_size, {round: 0})
    data['Slug Size'] = filesize(info.app.slug_size, {round: 0})
    data['Owner'] = info.app.owner.email
    data['Region'] = info.app.region.name
    data['Dynos'] = countBy(info.dynos, 'type')
    data['Stack'] = info.app.stack.name

    cli.styledHeader(info.app.name)
    cli.styledObject(data)

    if (context.flags.extended) {
      cli.log('\n\n--- Extended Information ---\n\n')
      if (info.app.extended) {
        cli.log(util.inspect(info.app.extended))
      }
    }
  }

  function shell () {
    function print (k, v) {
      cli.log(`${S(k).underscore()}=${v}`)
    }
    print('auto_cert_mgmt', info.app.acm)
    print('addons', addons)
    print('collaborators', collaborators)

    if (info.app.archived_at) print('archived_at', cli.formatDate(new Date(info.app.archived_at)))
    if (info.app.cron_finished_at) print('cron_finished_at', cli.formatDate(new Date(info.app.cron_finished_at)))
    if (info.app.cron_next_run) print('cron_next_run', cli.formatDate(new Date(info.app.cron_next_run)))
    if (info.app.database_size) print('database_size', filesize(info.app.database_size, {round: 0}))
    if (info.app.create_status !== 'complete') print('create_status', info.app.create_status)
    if (info.pipeline) print('pipeline', `${info.pipeline.pipeline.name}:${info.pipeline.stage}`)

    print('git_url', info.app.git_url)
    print('web_url', info.app.web_url)
    print('repo_size', filesize(info.app.repo_size, {round: 0}))
    print('slug_size', filesize(info.app.slug_size, {round: 0}))
    print('owner', info.app.owner.email)
    print('region', info.app.region.name)
    print('dynos', util.inspect(countBy(info.dynos, 'type')))
    print('stack', info.app.stack.name)
  }

  if (context.flags.shell) {
    shell()
  } else if (context.flags.json) {
    cli.styledJSON(info)
  } else {
    print()
  }
}

let cmd = {
  description: 'show detailed app information',
  help: `Examples:

 $ heroku apps:info
 === example
 Git URL:   https://git.heroku.com/example.git
 Repo Size: 5M
 ...

 $ heroku apps:info --shell
 git_url=https://git.heroku.com/example.git
 repo_size=5000000
 ...`,
  wantsApp: true,
  needsAuth: true,
  args: [{name: 'app', hidden: true, optional: true}],
  flags: [
    {name: 'shell', char: 's', description: 'output more shell friendly key/value pairs'},
    {name: 'extended', char: 'x', hidden: true},
    {name: 'json', char: 'j'}
  ],
  run: cli.command({preauth: true}, co.wrap(run))
}

module.exports = [
  Object.assign({topic: 'apps', command: 'info'}, cmd),
  Object.assign({topic: 'info', hidden: true}, cmd)
]
