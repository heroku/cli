'use strict'

let cli = require('heroku-cli-util')
let co = require('co')
let _ = require('lodash')
let util = require('../../lib/util')

function * run (context, heroku) {
  let plans = yield heroku.get(`/addon-services/${context.args.service}/plans`)
  plans = _.sortBy(plans, 'price.cents')

  if (context.flags.json) {
    cli.styledJSON(plans)
  } else {
    cli.table(plans, {
      columns: [
        {key: 'default', label: '', format: (d) => d ? 'default' : ''},
        {key: 'name', label: 'slug'},
        {key: 'human_name', label: 'name'},
        {key: 'price', format: util.formatPrice}
      ]
    })
  }
}

module.exports = {
  topic: 'addons',
  command: 'plans',
  description: 'list all available plans for an add-on services',
  args: [{name: 'service'}],
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
