'use strict'

let cli = require('heroku-cli-util')
let co = require('co')

function * run (context, heroku) {
  let services = yield heroku.get('/addon-services')

  if (context.flags.json) {
    cli.styledJSON(services)
  } else {
    cli.table(services, {
      columns: [
        {key: 'name', label: 'slug'},
        {key: 'human_name', label: 'name'},
        {key: 'state', label: 'state'}
      ]
    })
    cli.log(`
See plans with ${cli.color.blue('heroku addons:plans SERVICE')}`)
  }
}

module.exports = {
  topic: 'addons',
  command: 'services',
  description: 'list all available add-on services',
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
