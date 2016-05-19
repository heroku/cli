'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function * run (context, heroku) {
  const sortBy = require('lodash.sortby')

  let regions = yield heroku.get('/regions')
  regions = sortBy(regions, ['private_capable', 'name'])
  if (context.flags.json) {
    cli.log(JSON.stringify(regions, 0, 2))
  } else {
    cli.table(regions, {
      columns: [
        {key: 'name', label: 'ID', format: (n) => cli.color.green(n)},
        {key: 'description', label: 'Location'},
        {key: 'private_capable', label: 'Runtime', format: (c) => c ? 'Private Spaces' : 'Common Runtime'}
      ]
    })
  }
}

module.exports = {
  topic: 'regions',
  description: 'list available regions for deployment',
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
