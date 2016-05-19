'use strict'

const cli = require('heroku-cli-util')
const co = require('co')

function display (spaces) {
  cli.table(spaces, {
    columns: [
      {key: 'name', label: 'Name'},
      {key: 'organization.name', label: 'Organization'},
      {key: 'region.name', label: 'Region'},
      {key: 'state', label: 'State'},
      {key: 'created_at', label: 'Created At'}
    ]
  })
}

function displayJSON (spaces) {
  cli.log(JSON.stringify(spaces, null, 2))
}

function * run (context, heroku) {
  const sortBy = require('lodash.sortby')

  let spaces = yield heroku.get('/spaces')
  if (context.org) {
    spaces = spaces.filter((s) => s.organization.name === context.org)
  }
  spaces = sortBy(spaces, 'name')
  if (context.flags.json) displayJSON(spaces)
  else if (spaces.length === 0) {
    if (context.org) throw new Error(`No spaces in ${cli.color.cyan(context.org)}.`)
    else throw new Error('You do not have access to any spaces.')
  } else {
    display(spaces)
  }
}

module.exports = {
  topic: 'spaces',
  description: 'list available spaces',
  wantsOrg: true,
  needsAuth: true,
  flags: [
    {name: 'json', description: 'output in json format'}
  ],
  run: cli.command(co.wrap(run))
}
