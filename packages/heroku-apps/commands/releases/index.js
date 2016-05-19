'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const statusHelper = require('./status_helper')
  const time = require('../../lib/time')
  const truncate = require('lodash.truncate')

  let descriptionWithStatus = function (d, r) {
    const width = () => process.stdout.columns > 80 ? process.stdout.columns : 80
    const trunc = (s, l) => truncate(s, {length: width() - (60 + l), omission: '…'})

    let status = statusHelper(r.status)
    let sc = ''
    if (status.content !== undefined) {
      sc = cli.color[status.color](status.content)
    }
    return trunc(d, sc.length) + ' ' + sc
  }

  let url = `/apps/${context.app}/releases`
  if (context.flags.extended) url = url + '?extended=true'
  let releases = yield heroku.request({
    path: url,
    partial: true,
    headers: {
      'Range': `version ..; max=${context.flags.num || 15}, order=desc`
    }
  })

  if (context.flags.json) {
    cli.log(JSON.stringify(releases, null, 2))
  } else if (context.flags.extended) {
    cli.styledHeader(`${context.app} Releases`)
    cli.table(releases, {
      printHeader: false,
      columns: [
        {key: 'version', format: (v, r) => cli.color[statusHelper(r.status).color]('v' + v)},
        {key: 'description', format: descriptionWithStatus},
        {key: 'user', format: (u) => cli.color.magenta(u.email.replace(/@addons\.heroku\.com$/, ''))},
        {key: 'created_at', format: (t) => time.ago(new Date(t))},
        {key: 'extended.slug_id'},
        {key: 'extended.slug_uuid'}
      ]
    })
  } else if (releases.length === 0) {
    cli.log(`${context.app} has no releases.`)
  } else {
    cli.styledHeader(`${context.app} Releases`)
    cli.table(releases, {
      printHeader: false,
      columns: [
        {key: 'version', label: '', format: (v, r) => cli.color[statusHelper(r.status).color]('v' + v)},
        {key: 'description', format: descriptionWithStatus},
        {key: 'user', format: (u) => cli.color.magenta(u.email)},
        {key: 'created_at', format: (t) => time.ago(new Date(t))}
      ]
    })
  }
}

module.exports = {
  topic: 'releases',
  description: 'display the releases for an app',
  help: `
Example:

 $ heroku releases
 === example Releases
 v1 Config add FOO_BAR email@example.com 2015/11/17 17:37:41 (~ 1h ago)
 v2 Config add BAR_BAZ email@example.com 2015/11/17 17:37:41 (~ 1h ago)
 v3 Config add BAZ_QUX email@example.com 2015/11/17 17:37:41 (~ 1h ago)`,
  needsApp: true,
  needsAuth: true,
  flags: [
    {name: 'num', char: 'n', description: 'number of releases to show', hasValue: true},
    {name: 'json', description: 'output releases in json format'},
    {name: 'extended', char: 'x', hidden: true}
  ],
  run: cli.command(co.wrap(run))
}
