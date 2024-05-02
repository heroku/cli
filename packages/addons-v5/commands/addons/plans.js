'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const util = require('../../lib/util')
  const _ = require('lodash')

  let plans = await heroku.get(`/addon-services/${context.args.service}/plans`)
  plans = _.sortBy(plans, ['price.contract', 'price.cents'])

  if (context.flags.json) {
    cli.styledJSON(plans)
  } else {
    cli.table(plans, {
      columns: [
        {key: 'default', label: '', format: d => d ? 'default' : ''},
        {key: 'name', label: 'slug'},
        {key: 'human_name', label: 'name'},
        {key: 'price', format: function (price) {
          return util.formatPrice({price, hourly: true})
        }},
        {key: 'price', label: 'max price', format: function (price) {
          return util.formatPrice({price, hourly: false})
        }},
      ],
    })
  }
}

module.exports = {
  topic: 'addons',
  command: 'plans',
  description: 'list all available plans for an add-on services',
  args: [{name: 'service'}],
  flags: [
    {name: 'json', description: 'output in json format'},
  ],
  run: cli.command(run),
}
