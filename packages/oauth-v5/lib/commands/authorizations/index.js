'use strict'

const cli = require('@heroku/heroku-cli-util')

async function run(context, heroku) {
  const _ = require('lodash')
  let authorizations = await heroku.get('/oauth/authorizations')
  authorizations = _.sortBy(authorizations, 'description')

  if (context.flags.json) {
    cli.styledJSON(authorizations)
  } else if (authorizations.length === 0) {
    cli.log('No OAuth authorizations.')
  } else {
    cli.table(authorizations, {
      printHeader: null,
      columns: [
        {key: 'description', format: v => cli.color.green(v)},
        {key: 'id'},
        {key: 'scope', format: v => v.join(',')},
      ],
    })
  }
}

module.exports = {
  topic: 'authorizations',
  description: 'list OAuth authorizations',
  needsAuth: true,
  flags: [
    {name: 'json', char: 'j', description: 'output in json format'},
  ],
  run: cli.command(run),
}
